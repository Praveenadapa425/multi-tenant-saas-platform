const { pool } = require('../config/database');
const { sanitizeString, sanitizeObject } = require('../utils/sanitize');
const logger = require('../utils/logger');
const { logAction } = require('../utils/auditLogger');
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../constants');

/**
 * List all tenants (Super Admin only)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.listTenants = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, subscriptionPlan } = req.query;
    const offset = (page - 1) * limit;

    // Build query with optional filters
    let query = `SELECT id, name, subdomain, status, subscription_plan, created_at, updated_at
      FROM tenants WHERE 1=1`;
    let countQuery = 'SELECT COUNT(*) FROM tenants WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      countQuery += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (subscriptionPlan) {
      query += ` AND subscription_plan = $${paramCount}`;
      countQuery += ` AND subscription_plan = $${paramCount}`;
      params.push(subscriptionPlan);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(countQuery, params.slice(0, paramCount - 1));
    const totalCount = parseInt(countResult.rows[0].count, 10);

    logger.info('All tenants retrieved', { page, limit, totalCount });

    res.status(200).json({
      success: true,
      tenants: result.rows.map(sanitizeObject),
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    logger.error('Error listing tenants', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_ERROR
    });
  }
};

/**
 * Get tenant details
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const userId = req.user.id;

    // Check if user exists
    const userQuery = `
      SELECT id, role, tenant_id FROM users WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN
      });
    }
    
    const user = userResult.rows[0];
    
    // Super admin can access any tenant, regular users can only access their own
    if (user.role !== 'super_admin' && user.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN
      });
    }

    // Get tenant details
    const query = `
      SELECT id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at, updated_at
      FROM tenants
      WHERE id = $1
    `;

    const result = await pool.query(query, [tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.RESOURCE_NOT_FOUND
      });
    }
    
    const tenant = result.rows[0];
    
    // Get tenant stats
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1)::int as total_users,
        (SELECT COUNT(*) FROM projects WHERE tenant_id = $1)::int as total_projects,
        (SELECT COUNT(*) FROM tasks WHERE tenant_id = $1)::int as total_tasks
      `;
    
    const statsResult = await pool.query(statsQuery, [tenantId]);
    const stats = statsResult.rows[0] || {};

    logger.info('Tenant retrieved', { tenantId, userId });

    res.status(200).json({
      success: true,
      data: {
        ...sanitizeObject(tenant),
        stats: {
          totalUsers: stats.total_users || 0,
          totalProjects: stats.total_projects || 0,
          totalTasks: stats.total_tasks || 0
        }
      }
    });
  } catch (error) {
    logger.error('Error getting tenant', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_ERROR
    });
  }
};

/**
 * Update tenant details
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.updateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;
    const userId = req.user.id;

    // Check if user is tenant admin or super admin
    const userQuery = `
      SELECT id, role, tenant_id FROM users
      WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN
      });
    }

    const user = userResult.rows[0];
    
    // Super admin can update any tenant, tenant admin can only update their own tenant
    if (user.role !== 'super_admin' && user.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN
      });
    }

    const userRole = user.role;

    // Check permissions
    if (userRole !== 'tenant_admin' && userRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN
      });
    }

    // Super admin can update all fields, tenant admin can only update name
    if (userRole === 'tenant_admin' && (status || subscriptionPlan || maxUsers || maxProjects)) {
      return res.status(403).json({
        success: false,
        message: 'Tenant admin can only update name'
      });
    }

    // Build update query
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      params.push(sanitizeString(name));
      paramCount++;
    }

    if (status) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (subscriptionPlan) {
      updates.push(`subscription_plan = $${paramCount}`);
      params.push(subscriptionPlan);
      paramCount++;
    }

    if (maxUsers) {
      updates.push(`max_users = $${paramCount}`);
      params.push(maxUsers);
      paramCount++;
    }

    if (maxProjects) {
      updates.push(`max_projects = $${paramCount}`);
      params.push(maxProjects);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push(`updated_at = NOW()`);
    params.push(tenantId);

    const updateQuery = `
      UPDATE tenants
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, params);

    // Log action
    await logAction({
      tenantId: user.role === 'super_admin' ? tenantId : user.tenant_id,
      userId: userId,
      action: 'UPDATE_TENANT',
      entityType: 'tenant',
      entityId: tenantId,
      ipAddress: req.ip
    });
    logger.info('Tenant updated', { tenantId, userId });

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.UPDATE_SUCCESS,
      tenant: sanitizeObject(result.rows[0])
    });
  } catch (error) {
    logger.error('Error updating tenant', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_ERROR
    });
  }
};

/**
 * Get tenant statistics
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getTenantStats = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const userId = req.user.id;

    // Check if user belongs to this tenant
    const userTenantQuery = `
      SELECT user_id FROM users WHERE id = $1 AND tenant_id = $2
    `;
    const userTenantResult = await pool.query(userTenantQuery, [userId, tenantId]);

    if (userTenantResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN
      });
    }

    // Get stats
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1)::int as total_users,
        (SELECT COUNT(*) FROM projects WHERE tenant_id = $1)::int as total_projects,
        (SELECT COUNT(*) FROM tasks WHERE tenant_id = $1)::int as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE tenant_id = $1 AND status = 'completed')::int as completed_tasks
    `;

    const result = await pool.query(statsQuery, [tenantId]);
    logger.info('Tenant stats retrieved', { tenantId, userId });

    res.status(200).json({
      success: true,
      stats: result.rows[0]
    });
  } catch (error) {
    logger.error('Error getting tenant stats', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_ERROR
    });
  }
};

/**
 * Delete tenant
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.deleteTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const userId = req.user.id;

    // Only super admins can delete tenants
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN
      });
    }

    // Check if tenant exists
    const tenantQuery = `SELECT id, name FROM tenants WHERE id = $1`;
    const tenantResult = await pool.query(tenantQuery, [tenantId]);

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.RESOURCE_NOT_FOUND
      });
    }

    const tenant = tenantResult.rows[0];

    // Use a transaction to ensure data consistency
    // Check if pool.connect is available (not available in some test mocks)
    if (typeof pool.connect === 'function') {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Delete all related data in proper order due to foreign key constraints
        // 1. Clear references to users in tasks (assigned_to)
        await client.query('UPDATE tasks SET assigned_to = NULL WHERE tenant_id = $1', [tenantId]);
        // 2. Clear references to users in projects (created_by)
        await client.query('UPDATE projects SET created_by = NULL WHERE tenant_id = $1', [tenantId]);
        // 3. Delete tasks
        await client.query('DELETE FROM tasks WHERE tenant_id = $1', [tenantId]);
        // 4. Delete projects
        await client.query('DELETE FROM projects WHERE tenant_id = $1', [tenantId]);
        // 5. Delete users
        await client.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
        // 6. Delete tenant
        await client.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
        
        // Log action
        await logAction({
          tenantId: tenantId,
          userId: userId,
          action: 'DELETE_TENANT',
          entityType: 'tenant',
          entityId: tenantId,
          ipAddress: req.ip
        }, client);
        
        await client.query('COMMIT');
      } catch (transactionError) {
        await client.query('ROLLBACK');
        logger.error('Error in delete tenant transaction', transactionError);
        throw transactionError;
      } finally {
        client.release();
      }
    } else {
      // Fallback for test environments where pool.connect is not available
      // Perform operations without explicit transaction
      await pool.query('UPDATE tasks SET assigned_to = NULL WHERE tenant_id = $1', [tenantId]);
      await pool.query('UPDATE projects SET created_by = NULL WHERE tenant_id = $1', [tenantId]);
      await pool.query('DELETE FROM tasks WHERE tenant_id = $1', [tenantId]);
      await pool.query('DELETE FROM projects WHERE tenant_id = $1', [tenantId]);
      await pool.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
      await pool.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
      
      // Log action
      await logAction({
        tenantId: tenantId,
        userId: userId,
        action: 'DELETE_TENANT',
        entityType: 'tenant',
        entityId: tenantId,
        ipAddress: req.ip
      });
    }

    logger.info('Tenant deleted', { tenantId, tenantName: tenant.name, deletedBy: userId });

    res.status(200).json({
      success: true,
      message: 'Tenant and all related data deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting tenant', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_ERROR
    });
  }
};

/**
 * Get all users in tenant
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getTenantUsers = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const userId = req.user.id;

    // Check if user is admin
    const adminQuery = `
      SELECT role FROM users
      WHERE id = $1 AND tenant_id = $2 AND (role = 'tenant_admin' OR role = 'super_admin')
    `;
    const adminResult = await pool.query(adminQuery, [userId, tenantId]);

    if (adminResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN
      });
    }

    // Get all users in tenant
    const usersQuery = `
      SELECT id, email, full_name, role, status, created_at
      FROM users
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(usersQuery, [tenantId]);
    logger.info('Tenant users retrieved', { tenantId, userId });

    res.status(200).json({
      success: true,
      users: result.rows.map(sanitizeObject)
    });
  } catch (error) {
    logger.error('Error getting tenant users', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_ERROR
    });
  }
};
