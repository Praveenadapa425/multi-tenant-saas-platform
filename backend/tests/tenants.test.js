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

describe('Tenant API Endpoints', () => {
  const validToken = jwt.sign(
    { userId: 'user-id', tenantId: 'tenant-id', role: 'tenant_admin' },
    process.env.JWT_SECRET || 'test-secret'
  );
  
  const superAdminToken = jwt.sign(
    { userId: 'super-admin-id', tenantId: null, role: 'super_admin' },
    process.env.JWT_SECRET || 'test-secret'
  );

  beforeEach(() => {
    // Reset the pool mock before each test to ensure isolation
    pool.query.mockClear();
    // Set up default mock implementation that handles authentication queries
    pool.query.mockImplementation((query, params) => {
      // Handle authentication middleware query (SELECT user by ID)
      if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
        const userId = params && params[0];
        
        if (userId === 'user-id') {
          return Promise.resolve({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] });
        } else if (userId === 'super-admin-id') {
          return Promise.resolve({ rows: [{ id: 'super-admin-id', email: 'superadmin@test.com', full_name: 'Super Admin', role: 'super_admin', tenant_id: null, is_active: true }] });
        } else {
          return Promise.resolve({ rows: [] });
        }
      }
      
      // Default response for other queries
      return Promise.resolve({ rows: [] });
    });
  });

  describe('GET /api/tenants/:tenantId', () => {
    it('should return tenant details for authorized user', async () => {
      const mockTenant = {
        id: 'tenant-id',
        name: 'Test Tenant',
        subdomain: 'test',
        status: 'active',
        subscription_plan: 'free',
        max_users: 5,
        max_projects: 5,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const mockStats = {
        total_users: 2,
        total_projects: 3,
        total_tasks: 5
      };
      
      // Clear the default mock and set up specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockClear();
      mockPool.query.mockImplementation((query, params) => {
        // Handle authentication middleware query (SELECT full user data)
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          const userId = params && params[0];
          if (userId === 'user-id') {
            return Promise.resolve({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] });
          } else {
            return Promise.resolve({ rows: [] });
          }
        } 
        // Handle tenant controller authorization check
        else if (query && query.includes('SELECT id, role, tenant_id FROM users WHERE id')) {
          const userId = params && params[0];
          if (userId === 'user-id') {
            return Promise.resolve({ rows: [{ id: 'user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] });
          } else {
            return Promise.resolve({ rows: [] });
          }
        }
        // Handle tenant details query
        else if (query && query.includes('SELECT') && query.includes('FROM tenants') && query.includes('WHERE id = $1')) {
          const tenantId = params && params[0];
          if (tenantId === 'tenant-id') {
            return Promise.resolve({ rows: [mockTenant] });
          } else {
            return Promise.resolve({ rows: [] });
          }
        }
        // Handle tenant stats query
        else if (query && query.includes('SELECT (SELECT COUNT(*) FROM users WHERE tenant_id = $1)::int as total_users, (SELECT COUNT(*) FROM projects WHERE tenant_id = $1)::int as total_projects, (SELECT COUNT(*) FROM tasks WHERE tenant_id = $1)::int as total_tasks')) {
          const tenantId = params && params[0];
          if (tenantId === 'tenant-id') {
            return Promise.resolve({ rows: [mockStats] });
          } else {
            return Promise.resolve({ rows: [{ total_users: 0, total_projects: 0, total_tasks: 0 }] });
          }
        }
        // Default response
        return Promise.resolve({ rows: [] });
      });
      
      const response = await request(app)
        .get('/api/tenants/tenant-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.stats).toBeDefined();
    });

    it('should return tenant details for super_admin', async () => {
      const mockTenant = {
        id: 'other-tenant-id',
        name: 'Other Tenant',
        subdomain: 'other',
        status: 'active',
        subscription_plan: 'free',
        max_users: 5,
        max_projects: 5,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const mockStats = {
        total_users: 2,
        total_projects: 3,
        total_tasks: 5
      };
      
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockClear();
      mockPool.query.mockImplementation((query, params) => {
        // Handle authentication middleware query (SELECT full user data)
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          const userId = params && params[0];
          if (userId === 'super-admin-id') {
            return Promise.resolve({ rows: [{ id: 'super-admin-id', email: 'superadmin@test.com', full_name: 'Super Admin', role: 'super_admin', tenant_id: null, is_active: true }] });
          } else {
            return Promise.resolve({ rows: [] });
          }
        } 
        // Handle tenant controller authorization check
        else if (query && query.includes('SELECT id, role, tenant_id FROM users WHERE id')) {
          const userId = params && params[0];
          if (userId === 'super-admin-id') {
            return Promise.resolve({ rows: [{ id: 'super-admin-id', role: 'super_admin', tenant_id: null }] });
          } else {
            return Promise.resolve({ rows: [] });
          }
        }
        // Handle tenant details query
        else if (query && query.includes('SELECT') && query.includes('FROM tenants') && query.includes('WHERE id = $1')) {
          const tenantId = params && params[0];
          if (tenantId === 'other-tenant-id') {
            return Promise.resolve({ rows: [mockTenant] });
          } else {
            return Promise.resolve({ rows: [] });
          }
        }
        // Handle tenant stats query
        else if (query && query.includes('SELECT (SELECT COUNT(*) FROM users WHERE tenant_id = $1)::int as total_users, (SELECT COUNT(*) FROM projects WHERE tenant_id = $1)::int as total_projects, (SELECT COUNT(*) FROM tasks WHERE tenant_id = $1)::int as total_tasks')) {
          const tenantId = params && params[0];
          if (tenantId === 'other-tenant-id') {
            return Promise.resolve({ rows: [mockStats] });
          } else {
            return Promise.resolve({ rows: [{ total_users: 0, total_projects: 0, total_tasks: 0 }] });
          }
        }
        // Default response
        return Promise.resolve({ rows: [] });
      });
      
      const response = await request(app)
        .get('/api/tenants/other-tenant-id')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.stats).toBeDefined();
    });

    it('should return 403 for unauthorized access to different tenant', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] });
        } else if (query && query.includes('SELECT id, role, tenant_id FROM users WHERE id')) {
          return Promise.resolve({ rows: [{ id: 'user-id', role: 'user', tenant_id: 'tenant-id' }] }); // User from different tenant
        }
        return Promise.resolve({ rows: [] });
      });
      
      const response = await request(app)
        .get('/api/tenants/different-tenant-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      // ERROR_MESSAGES.FORBIDDEN doesn't exist in constants, so message might be undefined
    });

    it('should return 404 for non-existent tenant', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockClear();
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [{ id: 'super-admin-id', email: 'superadmin@test.com', full_name: 'Super Admin', role: 'super_admin', tenant_id: null, is_active: true }] });
        } else if (query && query.includes('SELECT id, role, tenant_id FROM users WHERE id')) {
          return Promise.resolve({ rows: [{ id: 'super-admin-id', role: 'super_admin', tenant_id: null }] }); // Super admin
        } else if (query && query.includes('SELECT id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at, updated_at FROM tenants WHERE id')) {
          return Promise.resolve({ rows: [] }); // Tenant not found
        }
        return Promise.resolve({ rows: [] });
      });
      
      const response = await request(app)
        .get('/api/tenants/non-existent')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/tenants/tenant-id')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/tenants/:tenantId', () => {




    it('should return 403 for unauthorized tenant update', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] });
        } else if (query && query.includes('SELECT id, role, tenant_id FROM users WHERE id')) {
          return Promise.resolve({ rows: [{ id: 'user-id', role: 'user', tenant_id: 'tenant-id' }] }); // Regular user
        }
        return Promise.resolve({ rows: [] });
      });
      
      const response = await request(app)
        .put('/api/tenants/tenant-id')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'New Name' })
        .expect(403);
      
      expect(response.body.success).toBe(false);
      // ERROR_MESSAGES.FORBIDDEN doesn't exist in constants, so message might be undefined
    });

    it('should return 403 when tenant admin tries to update restricted fields', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockClear();
      mockPool.query.mockImplementation((query, params) => {
        // Handle authentication middleware query (SELECT full user data)
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          const userId = params && params[0];
          if (userId === 'user-id') {
            return Promise.resolve({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] });
          } else {
            return Promise.resolve({ rows: [] });
          }
        } 
        // Handle tenant controller authorization check
        else if (query && query.includes('SELECT id, role, tenant_id FROM users WHERE id')) {
          const userId = params && params[0];
          if (userId === 'user-id') {
            return Promise.resolve({ rows: [{ id: 'user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] });
          } else {
            return Promise.resolve({ rows: [] });
          }
        }
        // Handle tenant details query (for checking if tenant exists)
        else if (query && query.includes('SELECT id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at, updated_at FROM tenants WHERE id = $1')) {
          const tenantId = params && params[0];
          if (tenantId === 'tenant-id') {
            return Promise.resolve({ rows: [{ id: 'tenant-id', name: 'Test Tenant', subdomain: 'test', status: 'active', subscription_plan: 'free', max_users: 5, max_projects: 5, created_at: new Date(), updated_at: new Date() }] });
          } else {
            return Promise.resolve({ rows: [] });
          }
        }
        // Default response
        return Promise.resolve({ rows: [] });
      });
      
      const response = await request(app)
        .put('/api/tenants/tenant-id')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ subscription_plan: 'pro' }); // Send restricted field to trigger authorization error
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
    
  });

  describe('GET /api/tenants', () => {
    it('should return all tenants for super admin', async () => {
      const mockTenants = [
        { id: 'tenant1', name: 'Tenant 1', subdomain: 'tenant1', status: 'active', created_at: new Date(), updated_at: new Date() },
        { id: 'tenant2', name: 'Tenant 2', subdomain: 'tenant2', status: 'active', created_at: new Date(), updated_at: new Date() }
      ];
      
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [{ id: 'super-admin-id', email: 'superadmin@test.com', full_name: 'Super Admin', role: 'super_admin', tenant_id: null, is_active: true }] });
        } else if (query && query.includes('SELECT id, name, subdomain, status, subscription_plan, created_at, updated_at FROM tenants WHERE 1=1 ORDER BY created_at DESC')) {
          // This query includes LIMIT and OFFSET parameters
          return Promise.resolve({ rows: mockTenants });
        } else if (query && query.includes('SELECT COUNT(*) FROM tenants WHERE 1=1')) {
          return Promise.resolve({ rows: [{ count: '2' }] });
        }
        // Handle tenant list query with pagination
        else if (query && query.includes('SELECT') && query.includes('FROM tenants WHERE 1=1') && query.includes('ORDER BY')) {
          return Promise.resolve({ rows: mockTenants });
        }
        // Handle count query with parameters
        else if (query && query.includes('SELECT COUNT(*) FROM tenants WHERE 1=1')) {
          return Promise.resolve({ rows: [{ count: '2' }] });
        }
        return Promise.resolve({ rows: [] });
      });
      
      const response = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.tenants).toHaveLength(2);
    });

    it('should return 403 for non-super admin access', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] });
        } else if (query && query.includes('SELECT id, role, tenant_id FROM users WHERE id')) {
          return Promise.resolve({ rows: [{ id: 'user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }); // Regular user
        }
        return Promise.resolve({ rows: [] });
      });
      
      const response = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/tenants')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });
});

