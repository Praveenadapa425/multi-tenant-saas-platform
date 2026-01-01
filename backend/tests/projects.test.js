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

describe('Project API Endpoints', () => {
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
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockNonExistentProject = {
    id: 'non-existent',
    name: 'Non Existent Project',
    description: 'Test Description',
    status: 'active',
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

  const regularUserToken = jwt.sign(
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

  describe('POST /api/projects', () => {
    it('should create a new project for authenticated user', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT max_projects FROM tenants WHERE id = $1')) {
          return Promise.resolve({ rows: [{ max_projects: 10 }] }); // Tenant limit
        } else if (query && query.includes('SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1')) {
          return Promise.resolve({ rows: [{ count: '2' }] }); // Current project count
        } else if (query && query.includes('INSERT INTO projects')) {
          // Create a new project object with the sent data
          const newProject = { ...mockProject, name: projectData.name, description: projectData.description, status: projectData.status };
          return Promise.resolve({ rows: [newProject] });
        } else if (query && query.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      const projectData = {
        name: 'New Project',
        description: 'New Project Description',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(projectData.name);
    });

    it('should return 400 for invalid project data', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
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
        { id: 'project1', name: 'Project One', description: 'Description 1', status: 'active', created_at: new Date(), task_count: 0 },
        { id: 'project2', name: 'Project Two', description: 'Description 2', status: 'active', created_at: new Date(), task_count: 0 }
      ];

      // Clear any existing mock implementation and set up specific mocks for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockClear();
      
      // Mock implementation that handles all queries for this specific test
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          // Authentication query
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT p.*, (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND tenant_id')) {
          // Main projects query
          return Promise.resolve({ rows: mockProjects });
        } else if (query && query.includes('SELECT COUNT(*) as count FROM projects WHERE tenant_id')) {
          // Count query for pagination
          return Promise.resolve({ rows: [{ count: '2' }] });
        }
        return Promise.resolve({ rows: [] });
      });
      
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${regularUserToken}`)
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
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [mockProject] });
        } else if (query && query.includes('SELECT COUNT(*) as total_tasks')) {
          return Promise.resolve({ rows: [{ total_tasks: 0, todo_count: 0, in_progress_count: 0, completed_count: 0 }] });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .get('/api/projects/project-id')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(mockProject.name);
    });

    it('should return project details for super admin', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockSuperAdmin] });
        } else if (query && query.includes('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2')) {
          // For super admin, the tenant isolation might be handled differently
          // or the project might be found based on different logic
          return Promise.resolve({ rows: [mockProject] });
        } else if (query && query.includes('SELECT COUNT(*) as total_tasks')) {
          return Promise.resolve({ rows: [{ total_tasks: 0, todo_count: 0, in_progress_count: 0, completed_count: 0 }] });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .get('/api/projects/project-id')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(mockProject.name);
    });

    it('should return 404 for non-existent project', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT id, name, description, status, created_at FROM projects WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [] }); // No project found
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .get('/api/projects/non-existent')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for unauthorized access to project from different tenant', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT id, name, description, status, created_at FROM projects WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [] }); // Project not found in user's tenant
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .get('/api/projects/project-from-different-tenant')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/projects/:projectId', () => {
    it('should update project for authorized user', async () => {
      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated Description'
      };

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [mockProject] }); // Project exists and belongs to tenant
        } else if (query && query.includes('UPDATE projects SET')) {
          return Promise.resolve({ rows: [mockProject] });
        } else if (query && query.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .put('/api/projects/project-id')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent project', async () => {
      const updateData = {
        name: 'Updated Project Name'
      };

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT id, tenant_id FROM projects WHERE id = $1')) {
          return Promise.resolve({ rows: [] }); // Project not found
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .put('/api/projects/non-existent')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized project update', async () => {
      const updateData = {
        name: 'Updated Project Name'
      };

      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [mockProject] }); // Project exists
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .put('/api/projects/project-id')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(updateData)
        .expect(403); // Will return 403 because user is not tenant_admin

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/projects/:projectId', () => {
    it('should delete project for authorized user', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [mockProject] }); // Project exists and belongs to tenant
        } else if (query && query.includes('DELETE FROM projects WHERE id = $1')) {
          return Promise.resolve({ rows: [] });
        } else if (query && query.includes('INSERT INTO audit_logs')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .delete('/api/projects/project-id')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project deleted successfully');
    });

    it('should return 404 for non-existent project', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockTenantAdmin] });
        } else if (query && query.includes('SELECT tenant_id FROM projects WHERE id = $1')) {
          return Promise.resolve({ rows: [] }); // Project not found
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .delete('/api/projects/non-existent')
        .set('Authorization', `Bearer ${tenantAdminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized project deletion', async () => {
      // Mock specific queries for this test
      const mockPool = require('../src/config/database').pool;
      mockPool.query.mockImplementation((query, params) => {
        if (query && query.includes('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id')) {
          return Promise.resolve({ rows: [mockRegularUser] });
        } else if (query && query.includes('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2')) {
          return Promise.resolve({ rows: [mockProject] }); // Project exists
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .delete('/api/projects/project-id')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403); // Should return 403 since user is not tenant_admin

      expect(response.body.success).toBe(false);
    });
  });
});