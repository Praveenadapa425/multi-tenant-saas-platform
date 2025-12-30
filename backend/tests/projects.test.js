const request = require('supertest');
const app = require('../src/server');
const { pool } = require('../src/config/database');
const jwt = require('jsonwebtoken');

// Mock the database pool
jest.mock('../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

describe('Project API Endpoints', () => {
  const validToken = jwt.sign(
    { id: 'user-id', tenantId: 'tenant-id', role: 'user' },
    process.env.JWT_SECRET || 'test-secret'
  );
  
  const tenantAdminToken = jwt.sign(
    { id: 'admin-id', tenantId: 'tenant-id', role: 'tenant_admin' },
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
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', tenant_id: 'tenant-id' }] }) // Check user
        .mockResolvedValueOnce({ rows: [{ id: 'project-id', name: 'Test Project', tenant_id: 'tenant-id' }] }); // Insert project
      
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${validToken}`)
        .send(projectData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.project.name).toBe(projectData.name);
    });

    it('should return 400 for invalid project data', async () => {
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
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', tenant_id: 'tenant-id' }] }) // Check user
        .mockResolvedValueOnce({ rows: mockProjects }); // Get projects
      
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
        tenant_id: 'tenant-id'
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', tenant_id: 'tenant-id' }] }) // Check user
        .mockResolvedValueOnce({ rows: [mockProject] }); // Get project
      
      const response = await request(app)
        .get('/api/projects/project-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.project.id).toBe('project-id');
    });

    it('should return 404 for non-existent project', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', tenant_id: 'tenant-id' }] }) // Check user
        .mockResolvedValueOnce({ rows: [] }); // Project not found
      
      const response = await request(app)
        .get('/api/projects/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized access to project from different tenant', async () => {
      const mockProject = {
        id: 'project-id',
        name: 'Test Project',
        description: 'Test Description',
        tenant_id: 'different-tenant-id'
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', tenant_id: 'tenant-id' }] }) // Check user
        .mockResolvedValueOnce({ rows: [mockProject] }); // Get project from different tenant
      
      const response = await request(app)
        .get('/api/projects/project-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/projects/:projectId', () => {
    it('should update project for authorized user', async () => {
      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated Description'
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', tenant_id: 'tenant-id' }] }) // Check user
        .mockResolvedValueOnce({ rows: [{ id: 'project-id', tenant_id: 'tenant-id' }] }); // Get project
      
      const response = await request(app)
        .put('/api/projects/project-id')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent project', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', tenant_id: 'tenant-id' }] }) // Check user
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
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', tenant_id: 'tenant-id' }] }) // Check user
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
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }) // Check user role
        .mockResolvedValueOnce({ rows: [{ id: 'project-id', tenant_id: 'tenant-id' }] }); // Get project
      
      const response = await request(app)
        .delete('/api/projects/project-id')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project deleted successfully');
    });

    it('should return 404 for non-existent project', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', role: 'tenant_admin', tenant_id: 'tenant-id' }] }) // Check user role
        .mockResolvedValueOnce({ rows: [] }); // Project not found
      
      const response = await request(app)
        .delete('/api/projects/non-existent')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .expect(404);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized project deletion', async () => {
      const mockProject = {
        id: 'project-id',
        name: 'Test Project',
        tenant_id: 'different-tenant-id'
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', tenant_id: 'tenant-id' }] }) // Check user
        .mockResolvedValueOnce({ rows: [mockProject] }); // Get project from different tenant
      
      const response = await request(app)
        .delete('/api/projects/project-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });
});