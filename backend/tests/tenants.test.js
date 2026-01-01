const request = require('supertest');
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

describe('Tenant API Endpoints', () => {
  const validToken = jwt.sign(
    { id: 'user-id', tenantId: 'tenant-id', role: 'tenant_admin' },
    process.env.JWT_SECRET || 'test-secret'
  );
  
  const superAdminToken = jwt.sign(
    { id: 'super-admin-id', tenantId: null, role: 'super_admin' },
    process.env.JWT_SECRET || 'test-secret'
  );

  afterEach(() => {
    jest.clearAllMocks();
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
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }) // Check user
        .mockResolvedValueOnce({ rows: [mockTenant] }) // Get tenant
        .mockResolvedValueOnce({ rows: [mockStats] }); // Get stats
      
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
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'super-admin-id', email: 'superadmin@test.com', full_name: 'Super Admin', role: 'super_admin', tenant_id: null, is_active: true }] }) // Authenticate user
        .mockResolvedValueOnce({ rows: [{ id: 'super-admin-id', role: 'super_admin', tenant_id: null }] }) // Check super_admin
        .mockResolvedValueOnce({ rows: [mockTenant] }) // Get tenant
        .mockResolvedValueOnce({ rows: [mockStats] }); // Get stats
      
      const response = await request(app)
        .get('/api/tenants/other-tenant-id')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.stats).toBeDefined();
    });

    it('should return 403 for unauthorized access to different tenant', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', role: 'user', tenant_id: 'other-tenant-id' }] }); // User from different tenant
      
      const response = await request(app)
        .get('/api/tenants/different-tenant-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('forbidden');
    });

    it('should return 404 for non-existent tenant', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'super-admin-id', email: 'superadmin@test.com', full_name: 'Super Admin', role: 'super_admin', tenant_id: null, is_active: true }] }) // Authenticate user
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', role: 'super_admin', tenant_id: null }] }) // Super admin
        .mockResolvedValueOnce({ rows: [] }); // Tenant not found
      
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
    it('should update tenant for authorized user', async () => {
      const updateData = {
        name: 'Updated Tenant Name',
        subscription_plan: 'pro',
        max_users: 10,
        max_projects: 10
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock updateTenant queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }) // Check user
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'tenant-id', name: 'Old Name', subdomain: 'test', status: 'active', subscription_plan: 'free', max_users: 5, max_projects: 5, created_at: new Date(), updated_at: new Date() }] }); // Get tenant
      // Mock audit log insertion
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Audit log
      
      const response = await request(app)
        .put('/api/tenants/tenant-id')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.tenant.name).toBe(updateData.name);
    });

    it('should allow super admin to update any tenant', async () => {
      const updateData = {
        name: 'Updated by Super Admin',
        subscription_plan: 'enterprise'
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'super-admin-id', email: 'superadmin@test.com', full_name: 'Super Admin', role: 'super_admin', tenant_id: null, is_active: true }] }) // Authenticate user
      // Mock updateTenant queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'super-admin-id', role: 'super_admin', tenant_id: null }] }) // Super admin
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'other-tenant-id', name: 'Old Name', subdomain: 'other', status: 'active', subscription_plan: 'free', max_users: 5, max_projects: 5, created_at: new Date(), updated_at: new Date() }] }); // Get tenant
      
      const response = await request(app)
        .put('/api/tenants/other-tenant-id')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('should return 403 for unauthorized tenant update', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', role: 'user', tenant_id: 'tenant-id' }] }); // Regular user
      
      const response = await request(app)
        .put('/api/tenants/tenant-id')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'New Name' })
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid update data', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock updateTenant queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }); // Check user
      
      const response = await request(app)
        .put('/api/tenants/tenant-id')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ invalid_field: 'value' })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tenants', () => {
    it('should return all tenants for super admin', async () => {
      const mockTenants = [
        { id: 'tenant1', name: 'Tenant 1', subdomain: 'tenant1', status: 'active', created_at: new Date(), updated_at: new Date() },
        { id: 'tenant2', name: 'Tenant 2', subdomain: 'tenant2', status: 'active', created_at: new Date(), updated_at: new Date() }
      ];
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'super-admin-id', email: 'superadmin@test.com', full_name: 'Super Admin', role: 'super_admin', tenant_id: null, is_active: true }] }) // Authenticate user
      // Mock listTenants queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'super-admin-id', role: 'super_admin' }] }) // Check user role
      pool.query
        .mockResolvedValueOnce({ rows: mockTenants }); // Get all tenants
      
      const response = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.tenants).toHaveLength(2);
    });

    it('should return 403 for non-super admin access', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }); // Regular user
      
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