const request = require('supertest');
const app = require('../src/server');
const { pool } = require('../src/config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock the database pool
jest.mock('../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

describe('User API Endpoints', () => {
  const tenantAdminToken = jwt.sign(
    { id: 'admin-user-id', tenantId: 'tenant-id', role: 'tenant_admin' },
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
        firstName: 'New',
        lastName: 'User',
        email: 'newuser@test.com',
        password: 'Password123!',
        role: 'user'
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }) // Check user role
        .mockResolvedValueOnce({ rows: [] }) // Check if email exists
        .mockResolvedValueOnce({ rows: [{ id: 'new-user-id', email: 'newuser@test.com', tenant_id: 'tenant-id' }] }); // Insert user
      
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send(userData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('should return 403 for regular user trying to add user', async () => {
      const userData = {
        firstName: 'New',
        lastName: 'User',
        email: 'newuser@test.com',
        password: 'Password123!',
        role: 'user'
      };
      
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
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send({}) // Empty data
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when email already exists', async () => {
      const userData = {
        firstName: 'New',
        lastName: 'User',
        email: 'existing@test.com',
        password: 'Password123!',
        role: 'user'
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }) // Check user role
        .mockResolvedValueOnce({ rows: [{ id: 'existing-user-id', email: 'existing@test.com' }] }); // Email exists
      
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users', () => {
    it('should return users for authenticated user', async () => {
      const mockUsers = [
        { id: 'user1', email: 'user1@test.com', first_name: 'User', last_name: 'One', role: 'user' },
        { id: 'user2', email: 'user2@test.com', first_name: 'User', last_name: 'Two', role: 'user' }
      ];
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'regular-user-id', tenant_id: 'tenant-id' }] }) // Check user
        .mockResolvedValueOnce({ rows: mockUsers }); // Get users
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
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
        { id: 'user1', email: 'user1@test.com', first_name: 'User', last_name: 'One', role: 'user' }
      ];
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }) // Check user role
        .mockResolvedValueOnce({ rows: mockUsers }); // Get users
      
      const response = await request(app)
        .get('/api/users/tenants/tenant-id')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should return 403 for unauthorized access to different tenant', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', role: 'user', tenant_id: 'other-tenant-id' }] }); // User from different tenant
      
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
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@test.com'
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'regular-user-id', tenant_id: 'tenant-id' }] }) // Check user
        .mockResolvedValueOnce({ rows: [{ id: 'regular-user-id', email: 'old@test.com' }] }); // Get user
      
      const response = await request(app)
        .put('/api/users/regular-user-id')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('should allow tenant admin to update any user in their tenant', async () => {
      const updateData = {
        firstName: 'Updated by Admin',
        role: 'admin'
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }) // Check user role
        .mockResolvedValueOnce({ rows: [{ id: 'other-user-id', tenant_id: 'tenant-id' }] }); // Get target user
      
      const response = await request(app)
        .put('/api/users/other-user-id')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('should return 403 for unauthorized user update', async () => {
      const updateData = {
        firstName: 'Unauthorized Update'
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user1-id', tenant_id: 'tenant1-id' }] }) // Check user
        .mockResolvedValueOnce({ rows: [{ id: 'user2-id', tenant_id: 'tenant2-id' }] }); // Get target user (different tenant)
      
      const response = await request(app)
        .put('/api/users/user2-id')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(updateData)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:userId', () => {
    it('should delete user for tenant admin', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }) // Check user role
        .mockResolvedValueOnce({ rows: [{ id: 'user-to-delete', tenant_id: 'tenant-id' }] }); // Get user to delete
      
      const response = await request(app)
        .delete('/api/users/user-to-delete')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');
    });

    it('should return 403 for regular user trying to delete', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'regular-user-id', role: 'user', tenant_id: 'tenant-id' }] }); // Check user role
      
      const response = await request(app)
        .delete('/api/users/other-user')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for tenant admin trying to delete themselves', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }) // Check user role
        .mockResolvedValueOnce({ rows: [{ id: 'admin-user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }); // Get user to delete (same as requester)
      
      const response = await request(app)
        .delete('/api/users/admin-user-id')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });
});