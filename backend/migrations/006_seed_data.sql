-- Seed data for testing
-- Password hashes are bcrypt hashed versions of the plain text passwords

-- Insert Super Admin user
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'superadmin@system.com',
  '$2b$10$nPqZvTj8GJDxQfKfXWs3ne8XWlfjVPY/3VFpZgF5T8vZiLcJpJPBe', -- Admin@123
  'Super Administrator',
  'super_admin',
  true
);

-- Insert Demo Company tenant
INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'Demo Company',
  'demo',
  'active',
  'pro',
  25,
  15
);

-- Insert Demo Company Admin
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'admin@demo.com',
  '$2b$10$eImiTXuWVxfaHNAVIqlFQOYP32lSB8qwVs8I4VWUgIY8yJPYMmoEa', -- Demo@123
  'Admin User',
  'tenant_admin',
  true
);

-- Insert Demo Company Users
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES 
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'user1@demo.com',
    '$2b$10$j0NfhYqzYqhxJy6q5AEkxOOEVH7vVJqGN1PIxrClGZGRx1fLvn9Iu', -- User@123
    'User One',
    'user',
    true
  ),
  (
    '40000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'user2@demo.com',
    '$2b$10$j0NfhYqzYqhxJy6q5AEkxOOEVH7vVJqGN1PIxrClGZGRx1fLvn9Iu', -- User@123
    'User Two',
    'user',
    true
  );

-- Insert Demo Company Projects
INSERT INTO projects (id, tenant_id, name, description, status, created_by)
VALUES
  (
    '50000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Project Alpha',
    'First demo project for task management',
    'active',
    '20000000-0000-0000-0000-000000000001'
  ),
  (
    '60000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Project Beta',
    'Second demo project for testing workflows',
    'active',
    '20000000-0000-0000-0000-000000000001'
  );

-- Insert Demo Company Tasks
INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
VALUES
  (
    '70000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Design homepage mockup',
    'Create high-fidelity design for the homepage',
    'todo',
    'high',
    '30000000-0000-0000-0000-000000000001',
    '2025-12-31'
  ),
  (
    '80000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Implement backend API',
    'Implement REST API endpoints for project management',
    'in_progress',
    'high',
    '40000000-0000-0000-0000-000000000001',
    '2025-12-28'
  ),
  (
    '90000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Write documentation',
    'Create comprehensive API documentation',
    'completed',
    'medium',
    '30000000-0000-0000-0000-000000000001',
    '2025-12-25'
  ),
  (
    '11000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Setup database',
    'Configure PostgreSQL database for the project',
    'completed',
    'high',
    '40000000-0000-0000-0000-000000000001',
    '2025-12-20'
  );

-- Insert sample audit logs
INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'CREATE_PROJECT',
    'project',
    '50000000-0000-0000-0000-000000000001',
    '127.0.0.1'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'CREATE_USER',
    'user',
    '30000000-0000-0000-0000-000000000001',
    '127.0.0.1'
  );
