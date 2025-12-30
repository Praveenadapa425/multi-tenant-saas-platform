const { pool } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { logAction } = require('../utils/auditLogger');
const { sanitizeString, sanitizeObject } = require('../utils/sanitize');
const logger = require('../utils/logger');

/**
 * Register a new tenant with admin user
 * POST /api/auth/register-tenant
 */
async function registerTenant(req, res) {
  const client = await pool.connect();
  
  try {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;
    
    await client.query('BEGIN');
    
    // Check if subdomain already exists
    const existingTenant = await client.query(
      'SELECT id FROM tenants WHERE subdomain = $1',
      [subdomain]
    );
    
    if (existingTenant.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Subdomain already exists'
      });
    }
    
    // Check if email already exists
    const existingEmail = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (existingEmail.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(adminPassword);
    
    // Create tenant with free plan defaults
    const tenantResult = await client.query(
      `INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
       VALUES ($1, $2, 'active', 'free', 5, 3)
       RETURNING id, name, subdomain`,
      [tenantName, subdomain]
    );
    
    const tenant = tenantResult.rows[0];
    
    // Create admin user
    const userResult = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, 'tenant_admin', true)
       RETURNING id, email, full_name, role`,
      [tenant.id, adminEmail, hashedPassword, adminFullName]
    );
    
    const adminUser = userResult.rows[0];
    
    // Log action
    await client.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tenant.id, adminUser.id, 'CREATE_TENANT', 'tenant', tenant.id, req.ip]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenantId: tenant.id,
        subdomain: tenant.subdomain,
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
          fullName: adminUser.full_name,
          role: adminUser.role
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Tenant registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Tenant registration failed'
    });
  } finally {
    client.release();
  }
}

/**
 * User login
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password, tenantSubdomain } = req.body;
    
    // First, try to find super_admin user (with NULL tenant_id)
    let userResult = await pool.query(
      'SELECT id, email, password_hash, full_name, role, is_active, tenant_id FROM users WHERE email = $1 AND role = $2 AND tenant_id IS NULL',
      [email, 'super_admin']
    );
    
    let user = null;
    let tenant = null;
    
    if (userResult.rows.length > 0) {
      // Found super_admin user
      user = userResult.rows[0];
      
      // For super_admin users, tenantSubdomain is optional
      if (tenantSubdomain) {
        // If provided, validate the tenant exists and is active
        const tenantResult = await pool.query(
          'SELECT id, status FROM tenants WHERE subdomain = $1',
          [tenantSubdomain]
        );
        
        if (tenantResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Tenant not found'
          });
        }
        
        tenant = tenantResult.rows[0];
        
        if (tenant.status !== 'active') {
          return res.status(403).json({
            success: false,
            message: 'Tenant account is not active'
          });
        }
      }
      // If no tenantSubdomain provided, super_admin can still log in
    } else {
      // For regular users, tenantSubdomain is required
      if (!tenantSubdomain) {
        return res.status(400).json({
          success: false,
          message: 'Tenant subdomain is required for non-super-admin users'
        });
      }
      
      // Find tenant by subdomain for regular users
      const tenantResult = await pool.query(
        'SELECT id, status FROM tenants WHERE subdomain = $1',
        [tenantSubdomain]
      );
      
      if (tenantResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
      }
      
      tenant = tenantResult.rows[0];
      
      if (tenant.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Tenant account is not active'
        });
      }
      
      // Find regular user by email and tenant
      userResult = await pool.query(
        'SELECT id, email, password_hash, full_name, role, is_active, tenant_id FROM users WHERE email = $1 AND tenant_id = $2',
        [email, tenant.id]
      );
      
      if (userResult.rows.length > 0) {
        user = userResult.rows[0];
      }
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'User account is not active'
      });
    }
    
    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role
    });
    
    // Log action - for super_admin, we might not have a tenant_id
    await pool.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.tenant_id, user.id, 'USER_LOGIN', 'user', user.id, req.ip]
    );
    
    res.status(200).json({
      success: true,
      data: {
        user: sanitizeObject({
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId: user.tenant_id
        }),
        token: token,
        expiresIn: 86400
      }
    });
  } catch (error) {
    logger.error('Login error', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
}

/**
 * Get current user information
 * GET /api/auth/me
 */
async function getCurrentUser(req, res) {
  try {
    const userId = req.user.id;
    
    // Get user and tenant info
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.tenant_id,
              t.id as tenant_id_check, t.name, t.subdomain, t.subscription_plan, t.max_users, t.max_projects
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const userData = result.rows[0];
    
    res.status(200).json({
      success: true,
      data: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        role: userData.role,
        isActive: userData.is_active,
        tenant: userData.tenant_id ? {
          id: userData.tenant_id,
          name: userData.name,
          subdomain: userData.subdomain,
          subscriptionPlan: userData.subscription_plan,
          maxUsers: userData.max_users,
          maxProjects: userData.max_projects
        } : null
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information'
    });
  }
}

/**
 * User logout
 * POST /api/auth/logout
 */
async function logout(req, res) {
  try {
    // Log action
    await pool.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.tenantId, req.user.id, 'USER_LOGOUT', 'user', req.user.id, req.ip]
    );
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
}

module.exports = {
  registerTenant,
  login,
  getCurrentUser,
  logout
};