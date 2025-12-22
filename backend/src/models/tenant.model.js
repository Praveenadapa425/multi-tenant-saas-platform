const { pool } = require('../config/database');

class Tenant {
  /**
   * Create a new tenant
   * @param {Object} tenantData - Tenant data
   * @returns {Promise<Object>} - Created tenant
   */
  static async create(tenantData) {
    const { name, subdomain, status = 'active', subscriptionPlan = 'free' } = tenantData;
    
    // Set limits based on subscription plan
    let maxUsers = 5;
    let maxProjects = 3;
    
    switch (subscriptionPlan) {
      case 'pro':
        maxUsers = 25;
        maxProjects = 15;
        break;
      case 'enterprise':
        maxUsers = 100;
        maxProjects = 50;
        break;
    }
    
    const query = `
      INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [name, subdomain, status, subscriptionPlan, maxUsers, maxProjects];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Find tenant by ID
   * @param {string} id - Tenant ID
   * @returns {Promise<Object|null>} - Tenant or null if not found
   */
  static async findById(id) {
    const query = 'SELECT * FROM tenants WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Find tenant by subdomain
   * @param {string} subdomain - Tenant subdomain
   * @returns {Promise<Object|null>} - Tenant or null if not found
   */
  static async findBySubdomain(subdomain) {
    const query = 'SELECT * FROM tenants WHERE subdomain = $1';
    const result = await pool.query(query, [subdomain]);
    return result.rows[0] || null;
  }
  
  /**
   * Update tenant
   * @param {string} id - Tenant ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} - Updated tenant or null if not found
   */
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let index = 1;
    
    // Only allow specific fields to be updated
    const allowedFields = ['name', 'status', 'subscription_plan', 'max_users', 'max_projects'];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }
    }
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    values.push(id); // Add tenant ID for WHERE clause
    
    const query = `
      UPDATE tenants
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${index}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }
  
  /**
   * Get tenant statistics
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} - Tenant statistics
   */
  static async getStats(tenantId) {
    const stats = {
      totalUsers: 0,
      totalProjects: 0,
      totalTasks: 0
    };
    
    // Get user count
    const userResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1',
      [tenantId]
    );
    stats.totalUsers = parseInt(userResult.rows[0].count);
    
    // Get project count
    const projectResult = await pool.query(
      'SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1',
      [tenantId]
    );
    stats.totalProjects = parseInt(projectResult.rows[0].count);
    
    // Get task count
    const taskResult = await pool.query(
      'SELECT COUNT(*) as count FROM tasks WHERE tenant_id = $1',
      [tenantId]
    );
    stats.totalTasks = parseInt(taskResult.rows[0].count);
    
    return stats;
  }
  
  /**
   * List all tenants (for super admin)
   * @param {Object} params - Pagination and filter parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.status - Filter by status
   * @param {string} params.subscriptionPlan - Filter by subscription plan
   * @returns {Promise<Object>} - Paginated tenants list
   */
  static async listAll({ page = 1, limit = 10, status, subscriptionPlan }) {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT t.*, 
             COUNT(u.id) as total_users,
             COUNT(p.id) as total_projects
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      LEFT JOIN projects p ON p.tenant_id = t.id
    `;
    
    const conditions = [];
    const values = [];
    let index = 1;
    
    if (status) {
      conditions.push(`t.status = $${index}`);
      values.push(status);
      index++;
    }
    
    if (subscriptionPlan) {
      conditions.push(`t.subscription_plan = $${index}`);
      values.push(subscriptionPlan);
      index++;
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += `
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT $${index} OFFSET $${index + 1}
    `;
    
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM tenants';
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const countResult = await pool.query(countQuery, values.slice(0, -2)); // Remove limit and offset
    const totalCount = parseInt(countResult.rows[0].count);
    
    return {
      tenants: result.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalTenants: totalCount,
        limit
      }
    };
  }
}

module.exports = Tenant;