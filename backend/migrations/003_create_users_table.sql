-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'tenant_admin', 'user')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure email is unique per tenant
    UNIQUE(tenant_id, email)
);

-- Create indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert super admin user (no tenant association)
-- Password will be hashed: Admin@123
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', NULL, 'superadmin@system.com', '$2b$10$rV3J./PzGBkXH5GI5pS/seJaqG9.wBdqMsMhcW1.n.D.bEz9RFpIy', 'Super Admin', 'super_admin', true);