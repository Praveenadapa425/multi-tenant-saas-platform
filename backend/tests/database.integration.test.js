const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Use test database
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'saas_test',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // Clean up and prepare test data
    await pool.query('DELETE FROM tasks WHERE id LIKE \'test_%\'');
    await pool.query('DELETE FROM projects WHERE id LIKE \'test_%\'');
    await pool.query('DELETE FROM users WHERE id LIKE \'test_%\'');
    await pool.query('DELETE FROM tenants WHERE id LIKE \'test_%\'');
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM tasks WHERE id LIKE \'test_%\'');
    await pool.query('DELETE FROM projects WHERE id LIKE \'test_%\'');
    await pool.query('DELETE FROM users WHERE id LIKE \'test_%\'');
    await pool.query('DELETE FROM tenants WHERE id LIKE \'test_%\'');
    await pool.end();
  });

  describe('Tenant Operations', () => {
    it('should create, read, update, and delete a tenant', async () => {
      // Create tenant
      const tenantId = 'test_tenant_1';
      const tenantName = 'Test Tenant 1';
      const subdomain = 'test1';
      
      const createResult = await pool.query(`
        INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *
      `, [tenantId, tenantName, subdomain, 'active', 'free', 5, 5]);
      
      expect(createResult.rows).toHaveLength(1);
      expect(createResult.rows[0].name).toBe(tenantName);
      
      // Read tenant
      const readResult = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
      expect(readResult.rows).toHaveLength(1);
      expect(readResult.rows[0].name).toBe(tenantName);
      
      // Update tenant
      const updatedName = 'Updated Test Tenant 1';
      const updateResult = await pool.query(`
        UPDATE tenants 
        SET name = $1 
        WHERE id = $2 
        RETURNING *
      `, [updatedName, tenantId]);
      
      expect(updateResult.rows).toHaveLength(1);
      expect(updateResult.rows[0].name).toBe(updatedName);
      
      // Delete tenant
      const deleteResult = await pool.query('DELETE FROM tenants WHERE id = $1 RETURNING id', [tenantId]);
      expect(deleteResult.rows).toHaveLength(1);
      expect(deleteResult.rows[0].id).toBe(tenantId);
    });
  });

  describe('User Operations', () => {
    let tenantId;
    
    beforeAll(async () => {
      // Create a test tenant first
      tenantId = 'test_user_tenant';
      await pool.query(`
        INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [tenantId, 'Test User Tenant', 'test-user', 'active', 'free', 5, 5]);
    });

    afterAll(async () => {
      // Clean up the test tenant
      await pool.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    });

    it('should create, read, update, and delete a user', async () => {
      // Create user
      const userId = 'test_user_1';
      const email = 'testuser@example.com';
      const passwordHash = await bcrypt.hash('Password123!', 10);
      
      const createResult = await pool.query(`
        INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *
      `, [userId, tenantId, email, passwordHash, 'Test', 'User', 'user', 'active']);
      
      expect(createResult.rows).toHaveLength(1);
      expect(createResult.rows[0].email).toBe(email);
      
      // Read user
      const readResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      expect(readResult.rows).toHaveLength(1);
      expect(readResult.rows[0].email).toBe(email);
      
      // Update user
      const updatedEmail = 'updateduser@example.com';
      const updateResult = await pool.query(`
        UPDATE users 
        SET email = $1 
        WHERE id = $2 
        RETURNING *
      `, [updatedEmail, userId]);
      
      expect(updateResult.rows).toHaveLength(1);
      expect(updateResult.rows[0].email).toBe(updatedEmail);
      
      // Delete user
      const deleteResult = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
      expect(deleteResult.rows).toHaveLength(1);
      expect(deleteResult.rows[0].id).toBe(userId);
    });
  });

  describe('Project Operations', () => {
    let tenantId, userId;
    
    beforeAll(async () => {
      // Create test tenant and user
      tenantId = 'test_project_tenant';
      userId = 'test_project_user';
      
      await pool.query(`
        INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [tenantId, 'Test Project Tenant', 'test-project', 'active', 'free', 5, 5]);
      
      const passwordHash = await bcrypt.hash('Password123!', 10);
      await pool.query(`
        INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [userId, tenantId, 'project@example.com', passwordHash, 'Project', 'User', 'user', 'active']);
    });

    afterAll(async () => {
      // Clean up
      await pool.query('DELETE FROM projects WHERE id LIKE \'test_%\'');
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
      await pool.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    });

    it('should create, read, update, and delete a project', async () => {
      // Create project
      const projectId = 'test_project_1';
      const projectName = 'Test Project 1';
      
      const createResult = await pool.query(`
        INSERT INTO projects (id, tenant_id, user_id, name, description) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *
      `, [projectId, tenantId, userId, projectName, 'Test project description']);
      
      expect(createResult.rows).toHaveLength(1);
      expect(createResult.rows[0].name).toBe(projectName);
      
      // Read project
      const readResult = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
      expect(readResult.rows).toHaveLength(1);
      expect(readResult.rows[0].name).toBe(projectName);
      
      // Update project
      const updatedName = 'Updated Test Project 1';
      const updateResult = await pool.query(`
        UPDATE projects 
        SET name = $1 
        WHERE id = $2 
        RETURNING *
      `, [updatedName, projectId]);
      
      expect(updateResult.rows).toHaveLength(1);
      expect(updateResult.rows[0].name).toBe(updatedName);
      
      // Delete project
      const deleteResult = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [projectId]);
      expect(deleteResult.rows).toHaveLength(1);
      expect(deleteResult.rows[0].id).toBe(projectId);
    });
  });

  describe('Task Operations', () => {
    let tenantId, userId, projectId;
    
    beforeAll(async () => {
      // Create test tenant, user, and project
      tenantId = 'test_task_tenant';
      userId = 'test_task_user';
      projectId = 'test_task_project';
      
      await pool.query(`
        INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [tenantId, 'Test Task Tenant', 'test-task', 'active', 'free', 5, 5]);
      
      const passwordHash = await bcrypt.hash('Password123!', 10);
      await pool.query(`
        INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [userId, tenantId, 'task@example.com', passwordHash, 'Task', 'User', 'user', 'active']);
      
      await pool.query(`
        INSERT INTO projects (id, tenant_id, user_id, name, description) 
        VALUES ($1, $2, $3, $4, $5)
      `, [projectId, tenantId, userId, 'Test Task Project', 'Test task project']);
    });

    afterAll(async () => {
      // Clean up
      await pool.query('DELETE FROM tasks WHERE id LIKE \'test_%\'');
      await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
      await pool.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    });

    it('should create, read, update, and delete a task', async () => {
      // Create task
      const taskId = 'test_task_1';
      const taskTitle = 'Test Task 1';
      
      const createResult = await pool.query(`
        INSERT INTO tasks (id, tenant_id, project_id, assigned_user_id, title, description, status, priority) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *
      `, [taskId, tenantId, projectId, userId, taskTitle, 'Test task description', 'todo', 'medium']);
      
      expect(createResult.rows).toHaveLength(1);
      expect(createResult.rows[0].title).toBe(taskTitle);
      
      // Read task
      const readResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
      expect(readResult.rows).toHaveLength(1);
      expect(readResult.rows[0].title).toBe(taskTitle);
      
      // Update task
      const updatedTitle = 'Updated Test Task 1';
      const updateResult = await pool.query(`
        UPDATE tasks 
        SET title = $1 
        WHERE id = $2 
        RETURNING *
      `, [updatedTitle, taskId]);
      
      expect(updateResult.rows).toHaveLength(1);
      expect(updateResult.rows[0].title).toBe(updatedTitle);
      
      // Delete task
      const deleteResult = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [taskId]);
      expect(deleteResult.rows).toHaveLength(1);
      expect(deleteResult.rows[0].id).toBe(taskId);
    });
  });

  describe('Tenant Isolation', () => {
    let tenant1Id, tenant2Id;
    let user1Id, user2Id;
    let project1Id, project2Id;
    let task1Id, task2Id;
    
    beforeAll(async () => {
      // Create two test tenants
      tenant1Id = 'tenant_isolation_1';
      tenant2Id = 'tenant_isolation_2';
      
      await pool.query(`
        INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [tenant1Id, 'Tenant Isolation 1', 'iso1', 'active', 'free', 5, 5]);
      
      await pool.query(`
        INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [tenant2Id, 'Tenant Isolation 2', 'iso2', 'active', 'free', 5, 5]);
      
      // Create users in each tenant
      const passwordHash = await bcrypt.hash('Password123!', 10);
      user1Id = 'iso_user_1';
      user2Id = 'iso_user_2';
      
      await pool.query(`
        INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [user1Id, tenant1Id, 'iso1@example.com', passwordHash, 'ISO', 'User1', 'user', 'active']);
      
      await pool.query(`
        INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [user2Id, tenant2Id, 'iso2@example.com', passwordHash, 'ISO', 'User2', 'user', 'active']);
      
      // Create projects in each tenant
      project1Id = 'iso_project_1';
      project2Id = 'iso_project_2';
      
      await pool.query(`
        INSERT INTO projects (id, tenant_id, user_id, name, description) 
        VALUES ($1, $2, $3, $4, $5)
      `, [project1Id, tenant1Id, user1Id, 'ISO Project 1', 'ISO Project 1']);
      
      await pool.query(`
        INSERT INTO projects (id, tenant_id, user_id, name, description) 
        VALUES ($1, $2, $3, $4, $5)
      `, [project2Id, tenant2Id, user2Id, 'ISO Project 2', 'ISO Project 2']);
      
      // Create tasks in each tenant
      task1Id = 'iso_task_1';
      task2Id = 'iso_task_2';
      
      await pool.query(`
        INSERT INTO tasks (id, tenant_id, project_id, assigned_user_id, title, description, status, priority) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [task1Id, tenant1Id, project1Id, user1Id, 'ISO Task 1', 'ISO Task 1', 'todo', 'medium']);
      
      await pool.query(`
        INSERT INTO tasks (id, tenant_id, project_id, assigned_user_id, title, description, status, priority) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [task2Id, tenant2Id, project2Id, user2Id, 'ISO Task 2', 'ISO Task 2', 'todo', 'medium']);
    });

    afterAll(async () => {
      // Clean up all test data
      await pool.query('DELETE FROM tasks WHERE id IN ($1, $2)', [task1Id, task2Id]);
      await pool.query('DELETE FROM projects WHERE id IN ($1, $2)', [project1Id, project2Id]);
      await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [user1Id, user2Id]);
      await pool.query('DELETE FROM tenants WHERE id IN ($1, $2)', [tenant1Id, tenant2Id]);
    });

    it('should ensure tenant data isolation', async () => {
      // Query for tenant 1's data - should only return tenant 1's records
      const tenant1Users = await pool.query('SELECT * FROM users WHERE tenant_id = $1', [tenant1Id]);
      expect(tenant1Users.rows).toHaveLength(1);
      expect(tenant1Users.rows[0].id).toBe(user1Id);
      
      const tenant1Projects = await pool.query('SELECT * FROM projects WHERE tenant_id = $1', [tenant1Id]);
      expect(tenant1Projects.rows).toHaveLength(1);
      expect(tenant1Projects.rows[0].id).toBe(project1Id);
      
      const tenant1Tasks = await pool.query('SELECT * FROM tasks WHERE tenant_id = $1', [tenant1Id]);
      expect(tenant1Tasks.rows).toHaveLength(1);
      expect(tenant1Tasks.rows[0].id).toBe(task1Id);
      
      // Query for tenant 2's data - should only return tenant 2's records
      const tenant2Users = await pool.query('SELECT * FROM users WHERE tenant_id = $1', [tenant2Id]);
      expect(tenant2Users.rows).toHaveLength(1);
      expect(tenant2Users.rows[0].id).toBe(user2Id);
      
      const tenant2Projects = await pool.query('SELECT * FROM projects WHERE tenant_id = $1', [tenant2Id]);
      expect(tenant2Projects.rows).toHaveLength(1);
      expect(tenant2Projects.rows[0].id).toBe(project2Id);
      
      const tenant2Tasks = await pool.query('SELECT * FROM tasks WHERE tenant_id = $1', [tenant2Id]);
      expect(tenant2Tasks.rows).toHaveLength(1);
      expect(tenant2Tasks.rows[0].id).toBe(task2Id);
      
      // Cross-tenant queries should return no results
      const crossTenantQuery = await pool.query('SELECT * FROM projects WHERE tenant_id = $1 AND id = $2', [tenant1Id, project2Id]);
      expect(crossTenantQuery.rows).toHaveLength(0);
      
      const crossTenantQuery2 = await pool.query('SELECT * FROM tasks WHERE tenant_id = $1 AND project_id = $2', [tenant1Id, project2Id]);
      expect(crossTenantQuery2.rows).toHaveLength(0);
    });
  });
});