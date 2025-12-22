-- Seed data for the multi-tenant SaaS platform

-- Create super admin user
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', NULL, 'superadmin@system.com', '$2b$10$rV3J./PzGBkXH5GI5pS/seJaqG9.wBdqMsMhcW1.n.D.bEz9RFpIy', 'Super Admin', 'super_admin', true);

-- Create a demo tenant
INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects)
VALUES ('10000000-0000-0000-0000-000000000001', 'Demo Company', 'demo', 'active', 'pro', 25, 15);

-- Create tenant admin for demo company
-- Password: Demo@123 (already bcrypt hashed)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'admin@demo.com', '$2b$10$rV3J./PzGBkXH5GI5pS/seJaqG9.wBdqMsMhcW1.n.D.bEz9RFpIy', 'Demo Admin', 'tenant_admin', true);

-- Create regular users for demo company
-- Password: User@123 (already bcrypt hashed)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES ('10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'user1@demo.com', '$2b$10$rV3J./PzGBkXH5GI5pS/seJaqG9.wBdqMsMhcW1.n.D.bEz9RFpIy', 'Demo User 1', 'user', true);

INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES ('10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'user2@demo.com', '$2b$10$rV3J./PzGBkXH5GI5pS/seJaqG9.wBdqMsMhcW1.n.D.bEz9RFpIy', 'Demo User 2', 'user', true);

-- Create sample projects for demo company
INSERT INTO projects (id, tenant_id, name, description, status, created_by)
VALUES ('10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Project Alpha', 'First demo project', 'active', '10000000-0000-0000-0000-000000000002');

INSERT INTO projects (id, tenant_id, name, description, status, created_by)
VALUES ('10000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'Project Beta', 'Second demo project', 'active', '10000000-0000-0000-0000-000000000002');

-- Create sample tasks
INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to)
VALUES ('10000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Design homepage mockup', 'Create high-fidelity design', 'todo', 'high', '10000000-0000-0000-0000-000000000003');

INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to)
VALUES ('10000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Implement user authentication', 'Set up JWT-based authentication', 'in_progress', 'high', '10000000-0000-0000-0000-000000000004');

INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority)
VALUES ('10000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'Write documentation', 'Create user guides and API documentation', 'todo', 'medium');