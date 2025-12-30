const request = require('supertest');
const app = require('../src/server');
const { pool } = require('../src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock the database pool to avoid actual database calls during testing
jest.mock('../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

describe('Authentication API Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register-tenant', () => {
    it('should register a new tenant with admin user', async () => {
      const mockTenant = {
        id: 'test-tenant-id',
        name: 'Test Tenant',
        subdomain: 'test',
        status: 'active',
        subscription_plan: 'free',
        max_users: 5,
        max_projects: 5,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const mockUser = {
        id: 'test-user-id',
        tenant_id: 'test-tenant-id',
        email: 'admin@test.com',
        first_name: 'Test',
        last_name: 'Admin',
        role: 'tenant_admin',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      pool.query.mockResolvedValueOnce({ rows: [] }); // Check if subdomain exists
      pool.query.mockResolvedValueOnce({ rows: [] }); // Check if email exists
      pool.query.mockResolvedValueOnce({ rows: [mockTenant] }); // Insert tenant
      pool.query.mockResolvedValueOnce({ rows: [mockUser] }); // Insert user
      
      const response = await request(app)
        .post('/api/auth/register-tenant')
        .send({
          tenantName: 'Test Tenant',
          subdomain: 'test',
          firstName: 'Test',
          lastName: 'Admin',
          email: 'admin@test.com',
          password: 'Password123!'
        })
        .expect(201);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.tenant).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register-tenant')
        .send({})
        .expect(400);
        
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when subdomain already exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'existing-tenant' }] }); // Subdomain exists
      
      const response = await request(app)
        .post('/api/auth/register-tenant')
        .send({
          tenantName: 'Test Tenant',
          subdomain: 'existing',
          firstName: 'Test',
          lastName: 'Admin',
          email: 'admin@test.com',
          password: 'Password123!'
        })
        .expect(400);
        
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('subdomain');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate a user and return a token', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'test-user-id',
          tenant_id: 'test-tenant-id',
          email: 'user@test.com',
          password_hash: hashedPassword,
          first_name: 'Test',
          last_name: 'User',
          role: 'user',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        }]
      });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'Password123!'
        })
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // No user found
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword'
        })
        .expect(401);
        
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);
        
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return the current authenticated user', async () => {
      const token = jwt.sign(
        { id: 'test-user-id', tenantId: 'test-tenant-id', role: 'user' },
        process.env.JWT_SECRET || 'test-secret'
      );
      
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'test-user-id',
          tenant_id: 'test-tenant-id',
          email: 'user@test.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'user',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        }]
      });
      
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBe('test-user-id');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
        
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout the current user', async () => {
      const token = jwt.sign(
        { id: 'test-user-id', tenantId: 'test-tenant-id', role: 'user' },
        process.env.JWT_SECRET || 'test-secret'
      );
      
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Successfully logged out');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
        
      expect(response.body.success).toBe(false);
    });
  });
});