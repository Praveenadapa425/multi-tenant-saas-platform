const { verifyToken } = require('../utils/jwt');
const { pool } = require('../config/database');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Fetch user from database to ensure they still exist and are active
    const userResult = await pool.query(
      'SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = userResult.rows[0];
    
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive'
      });
    }
    
    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      tenantId: user.tenant_id
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}

/**
 * Authorization middleware
 * Checks if user has required role
 * @param {...string} roles - Allowed roles
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
}

/**
 * Tenant isolation middleware
 * Ensures user can only access their tenant's data
 * Super admins can access all tenants
 */
function tenantIsolation(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Super admins can access all tenants
  if (req.user.role === 'super_admin') {
    if (req.params.tenantId) {
      req.targetTenantId = req.params.tenantId;
    } else if (req.query.tenantId) {
      // Allow super_admin to specify tenant via query parameter as well
      req.targetTenantId = req.query.tenantId;
    }
    next();
    return;
  }

  // Regular users can only access their own tenant
  if (req.params.tenantId && req.params.tenantId !== req.user.tenantId) {
    return res.status(403).json({
      success: false,
      message: 'Access to this tenant is forbidden'
    });
  }

  req.targetTenantId = req.user.tenantId;
  next();
}

module.exports = {
  authenticate,
  authorize,
  tenantIsolation
};