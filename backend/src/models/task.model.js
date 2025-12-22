const { pool } = require('../config/database');

class Task {
  /**
   * Create a new task
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} - Created task
   */
  static async create(taskData) {
    const { projectId, tenantId, title, description, status = 'todo', priority = 'medium', assignedTo, dueDate } = taskData;
    
    const query = `
      INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [projectId, tenantId, title, description, status, priority, assignedTo, dueDate];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Find task by ID
   * @param {string} id - Task ID
   * @returns {Promise<Object|null>} - Task or null if not found
   */
  static async findById(id) {
    const query = 'SELECT * FROM tasks WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Find task by ID and tenant ID
   * @param {string} id - Task ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object|null>} - Task or null if not found
   */
  static async findByIdAndTenant(id, tenantId) {
    const query = 'SELECT * FROM tasks WHERE id = $1 AND tenant_id = $2';
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }
  
  /**
   * List tasks by project ID
   * @param {string} projectId - Project ID
   * @param {Object} params - Filter and pagination parameters
   * @param {string} params.status - Filter by status
   * @param {string} params.priority - Filter by priority
   * @param {string} params.assignedTo - Filter by assigned user
   * @param {string} params.search - Search term for task title
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 50)
   * @returns {Promise<Object>} - Paginated tasks list
   */
  static async listByProject(projectId, { status, priority, assignedTo, search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT t.*, 
             u.full_name as assigned_to_name,
             u.email as assigned_to_email
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.project_id = $1
    `;
    
    const conditions = [];
    const values = [projectId];
    let index = 2;
    
    if (status) {
      conditions.push(`t.status = $${index}`);
      values.push(status);
      index++;
    }
    
    if (priority) {
      conditions.push(`t.priority = $${index}`);
      values.push(priority);
      index++;
    }
    
    if (assignedTo) {
      conditions.push(`t.assigned_to = $${index}`);
      values.push(assignedTo);
      index++;
    }
    
    if (search) {
      conditions.push(`t.title ILIKE $${index}`);
      values.push(`%${search}%`);
      index++;
    }
    
    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }
    
    query += `
      ORDER BY 
        CASE t.priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        t.due_date ASC,
        t.created_at DESC
      LIMIT $${index} OFFSET $${index + 1}
    `;
    
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM tasks WHERE project_id = $1';
    if (conditions.length > 0) {
      countQuery += ` AND ${conditions.join(' AND ')}`;
    }
    
    const countResult = await pool.query(countQuery, values.slice(0, -2)); // Remove limit and offset
    const totalCount = parseInt(countResult.rows[0].count);
    
    return {
      tasks: result.rows,
      total: totalCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit
      }
    };
  }
  
  /**
   * Update task status
   * @param {string} id - Task ID
   * @param {string} status - New status
   * @returns {Promise<Object|null>} - Updated task or null if not found
   */
  static async updateStatus(id, status) {
    const query = `
      UPDATE tasks
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, id]);
    return result.rows[0] || null;
  }
  
  /**
   * Update task
   * @param {string} id - Task ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} - Updated task or null if not found
   */
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let index = 1;
    
    // Only allow specific fields to be updated
    const allowedFields = ['title', 'description', 'status', 'priority', 'assigned_to', 'due_date'];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        // Handle special case for assigned_to (can be null)
        if (key === 'assigned_to' && value === null) {
          fields.push(`${key} = NULL`);
        } else {
          fields.push(`${key} = $${index}`);
          values.push(value);
          index++;
        }
      }
    }
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    values.push(id); // Add task ID for WHERE clause
    
    const query = `
      UPDATE tasks
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${index}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }
  
  /**
   * Delete task
   * @param {string} id - Task ID
   * @returns {Promise<boolean>} - True if deleted, false if not found
   */
  static async delete(id) {
    const query = 'DELETE FROM tasks WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
}

module.exports = Task;