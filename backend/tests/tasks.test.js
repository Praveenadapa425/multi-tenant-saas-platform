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

describe('Task API Endpoints', () => {
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

  describe('POST /api/projects/:projectId/tasks', () => {
    it('should create a new task for authorized user', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'todo',
        priority: 'medium',
        assigned_user_id: 'user-id'
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock createTask queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'project-id', tenant_id: 'tenant-id' }] }) // Check project
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'assigned-user-id', tenant_id: 'tenant-id' }] }) // Check assigned user
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'task-id', title: 'Test Task', description: 'Test Description', project_id: 'project-id', tenant_id: 'tenant-id', status: 'todo', priority: 'medium', assigned_to: 'user-id', created_at: new Date(), updated_at: new Date() }] }); // Insert task
      
      const response = await request(app)
        .post('/api/projects/project-id/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .send(taskData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
    });

    it('should return 400 for invalid task data', async () => {
      const response = await request(app)
        .post('/api/projects/project-id/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({}) // Empty data
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent project', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock createTask queries
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Project not found
      
      const response = await request(app)
        .post('/api/projects/non-existent/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Test Task' })
        .expect(404);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized access to project from different tenant', async () => {
      const mockProject = {
        id: 'project-id',
        tenant_id: 'different-tenant-id'
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock createTask queries
      pool.query
        .mockResolvedValueOnce({ rows: [mockProject] }); // Project from different tenant
      
      const response = await request(app)
        .post('/api/projects/project-id/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Test Task' })
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/projects/:projectId/tasks', () => {
    it('should return tasks for authorized user', async () => {
      const mockTasks = [
        { id: 'task1', title: 'Task 1', status: 'todo', project_id: 'project-id' },
        { id: 'task2', title: 'Task 2', status: 'in_progress', project_id: 'project-id' }
      ];
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock getProjectTasks queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'project-id', tenant_id: 'tenant-id' }] }) // Check project
      pool.query
        .mockResolvedValueOnce({ rows: mockTasks }); // Get tasks
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }); // Count query
      
      const response = await request(app)
        .get('/api/projects/project-id/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return 403 for unauthorized access to project from different tenant', async () => {
      const mockProject = {
        id: 'project-id',
        tenant_id: 'different-tenant-id'
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock getProjectTasks queries
      pool.query
        .mockResolvedValueOnce({ rows: [mockProject] }); // Project from different tenant
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Get tasks (empty because project check will fail)
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }); // Count query
      
      const response = await request(app)
        .get('/api/projects/project-id/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks', () => {
    it('should return all tasks for tenant', async () => {
      const mockTasks = [
        { id: 'task1', title: 'Task 1', status: 'todo', tenant_id: 'tenant-id' },
        { id: 'task2', title: 'Task 2', status: 'in_progress', tenant_id: 'tenant-id' }
      ];
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock getTasks queries
      pool.query
        .mockResolvedValueOnce({ rows: mockTasks }); // Get tasks
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }); // Count query
      
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/tasks/:taskId/status', () => {
    it('should update task status for authorized user', async () => {
      const statusUpdate = { status: 'in_progress' };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock updateTaskStatus queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'task-id', tenant_id: 'tenant-id' }] }); // Get task
      
      const response = await request(app)
        .patch('/api/tasks/task-id/status')
        .set('Authorization', `Bearer ${validToken}`)
        .send(statusUpdate)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .patch('/api/tasks/task-id/status')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized task status update', async () => {
      const mockTask = {
        id: 'task-id',
        tenant_id: 'different-tenant-id'
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock updateTaskStatus queries
      pool.query
        .mockResolvedValueOnce({ rows: [mockTask] }); // Task from different tenant
      
      const response = await request(app)
        .patch('/api/tasks/task-id/status')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ status: 'in_progress' })
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/tasks/:taskId', () => {
    it('should update task for authorized user', async () => {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated Description',
        status: 'in_progress',
        priority: 'high'
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock updateTask queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'task-id', tenant_id: 'tenant-id' }] }); // Get task
      
      const response = await request(app)
        .put('/api/tasks/task-id')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent task', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock updateTask queries
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Task not found
      
      const response = await request(app)
        .put('/api/tasks/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Updated Title' })
        .expect(404);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized task update', async () => {
      const mockTask = {
        id: 'task-id',
        tenant_id: 'different-tenant-id'
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock updateTask queries
      pool.query
        .mockResolvedValueOnce({ rows: [mockTask] }); // Task from different tenant
      
      const response = await request(app)
        .put('/api/tasks/task-id')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Updated Title' })
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/tasks/:taskId', () => {
    it('should delete task for authorized user', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock deleteTask queries
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'task-id', tenant_id: 'tenant-id' }] }); // Get task
      
      const response = await request(app)
        .delete('/api/tasks/task-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');
    });

    it('should return 404 for non-existent task', async () => {
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock deleteTask queries
      pool.query
        .mockResolvedValueOnce({ rows: [] }); // Task not found
      
      const response = await request(app)
        .delete('/api/tasks/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
      
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized task deletion', async () => {
      const mockTask = {
        id: 'task-id',
        tenant_id: 'different-tenant-id'
      };
      
      // Mock authenticate middleware query
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'user@test.com', full_name: 'Test User', role: 'user', tenant_id: 'tenant-id', is_active: true }] }) // Authenticate user
      // Mock deleteTask queries
      pool.query
        .mockResolvedValueOnce({ rows: [mockTask] }); // Task from different tenant
      
      const response = await request(app)
        .delete('/api/tasks/task-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });
});