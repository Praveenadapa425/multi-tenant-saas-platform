const { verifyToken } = require('../utils/jwt');
const User = require('../models/user.model');

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
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    // Attach user and tenant info to request
    req.user = user;
    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;
    req.role = decoded.role;
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
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
    
    if (!roles.includes(req.role)) {
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
  if (req.role === 'super_admin') {
    // If a specific tenant is requested, verify it exists
    if (req.params.tenantId) {
      req.targetTenantId = req.params.tenantId;
    }
    next();
    return;
  }
  
  // Regular users can only access their own tenant
  if (req.params.tenantId && req.params.tenantId !== req.tenantId) {
    return res.status(403).json({
      success: false,
      message: 'Access to this tenant is forbidden'
    });
  }
  
  // Set target tenant to user's tenant
  req.targetTenantId = req.tenantId;
  next();
}

module.exports = {
  authenticate,
  authorize,
  tenantIsolation
};