const { pool } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { logAction } = require('../utils/auditLogger');
const Tenant = require('../models/tenant.model');
const User = require('../models/user.model');

/**
 * Register a new tenant with admin user
 * POST /api/auth/register-tenant
 */
async function registerTenant(req, res) {
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;
  
  try {
    // Check if subdomain already exists
    const existingTenant = await Tenant.findBySubdomain(subdomain);
    if (existingTenant) {
      return res.status(409).json({
        success: false,
        message: 'Subdomain already exists'
      });
    }
    
    // Check if admin email already exists in this tenant (though tenant doesn't exist yet, good to check globally)
    const existingUser = await User.findByEmail(adminEmail);
    if (existingUser && existingUser.tenant_id) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists for another tenant'
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(adminPassword);
    
    // Use transaction to ensure both tenant and admin user are created
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create tenant
      const tenant = await Tenant.create({
        name: tenantName,
        subdomain: subdomain,
        status: 'active',
        subscriptionPlan: 'free'
      });
      
      // Create admin user
      const adminUser = await User.create({
        tenantId: tenant.id,
        email: adminEmail,
        passwordHash: hashedPassword,
        fullName: adminFullName,
        role: 'tenant_admin',
        isActive: true
      });
      
      await client.query('COMMIT');
      
      // Log action
      await logAction({
        tenantId: tenant.id,
        userId: adminUser.id,
        action: 'CREATE_TENANT',
        entityType: 'tenant',
        entityId: tenant.id,
        ipAddress: req.ip
      });
      
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
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error registering tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register tenant',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

/**
 * User login
 * POST /api/auth/login
 */
async function login(req, res) {
  const { email, password, tenantSubdomain } = req.body;
  
  try {
    // Find tenant by subdomain
    const tenant = await Tenant.findBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }
    
    // Check if tenant is active
    if (tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tenant account is not active'
      });
    }
    
    // Find user by email and tenant
    const user = await User.findByEmailAndTenant(email, tenant.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if user is active
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
    
    // Log action
    await logAction({
      tenantId: user.tenant_id,
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.ip
    });
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          isActive: user.is_active,
          tenantId: user.tenant_id
        },
        token: token,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

/**
 * Get current user information
 * GET /api/auth/me
 */
async function getCurrentUser(req, res) {
  try {
    // Get tenant info
    let tenant = null;
    if (req.tenantId) {
      tenant = await Tenant.findById(req.tenantId);
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        fullName: req.user.full_name,
        role: req.user.role,
        isActive: req.user.is_active,
        tenant: tenant
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
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
    await logAction({
      tenantId: req.tenantId,
      userId: req.userId,
      action: 'USER_LOGOUT',
      entityType: 'user',
      entityId: req.userId,
      ipAddress: req.ip
    });
    
    // For JWT-only auth, we just return success
    // Client should remove the token from storage
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

module.exports = {
  registerTenant,
  login,
  getCurrentUser,
  logout
};