const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock the database pool before importing the server
jest.mock('../src/config/database', () => ({
  pool: {
    query: jest.fn(() => Promise.resolve({ rows: [] }))
  }
}));

// Mock the audit logger to prevent database calls during tests
jest.mock('../src/utils/auditLogger', () => ({
  logAction: jest.fn().mockResolvedValue(null)
}));

const app = require('../src/server');
const { pool } = require('../src/config/database');

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
        full_name: 'Test Admin',
        role: 'tenant_admin',
        is_active: true,
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
          adminEmail: 'admin@test.com',
          adminPassword: 'Password123!',
          adminFullName: 'Test Admin'
        })
        .expect(201);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.tenant).toBeDefined();
      expect(response.body.data.adminUser).toBeDefined();
      expect(response.body.data.adminUser.email).toBe('admin@test.com');
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
          adminEmail: 'admin@test.com',
          adminPassword: 'Password123!',
          adminFullName: 'Test Admin'
        })
        .expect(400);
        
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate a regular user and return a token', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      pool.query.mockResolvedValueOnce({ rows: [] }); // Check super_admin first
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'test-tenant-id',
          status: 'active'
        }]
      }); // Check tenant
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'test-user-id',
          tenant_id: 'test-tenant-id',
          email: 'user@test.com',
          password_hash: hashedPassword,
          full_name: 'Test User',
          role: 'user',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }]
      }); // Find regular user
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'Password123!',
          tenantSubdomain: 'test'
        })
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
    });

    it('should authenticate a super_admin user with tenant subdomain', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'super-admin-id',
          tenant_id: null,
          email: 'superadmin@system.com',
          password_hash: hashedPassword,
          full_name: 'Super Admin',
          role: 'super_admin',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }]
      }); // Find super_admin user
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'test-tenant-id',
          status: 'active'
        }]
      }); // Check tenant exists
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'superadmin@system.com',
          password: 'Password123!',
          tenantSubdomain: 'test'
        })
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.role).toBe('super_admin');
    });

    it('should authenticate a super_admin user without tenant subdomain', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'super-admin-id',
          tenant_id: null,
          email: 'superadmin@system.com',
          password_hash: hashedPassword,
          full_name: 'Super Admin',
          role: 'super_admin',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }]
      }); // Find super_admin user
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'superadmin@system.com',
          password: 'Password123!'
          // No tenantSubdomain provided - should work for super_admin
        })
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.role).toBe('super_admin');
    });

    it('should return 401 for invalid credentials', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // No super_admin found
      pool.query.mockResolvedValueOnce({ rows: [] }); // No tenant found (for regular user flow)
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword',
          tenantSubdomain: 'test'
        })
        .expect(401);
        
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 for regular user without tenant subdomain', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'Password123!'
          // No tenantSubdomain provided - should fail for regular user
        })
        .expect(400);
        
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Tenant subdomain is required for non-super-admin users');
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
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'test-user-id',
            email: 'user@test.com',
            full_name: 'Test User',
            role: 'user',
            tenant_id: 'test-tenant-id',
            is_active: true
          }]
        }); // Authenticate user
      // Mock getCurrentUser controller query (the JOIN query)
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'test-user-id',
          email: 'user@test.com',
          full_name: 'Test User',
          role: 'user',
          is_active: true,
          tenant_id: 'test-tenant-id',
          tenant_id_check: 'test-tenant-id',
          name: 'Test Tenant',
          subdomain: 'test',
          subscription_plan: 'free',
          max_users: 5,
          max_projects: 5
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
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'test-user-id',
            email: 'user@test.com',
            full_name: 'Test User',
            role: 'user',
            tenant_id: 'test-tenant-id',
            is_active: true
          }]
        }); // Authenticate user
      // Mock audit log insertion in logout function
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Audit log insertion
      
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
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