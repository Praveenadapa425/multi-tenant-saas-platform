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

describe('Project API Endpoints', () => {
  const validToken = jwt.sign(
    { id: 'user-id', tenantId: 'tenant-id', role: 'user' },
    process.env.JWT_SECRET || 'test-secret'
  );
  
  const tenantAdminToken = jwt.sign(
    { id: 'admin-id', tenantId: 'tenant-id', role: 'tenant_admin' },
    process.env.JWT_SECRET || 'test-secret'
  );
  
  const superAdminToken = jwt.sign(
    { id: 'super-admin-id', tenantId: null, role: 'super_admin' },
    process.env.JWT_SECRET || 'test-secret'
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/projects', () => {
    it('should create a new project for authenticated user', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test Description'
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock tenant limit check in createProject function
      pool.query
        .mockResolvedValueOnce({ rows: [{ max_projects: 5 }] }); // Tenant limit check
      // Mock project count check in createProject function
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }); // Project count
      // Mock project creation
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'project-id', name: 'Test Project', description: 'Test Description', tenant_id: 'tenant-id', created_by: 'user-id', status: 'active', created_at: new Date(), updated_at: new Date() }] }); // Insert project
      // Mock audit log insertion
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Audit log
      
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${validToken}`)
        .send(projectData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(projectData.name);
    });

    it('should return 400 for invalid project data', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${validToken}`)
        .send({}) // Empty data
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer invalid-token')
        .send({ name: 'Test Project' })
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/projects', () => {
    it('should return projects for authenticated user', async () => {
      const mockProjects = [
        { id: 'project1', name: 'Project 1', description: 'Description 1', tenant_id: 'tenant-id' },
        { id: 'project2', name: 'Project 2', description: 'Description 2', tenant_id: 'tenant-id' }
      ];
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock listProjects queries
      pool.query
        .mockResolvedValueOnce({ rows: mockProjects }); // Get projects
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }); // Count query
      
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/projects/:projectId', () => {
    it('should return project details for authorized user', async () => {
      const mockProject = {
        id: 'project-id',
        name: 'Test Project',
        description: 'Test Description',
        tenant_id: 'tenant-id',
        created_by: 'user-id',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock getProject queries
      pool.query
        .mockResolvedValueOnce({ rows: [mockProject] }); // Get project
      pool.query
        .mockResolvedValueOnce({ rows: [{ total_tasks: '5', todo_count: '2', in_progress_count: '2', completed_count: '1' }] }); // Task stats
      
      const response = await request(app)
        .get('/api/projects/project-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('project-id');
    });

    it('should return project details for super admin', async () => {
      const mockProject = {
        id: 'project-id',
        name: 'Test Project',
        description: 'Test Description',
        tenant_id: 'other-tenant-id',
        created_by: 'user-id',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'super-admin-id', email: 'superadmin@test.com', full_name: 'Super Admin', role: 'super_admin', tenant_id: null, is_active: true }] }) // Authenticate user
      // Mock getProject queries for super_admin
      pool.query
        .mockResolvedValueOnce({ rows: [mockProject] }); // Get project
      pool.query
        .mockResolvedValueOnce({ rows: [{ total_tasks: '5', todo_count: '2', in_progress_count: '2', completed_count: '1' }] }); // Task stats
      
      const response = await request(app)
        .get('/api/projects/project-id')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('project-id');
    });

    it('should return 404 for non-existent project', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock getProject queries
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Project not found
      
      const response = await request(app)
        .get('/api/projects/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for unauthorized access to project from different tenant', async () => {
      const mockProject = {
        id: 'project-id',
        name: 'Test Project',
        description: 'Test Description',
        tenant_id: 'different-tenant-id',
        created_by: 'other-user-id',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock getProject queries
      pool.query
        .mockResolvedValueOnce({ rows: [mockProject] }); // Get project from different tenant
      
      const response = await request(app)
        .get('/api/projects/project-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404); // Changed from 403 to 404 for tenant isolation
      
      expect(response.body.success).toBe(false);
    });

  });

  describe('PUT /api/projects/:projectId', () => {
    it('should update project for authorized user', async () => {
      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated Description'
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock updateProject queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'project-id', tenant_id: 'tenant-id', created_by: 'user-id' }] }); // Get project
      // Mock audit log insertion
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Audit log
      
      const response = await request(app)
        .put('/api/projects/project-id')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent project', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock updateProject queries
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Project not found
      
      const response = await request(app)
        .put('/api/projects/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized project update', async () => {
      const mockProject = {
        id: 'project-id',
        name: 'Test Project',
        tenant_id: 'different-tenant-id'
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock updateProject queries
      pool.query
        .mockResolvedValueOnce({ rows: [mockProject] }); // Get project from different tenant
      
      const response = await request(app)
        .put('/api/projects/project-id')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Updated Name' })
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/projects/:projectId', () => {
    it('should delete project for authorized user', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-id', email: 'admin@test.com', full_name: 'Admin User', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock deleteProject queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'project-id', tenant_id: 'tenant-id', created_by: 'admin-id' }] }); // Get project
      // Mock delete tasks
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Delete tasks
      // Mock delete project
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'project-id' }] }); // Delete project
      // Mock audit log insertion
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Audit log
      
      const response = await request(app)
        .delete('/api/projects/project-id')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project deleted successfully');
    });

    it('should return 404 for non-existent project', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'admin-id', email: 'admin@test.com', full_name: 'Admin User', role: 'tenant_admin', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock deleteProject queries
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Project not found
      
      const response = await request(app)
        .delete('/api/projects/non-existent')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .expect(404);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for unauthorized project deletion', async () => {
      const mockProject = {
        id: 'project-id',
        name: 'Test Project',
        tenant_id: 'different-tenant-id',
        created_by: 'other-user-id',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock deleteProject queries
      pool.query
        .mockResolvedValueOnce({ rows: [mockProject] }); // Get project from different tenant
      
      const response = await request(app)
        .delete('/api/projects/project-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404); // Changed from 403 to 404 for tenant isolation
      
      expect(response.body.success).toBe(false);
    });

  });
});