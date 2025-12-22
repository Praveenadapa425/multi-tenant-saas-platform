const { pool } = require('../config/database');

class Project {
  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} - Created project
   */
  static async create(projectData) {
    const { tenantId, name, description, status = 'active', createdBy } = projectData;
    
    const query = `
      INSERT INTO projects (tenant_id, name, description, status, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [tenantId, name, description, status, createdBy];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Find project by ID
   * @param {string} id - Project ID
   * @returns {Promise<Object|null>} - Project or null if not found
   */
  static async findById(id) {
    const query = 'SELECT * FROM projects WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Find project by ID and tenant ID
   * @param {string} id - Project ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object|null>} - Project or null if not found
   */
  static async findByIdAndTenant(id, tenantId) {
    const query = 'SELECT * FROM projects WHERE id = $1 AND tenant_id = $2';
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }
  
  /**
   * List projects by tenant ID
   * @param {string} tenantId - Tenant ID
   * @param {Object} params - Filter and pagination parameters
   * @param {string} params.status - Filter by status
   * @param {string} params.search - Search term for project name
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20)
   * @returns {Promise<Object>} - Paginated projects list
   */
  static async listByTenant(tenantId, { status, search, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT p.*, 
             u.full_name as created_by_name,
             COUNT(t.id) as task_count,
             COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_task_count
      FROM projects p
      LEFT JOIN users u ON u.id = p.created_by
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.tenant_id = $1
    `;
    
    const conditions = [];
    const values = [tenantId];
    let index = 2;
    
    if (status) {
      conditions.push(`p.status = $${index}`);
      values.push(status);
      index++;
    }
    
    if (search) {
      conditions.push(`p.name ILIKE $${index}`);
      values.push(`%${search}%`);
      index++;
    }
    
    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }
    
    query += `
      GROUP BY p.id, u.full_name
      ORDER BY p.created_at DESC
      LIMIT $${index} OFFSET $${index + 1}
    `;
    
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1';
    if (conditions.length > 0) {
      countQuery += ` AND ${conditions.join(' AND ')}`;
    }
    
    const countResult = await pool.query(countQuery, values.slice(0, -2)); // Remove limit and offset
    const totalCount = parseInt(countResult.rows[0].count);
    
    return {
      projects: result.rows,
      total: totalCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit
      }
    };
  }
  
  /**
   * Update project
   * @param {string} id - Project ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} - Updated project or null if not found
   */
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let index = 1;
    
    // Only allow specific fields to be updated
    const allowedFields = ['name', 'description', 'status'];
    
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
    
    values.push(id); // Add project ID for WHERE clause
    
    const query = `
      UPDATE projects
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${index}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }
  
  /**
   * Delete project
   * @param {string} id - Project ID
   * @returns {Promise<boolean>} - True if deleted, false if not found
   */
  static async delete(id) {
    const query = 'DELETE FROM projects WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
  
  /**
   * Check if tenant has reached project limit
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<boolean>} - True if limit reached
   */
  static async isProjectLimitReached(tenantId) {
    // Get tenant's max projects limit
    const tenantQuery = 'SELECT max_projects FROM tenants WHERE id = $1';
    const tenantResult = await pool.query(tenantQuery, [tenantId]);
    
    if (tenantResult.rows.length === 0) {
      throw new Error('Tenant not found');
    }
    
    const maxProjects = tenantResult.rows[0].max_projects;
    
    // Count current projects
    const projectQuery = 'SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1';
    const projectResult = await pool.query(projectQuery, [tenantId]);
    const currentProjectCount = parseInt(projectResult.rows[0].count);
    
    return currentProjectCount >= maxProjects;
  }
}

module.exports = Project;