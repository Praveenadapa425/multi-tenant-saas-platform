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

describe('Task API Endpoints', () => {
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

  const mockProject = {
    id: 'project-id',
    name: 'Test Project',
    description: 'Test Description',
    status: 'active',
    tenant_id: 'tenant-id',
    created_by: 'admin-user-id',
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockTask = {
    id: 'task-id',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium',
    project_id: 'project-id',
    assigned_to: 'regular-user-id',
    created_by: 'admin-user-id',
    tenant_id: 'tenant-id',
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockNonExistentTask = {
    id: 'non-existent',
    title: 'Non Existent Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium',
    project_id: 'project-id',
    assigned_to: 'regular-user-id',
    created_by: 'admin-user-id',
    tenant_id: 'tenant-id',
    created_at: new Date(),
    updated_at: new Date()
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

  const validToken = jwt.sign(
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

  describe('POST /api/projects/:projectId/tasks', () => {
    it('should create a new task for authorized user', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [mockProject] });
        } else if (query && query.includes('INSERT INTO tasks')) {
          // Create a new task object with the sent data
          const newTask = { ...mockTask, id: 'new-task-id', title: taskData.title, description: taskData.description, status: 'todo', priority: taskData.priority || 'medium' };
          return Promise.resolve({ rows: [newTask] });
        } else if (query && query.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      const taskData = {
        title: 'New Task',
        description: 'New Task Description',
        status: 'todo',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/projects/project-id/tasks')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
    });

    it('should return 400 for invalid task data', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [mockProject] });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .post('/api/projects/project-id/tasks')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send({}) // Empty data
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent project', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [] }); // Project not found
        }
        return Promise.resolve({ rows: [] });
      });

      const taskData = {
        title: 'New Task',
        description: 'New Task Description'
      };

      const response = await request(app)
        .post('/api/projects/non-existent/tasks')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send(taskData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for unauthorized access to project from different tenant', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [] }); // Project not found in user's tenant
        }
        return Promise.resolve({ rows: [] });
      });

      const taskData = {
        title: 'New Task',
        description: 'New Task Description'
      };

      const response = await request(app)
        .post('/api/projects/project-from-different-tenant/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .send(taskData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/projects/:projectId/tasks', () => {
    it('should return tasks for authorized user', async () => {
      const mockTasks = [
        { ...mockTask, id: 'task1', title: 'Task One' },
        { ...mockTask, id: 'task2', title: 'Task Two' }
      ];

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [mockProject] });
        } else if (query && query.includes('SELECT * FROM tasks WHERE project_id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: mockTasks });
        } else if (query && query.includes('SELECT COUNT(*) as count FROM tasks WHERE project_id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [{ count: '2' }] });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .get('/api/projects/project-id/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return 404 for unauthorized access to project from different tenant', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [] }); // Project not found in user's tenant
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .get('/api/projects/project-from-different-tenant/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks', () => {
    it('should return all tasks for tenant', async () => {
      const mockTasks = [
        { ...mockTask, id: 'task1', title: 'Task One' },
        { ...mockTask, id: 'task2', title: 'Task Two' }
      ];

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT * FROM tasks WHERE tenant_id = $1')) {
          return Promise.resolve({ rows: mockTasks });
        } else if (query && query.includes('SELECT COUNT(*) as count FROM tasks WHERE tenant_id = $1')) {
          return Promise.resolve({ rows: [{ count: '2' }] });
        }
        return Promise.resolve({ rows: [] });
      });

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

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT * FROM tasks WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [{ ...mockTask, assigned_to: mockRegularUser.id }] }); // Task assigned to user
        } else if (query && query.includes('UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *')) {
          return Promise.resolve({ rows: [{ ...mockTask, status: 'in_progress' }] });
        } else if (query && query.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .patch('/api/tasks/task-id/status')
        .set('Authorization', `Bearer ${validToken}`)
        .send(statusUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid status', async () => {
      const statusUpdate = { status: 'invalid_status' };

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .patch('/api/tasks/task-id/status')
        .set('Authorization', `Bearer ${validToken}`)
        .send(statusUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should update task status for user in same tenant', async () => {
      const statusUpdate = { status: 'in_progress' };

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT * FROM tasks WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [{ ...mockTask, assigned_to: 'other-user-id' }] }); // Task assigned to different user but same tenant
        } else if (query && query.includes('UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *')) {
          return Promise.resolve({ rows: [{ ...mockTask, status: 'in_progress' }] });
        } else if (query && query.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .patch('/api/tasks/task-id/status')
        .set('Authorization', `Bearer ${validToken}`)
        .send(statusUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/tasks/:taskId', () => {
    it('should update task for authorized user', async () => {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated Description'
      };

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT * FROM tasks WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [{ ...mockTask, created_by: mockTenantAdmin.id }] });
        } else if (query && query.includes('UPDATE tasks SET')) {
          return Promise.resolve({ rows: [{ ...mockTask, ...updateData }] });
        } else if (query && query.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .put('/api/tasks/task-id')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent task', async () => {
      const updateData = {
        title: 'Updated Task Title'
      };

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT * FROM tasks WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [] }); // Task not found
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .put('/api/tasks/non-existent')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should update task for user in same tenant', async () => {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated Description'
      };

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT * FROM tasks WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [{ ...mockTask, created_by: 'other-user-id' }] }); // Different creator but same tenant
        } else if (query && query.includes('UPDATE tasks SET')) {
          return Promise.resolve({ rows: [{ ...mockTask, ...updateData }] });
        } else if (query && query.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .put('/api/tasks/task-id')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/tasks/:taskId', () => {
    it('should delete task for authorized user', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT * FROM tasks WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [{ ...mockTask, created_by: mockTenantAdmin.id }] });
        } else if (query && query.includes('DELETE FROM tasks WHERE id = $1')) {
          return Promise.resolve({ rows: [{ id: 'task-id' }] });
        } else if (query && query.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .delete('/api/tasks/task-id')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');
    });

    it('should return 404 for non-existent task', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT id, tenant_id, created_by FROM tasks WHERE id = $1')) {
          return Promise.resolve({ rows: [] }); // Task not found
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .delete('/api/tasks/non-existent')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should delete task for user in same tenant', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT * FROM tasks WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [{ ...mockTask, created_by: 'other-user-id' }] }); // Different creator but same tenant
        } else if (query && query.includes('DELETE FROM tasks WHERE id = $1')) {
          return Promise.resolve({ rows: [{ id: 'task-id' }] });
        } else if (query && query.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .delete('/api/tasks/task-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');
    });
  });
});