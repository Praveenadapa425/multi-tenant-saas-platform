const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
  beforeEach(() => {
    // Reset the pool mock before each test to ensure isolation
    pool.query.mockClear();
  });
  const tenantAdminToken = jwt.sign(
    { id: 'admin-user-id', tenantId: 'tenant-id', role: 'tenant_admin' },
    process.env.JWT_SECRET || 'test-secret'
  );
  
  const superAdminToken = jwt.sign(
    { id: 'super-admin-id', tenantId: null, role: 'super_admin' },
    process.env.JWT_SECRET || 'test-secret'
  );

  const regularUserToken = jwt.sign(
    { id: 'regular-user-id', tenantId: 'tenant-id', role: 'user' },
    process.env.JWT_SECRET || 'test-secret'
  );

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('POST /api/users', () => {
    it('should add a new user to tenant for tenant admin', async () => {
      const userData = {
        fullName: 'New User',
        email: 'newuser@test.com',
        password: 'Password123!',
        role: 'user'
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', email: 'admin@test.com', full_name: 'Test Admin', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock addUser queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ max_users: 10 }] }); // Tenant limit check
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }); // User count check
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Check if email exists
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'new-user-id', email: 'newuser@test.com', full_name: 'New User', role: 'user', is_active: true, created_at: new Date() }] }); // Insert user
      // Mock audit log insertion
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Audit log
      
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send(userData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
    });

    it('should return 403 for regular user trying to add user', async () => {
      const userData = {
        fullName: 'New User',
        email: 'newuser@test.com',
        password: 'Password123!',
        role: 'user'
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'regular-user-id', email: 'user@test.com', full_name: 'Regular User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Check user role for authorization
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'regular-user-id', role: 'user', tenant_id: 'tenant-id' }] }); // Check user role
      
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(userData)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid user data', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', email: 'admin@test.com', full_name: 'Test Admin', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock addUser queries for tenant limit check
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }); // Check user role
      pool.query
        .mockResolvedValueOnce({ rows: [{ max_users: 10 }] }); // Tenant limit check
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }); // User count check
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Check if email exists
      
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send({}) // Empty data
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 409 when email already exists', async () => {
      const userData = {
        fullName: 'New User',
        email: 'existing@test.com',
        password: 'Password123!',
        role: 'user'
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', email: 'admin@test.com', full_name: 'Test Admin', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock addUser queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }); // Check user role
      pool.query
        .mockResolvedValueOnce({ rows: [{ max_users: 10 }] }); // Tenant limit check
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }); // User count check
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'existing-user-id', email: 'existing@test.com' }] }); // Email exists
      
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send(userData)
        .expect(409); // Changed from 400 to 409 for email conflict
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users', () => {
    it('should return users for authenticated user', async () => {
      const mockUsers = [
        { id: 'user1', email: 'user1@test.com', full_name: 'User One', role: 'user', is_active: true, created_at: new Date() },
        { id: 'user2', email: 'user2@test.com', full_name: 'User Two', role: 'user', is_active: true, created_at: new Date() }
      ];
      
      // Mock authenticate middleware query - this is called by the middleware before the controller
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'regular-user-id', email: 'user@test.com', full_name: 'Regular User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock listUsers queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'regular-user-id', role: 'user', tenant_id: 'tenant-id' }] }); // Check user permissions
      pool.query
        .mockResolvedValueOnce({ rows: mockUsers }); // Get users
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }); // Count query
      
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
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', email: 'admin@test.com', full_name: 'Test Admin', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock listUsersInTenant queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }); // Check user permissions
      pool.query
        .mockResolvedValueOnce({ rows: mockUsers }); // Get users
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // Count query
      
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
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'super-admin-id', email: 'superadmin@test.com', full_name: 'Super Admin', role: 'super_admin', tenant_id: null, is_active: true }] }) // Authenticate user
      // Mock listUsersInTenant queries for super_admin
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'super-admin-id', role: 'super_admin', tenant_id: null }] }); // Check super admin permissions
      pool.query
        .mockResolvedValueOnce({ rows: mockUsers }); // Get users
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // Count query
      
      const response = await request(app)
        .get('/api/users/tenants/other-tenant-id')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
    });

    it('should return 403 for unauthorized access to different tenant', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'regular-user-id', email: 'user@test.com', full_name: 'Regular User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock listUsersInTenant queries - check permissions
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'regular-user-id', role: 'user', tenant_id: 'tenant-id' }] }); // Check user permissions
      
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
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'regular-user-id', email: 'user@test.com', full_name: 'Regular User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock updateUser queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ tenant_id: 'tenant-id' }] }); // Get user to check tenant (user updating own account)
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Update user result
      // Mock audit log insertion
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Audit log
      
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
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', email: 'admin@test.com', full_name: 'Test Admin', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock updateUser queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ tenant_id: 'tenant-id' }] }); // Get user to check tenant
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Update user result
      // Mock audit log insertion
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Audit log
      
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
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'regular-user-id', email: 'user@test.com', full_name: 'Regular User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock updateUser queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ tenant_id: 'different-tenant-id' }] }); // Get user to check tenant (different tenant)
      
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
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', email: 'admin@test.com', full_name: 'Test Admin', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock deleteUser queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ tenant_id: 'tenant-id' }] }); // Get user to delete
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Unassign tasks
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Delete user
      // Mock audit log insertion
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Audit log
      
      const response = await request(app)
        .delete('/api/users/user-to-delete')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');
    });

    it('should return 403 for regular user trying to delete', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'regular-user-id', email: 'user@test.com', full_name: 'Regular User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      
      const response = await request(app)
        .delete('/api/users/other-user')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for tenant admin trying to delete themselves', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', email: 'admin@test.com', full_name: 'Test Admin', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      
      const response = await request(app)
        .delete('/api/users/admin-user-id')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });

  });
});