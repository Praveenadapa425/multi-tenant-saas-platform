const { pool } = require('../config/database');
const { logAction } = require('../utils/auditLogger');
const { sanitizeObject } = require('../utils/sanitize');
const logger = require('../utils/logger');

/**
 * Get system statistics (Super Admin only)
 * GET /api/superadmin/stats
 */
async function getSystemStats(req, res) {
  try {
    // Only super admins can access this
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    // Get system-wide statistics
    const [tenantsCount, usersCount, projectsCount, tasksCount] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM tenants'),
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM projects'),
      pool.query('SELECT COUNT(*) as count FROM tasks')
    ]);

    const stats = {
      totalTenants: parseInt(tenantsCount.rows[0].count),
      totalUsers: parseInt(usersCount.rows[0].count),
      totalProjects: parseInt(projectsCount.rows[0].count),
      totalTasks: parseInt(tasksCount.rows[0].count)
    };

    // Log action
    await logAction({
      tenantId: null, // No specific tenant for system stats
      userId: req.user.id,
      action: 'GET_SYSTEM_STATS',
      entityType: 'system',
      entityId: 'stats',
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting system stats', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system statistics'
    });
  }
}

/**
 * Get all tenants with their status (Super Admin only)
 * GET /api/superadmin/tenants
 */
async function getAllTenants(req, res) {
  try {
    // Only super admins can access this
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT id, name, subdomain, status, subscription_plan, created_at, updated_at FROM tenants';
    let countQuery = 'SELECT COUNT(*) as count FROM tenants';
    const params = [];
    let countParams = [];

    // Add filters if provided
    if (status) {
      query += ` WHERE status = $${params.length + 1}`;
      countQuery += ' WHERE status = $1';
      params.push(status);
      countParams.push(status);
    }

    if (search) {
      const searchParam = params.length + 1;
      const countSearchParam = countParams.length + 1;
      
      if (status) {
        query += ` AND (name ILIKE $${searchParam} OR subdomain ILIKE $${searchParam})`;
        countQuery += ` AND (name ILIKE $${countSearchParam} OR subdomain ILIKE $${countSearchParam})`;
      } else {
        query += ` WHERE (name ILIKE $${searchParam} OR subdomain ILIKE $${searchParam})`;
        countQuery += ` WHERE (name ILIKE $${countSearchParam} OR subdomain ILIKE $${countSearchParam})`;
      }
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const [tenantsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Log action
    await logAction({
      tenantId: null,
      userId: req.user.id,
      action: 'GET_ALL_TENANTS',
      entityType: 'tenant',
      entityId: null,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: tenantsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: totalPages
      }
    });
  } catch (error) {
    logger.error('Error getting all tenants', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenants'
    });
  }
}

/**
 * Get all users across all tenants (Super Admin only)
 * GET /api/superadmin/users
 */
async function getAllUsers(req, res) {
  try {
    // Only super admins can access this
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const { page = 1, limit = 20, role, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.created_at, u.updated_at, 
                        t.name as tenant_name, t.subdomain as tenant_subdomain
                 FROM users u
                 LEFT JOIN tenants t ON u.tenant_id = t.id`;
    let countQuery = 'SELECT COUNT(*) as count FROM users u';
    const params = [];
    let countParams = [];

    // Add filters if provided
    if (role) {
      query += ` WHERE u.role = $${params.length + 1}`;
      countQuery += ' WHERE u.role = $1';
      params.push(role);
      countParams.push(role);
    }

    if (status) {
      const statusParam = params.length + 1;
      const countStatusParam = countParams.length + 1;
      
      if (role) {
        query += ` AND u.is_active = $${statusParam}`;
        countQuery += ` AND u.is_active = $${countStatusParam}`;
      } else {
        query += ` WHERE u.is_active = $${statusParam}`;
        countQuery += ` WHERE u.is_active = $${countStatusParam}`;
      }
      params.push(status === 'active');
      countParams.push(status === 'active');
    }

    if (search) {
      const searchParam = params.length + 1;
      const countSearchParam = countParams.length + 1;
      
      if (role || status) {
        query += ` AND (u.email ILIKE $${searchParam} OR u.full_name ILIKE $${searchParam})`;
        countQuery += ` AND (u.email ILIKE $${countSearchParam} OR u.full_name ILIKE $${countSearchParam})`;
      } else {
        query += ` WHERE (u.email ILIKE $${searchParam} OR u.full_name ILIKE $${searchParam})`;
        countQuery += ` WHERE (u.email ILIKE $${countSearchParam} OR u.full_name ILIKE $${countSearchParam})`;
      }
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += ' ORDER BY u.created_at DESC';
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Log action
    await logAction({
      tenantId: null,
      userId: req.user.id,
      action: 'GET_ALL_USERS',
      entityType: 'user',
      entityId: null,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: usersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: totalPages
      }
    });
  } catch (error) {
    logger.error('Error getting all users', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
}

/**
 * Update tenant status (Super Admin only)
 * PUT /api/superadmin/tenants/:tenantId/status
 */
async function updateTenantStatus(req, res) {
  try {
    // Only super admins can access this
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const { tenantId } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'suspended', 'trial', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (active, suspended, trial, inactive)'
      });
    }

    // Check if tenant exists
    const tenantResult = await pool.query(
      'SELECT id, name, subdomain FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Update tenant status
    const updateResult = await pool.query(
      'UPDATE tenants SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, tenantId]
    );

    // Log action
    await logAction({
      tenantId: tenantId,
      userId: req.user.id,
      action: 'UPDATE_TENANT_STATUS',
      entityType: 'tenant',
      entityId: tenantId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Tenant status updated successfully',
      data: updateResult.rows[0]
    });
  } catch (error) {
    logger.error('Error updating tenant status', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant status'
    });
  }
}

module.exports = {
  getSystemStats,
  getAllTenants,
  getAllUsers,
  updateTenantStatus
};