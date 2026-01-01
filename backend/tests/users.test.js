const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock the database pool before importing the server
jest.mock('../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock the audit logger to prevent database calls during tests
jest.mock('../src/utils/auditLogger', () => ({
  logAction: jest.fn().mockResolvedValue(null)
}));

const app = require('../src/server');
const { pool } = require('../src/config/database');

describe('User API Endpoints', () => {
  // Mock users for different roles
  const mockTenantAdmin = {
    id: 'admin-user-id',
    email: 'admin@test.com',
    full_name: 'Test Admin',
    role: 'tenant_admin',
    tenant_id: 'tenant-id',
    is_active: true
  };

  const mockRegularUser = {
    id: 'regular-user-id',
    email: 'user@test.com',
    full_name: 'Regular User',
    role: 'user',
    tenant_id: 'tenant-id',
    is_active: true
  };

  const mockSuperAdmin = {
    id: 'super-admin-id',
    email: 'superadmin@test.com',
    full_name: 'Super Admin',
    role: 'super_admin',
    tenant_id: null,
    is_active: true
  };

  const mockNewUser = {
    id: 'new-user-id',
    email: 'newuser@test.com',
    full_name: 'New User',
    role: 'user',
    is_active: true,
    created_at: new Date()
  };

  // Create JWT tokens
  const tenantAdminToken = jwt.sign(
    { userId: mockTenantAdmin.id, tenantId: mockTenantAdmin.tenant_id, role: mockTenantAdmin.role },
    process.env.JWT_SECRET || 'test-secret'
  );

  const superAdminToken = jwt.sign(
    { userId: mockSuperAdmin.id, tenantId: mockSuperAdmin.tenant_id, role: mockSuperAdmin.role },
    process.env.JWT_SECRET || 'test-secret'
  );

  const regularUserToken = jwt.sign(
    { userId: mockRegularUser.id, tenantId: mockRegularUser.tenant_id, role: mockRegularUser.role },
    process.env.JWT_SECRET || 'test-secret'
  );

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock implementation that handles authentication queries
    pool.query.mockImplementation((query, params) => {
      // Handle authentication middleware query (SELECT user by ID)
      if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
        const userId = params && params[0];
        
        if (userId === mockTenantAdmin.id) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (userId === mockRegularUser.id) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (userId === mockSuperAdmin.id) {
          return Promise.resolve({ rows: [mockSuperAdmin] });
        } else {
          return Promise.resolve({ rows: [] });
        }
      }
      
      // Default response for other queries
      return Promise.resolve({ rows: [] });
    });
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  describe('POST /api/users', () => {
    it('should add a new user to tenant for tenant admin', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT max_users FROM tenants WHERE id')) {
          return Promise.resolve({ rows: [{ max_users: 10 }] });
        } else if (query && query.includes('SELECT COUNT(*) as count FROM users WHERE tenant_id')) {
          return Promise.resolve({ rows: [{ count: '3' }] });
        } else if (query && query.includes('SELECT id FROM users WHERE email = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [] }); // Email doesn't exist
        } else if (query && query.includes('INSERT INTO users')) {
          return Promise.resolve({ rows: [mockNewUser] });
        } else if (query && query.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      const userData = {
        fullName: 'New User',
        email: 'newuser@test.com',
        password: 'Password123!',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
    });

    it('should return 403 for regular user trying to add user', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT id, email, full_name, role, tenant_id FROM users WHERE id')) {
          // This is the authorization check in the controller
          return Promise.resolve({ rows: [{ id: mockRegularUser.id, role: mockRegularUser.role, tenant_id: mockRegularUser.tenant_id }] });
        }
        return Promise.resolve({ rows: [] });
      });

      const userData = {
        fullName: 'New User',
        email: 'newuser@test.com',
        password: 'Password123!',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(userData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid user data', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT id, email, full_name, role, tenant_id FROM users WHERE id')) {
          return Promise.resolve({ rows: [{ id: mockTenantAdmin.id, role: mockTenantAdmin.role, tenant_id: mockTenantAdmin.tenant_id }] });
        } else if (query && query.includes('SELECT max_users FROM tenants WHERE')) {
          return Promise.resolve({ rows: [{ max_users: 10 }] });
        } else if (query && query.includes('SELECT COUNT(*) as count FROM users WHERE')) {
          return Promise.resolve({ rows: [{ count: '3' }] });
        } else if (query && query.includes('SELECT id FROM users WHERE email = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [] }); // Email doesn't exist
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send({}) // Empty data
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 when email already exists', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT id, email, full_name, role, tenant_id FROM users WHERE id')) {
          return Promise.resolve({ rows: [{ id: mockTenantAdmin.id, role: mockTenantAdmin.role, tenant_id: mockTenantAdmin.tenant_id }] });
        } else if (query && query.includes('SELECT max_users FROM tenants WHERE')) {
          return Promise.resolve({ rows: [{ max_users: 10 }] });
        } else if (query && query.includes('SELECT COUNT(*) as count FROM users WHERE')) {
          return Promise.resolve({ rows: [{ count: '3' }] });
        } else if (query && query.includes('SELECT id FROM users WHERE email = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [{ id: 'existing-user-id', email: 'existing@test.com' }] }); // Email exists
        }
        return Promise.resolve({ rows: [] });
      });

      const userData = {
        fullName: 'New User',
        email: 'existing@test.com',
        password: 'Password123!',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users', () => {
    it('should return users for authenticated user', async () => {
      const mockUsers = [
        { id: 'user1', email: 'user1@test.com', full_name: 'User One', role: 'user', is_active: true, created_at: new Date() },
        { id: 'user2', email: 'user2@test.com', full_name: 'User Two', role: 'user', is_active: true, created_at: new Date() }
      ];

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT id, email, full_name, role, tenant_id FROM users WHERE tenant_id')) {
          return Promise.resolve({ rows: [mockRegularUser] }); // Check user permissions
        } else if (query && query.includes('SELECT id, email, full_name, role, is_active, created_at FROM users WHERE tenant_id')) {
          return Promise.resolve({ rows: mockUsers }); // Get users
        } else if (query && query.includes('SELECT COUNT(*) FROM users WHERE tenant_id')) {
          return Promise.resolve({ rows: [{ count: '2' }] }); // Count query
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/tenants/:tenantId', () => {
    it('should return users for specific tenant', async () => {
      const mockUsers = [
        { id: 'user1', email: 'user1@test.com', full_name: 'User One', role: 'user', is_active: true, created_at: new Date() }
      ];

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT id, email, full_name, role, tenant_id FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] }); // Check user permissions
        } else if (query && query.includes('SELECT id, email, full_name, role, is_active, created_at FROM users WHERE tenant_id')) {
          return Promise.resolve({ rows: mockUsers }); // Get users
        } else if (query && query.includes('SELECT COUNT(*) FROM users WHERE tenant_id')) {
          return Promise.resolve({ rows: [{ count: '1' }] }); // Count query
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .get('/api/users/tenants/tenant-id')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
    });

    it('should allow super admin to access users from any tenant', async () => {
      const mockUsers = [
        { id: 'user1', email: 'user1@test.com', full_name: 'User One', role: 'user', is_active: true, created_at: new Date() }
      ];

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockSuperAdmin] });
        } else if (query && query.includes('SELECT id, email, full_name, role, tenant_id FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockSuperAdmin] }); // Check super admin permissions
        } else if (query && query.includes('SELECT id, email, full_name, role, is_active, created_at FROM users WHERE tenant_id')) {
          return Promise.resolve({ rows: mockUsers }); // Get users
        } else if (query && query.includes('SELECT COUNT(*) FROM users WHERE tenant_id')) {
          return Promise.resolve({ rows: [{ count: '1' }] }); // Count query
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .get('/api/users/tenants/other-tenant-id')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
    });

    it('should return 403 for unauthorized access to different tenant', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT id, email, full_name, role, tenant_id FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] }); // Check user permissions
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .get('/api/users/tenants/different-tenant-id')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:userId', () => {
    it('should update user for authenticated user on their own account', async () => {
      const updateData = {
        fullName: 'Updated Name',
        email: 'updated@test.com'
      };

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT tenant_id FROM users WHERE id = $1')) {
          return Promise.resolve({ rows: [{ tenant_id: mockRegularUser.tenant_id }] }); // Get user to check tenant (user updating own account)
        } else if (query && query.includes('UPDATE users SET')) {
          return Promise.resolve({ rows: [] }); // Update user result
        } else if (query && query.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [] }); // Audit log
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .put('/api/users/regular-user-id')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow tenant admin to update any user in their tenant', async () => {
      const updateData = {
        fullName: 'Updated by Admin',
        role: 'admin'
      };

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT tenant_id FROM users WHERE id = $1')) {
          return Promise.resolve({ rows: [{ tenant_id: mockTenantAdmin.tenant_id }] }); // Get user to check tenant
        } else if (query && query.includes('UPDATE users SET')) {
          return Promise.resolve({ rows: [] }); // Update user result
        } else if (query && query.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [] }); // Audit log
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .put('/api/users/other-user-id')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 403 for unauthorized user update', async () => {
      const updateData = {
        fullName: 'Unauthorized Update'
      };

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT tenant_id FROM users WHERE id = $1')) {
          return Promise.resolve({ rows: [{ tenant_id: 'different-tenant-id' }] }); // Get user to check tenant (different tenant)
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .put('/api/users/user-from-different-tenant-id')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:userId', () => {
    it('should delete user for tenant admin', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT tenant_id FROM users WHERE id = $1')) {
          return Promise.resolve({ rows: [{ tenant_id: mockTenantAdmin.tenant_id }] }); // Get user to delete
        } else if (query && query.includes('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1')) {
          return Promise.resolve({ rows: [] }); // Unassign tasks
        } else if (query && query.includes('DELETE FROM users WHERE id = $1')) {
          return Promise.resolve({ rows: [] }); // Delete user
        } else if (query && query.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [] }); // Audit log
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .delete('/api/users/user-to-delete')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');
    });

    it('should return 403 for regular user trying to delete', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .delete('/api/users/other-user')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for tenant admin trying to delete themselves', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT tenant_id FROM users WHERE id = $1')) {
          return Promise.resolve({ rows: [{ tenant_id: mockTenantAdmin.tenant_id }] }); // Get user to delete (it's themselves)
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .delete('/api/users/admin-user-id')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});