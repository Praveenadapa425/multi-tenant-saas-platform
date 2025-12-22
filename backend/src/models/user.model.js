const { pool } = require('../config/database');

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  static async create(userData) {
    const { tenantId, email, passwordHash, fullName, role = 'user', isActive = true } = userData;
    
    const query = `
      INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, tenant_id, email, full_name, role, is_active, created_at, updated_at
    `;
    
    const values = [tenantId, email, passwordHash, fullName, role, isActive];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} - User or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT id, tenant_id, email, full_name, role, is_active, created_at, updated_at
      FROM users WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Find user by email and tenant ID
   * @param {string} email - User email
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object|null>} - User or null if not found
   */
  static async findByEmailAndTenant(email, tenantId) {
    const query = `
      SELECT id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at
      FROM users WHERE email = $1 AND tenant_id = $2
    `;
    const result = await pool.query(query, [email, tenantId]);
    return result.rows[0] || null;
  }
  
  /**
   * Find user by email across all tenants (for super admin)
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User or null if not found
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at
      FROM users WHERE email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }
  
  /**
   * List users by tenant ID
   * @param {string} tenantId - Tenant ID
   * @param {Object} params - Pagination and filter parameters
   * @param {string} params.search - Search term for name or email
   * @param {string} params.role - Filter by role
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 50)
   * @returns {Promise<Object>} - Paginated users list
   */
  static async listByTenant(tenantId, { search, role, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT id, tenant_id, email, full_name, role, is_active, created_at, updated_at
      FROM users WHERE tenant_id = $1
    `;
    
    const conditions = [];
    const values = [tenantId];
    let index = 2;
    
    if (search) {
      conditions.push(`(full_name ILIKE $${index} OR email ILIKE $${index})`);
      values.push(`%${search}%`);
      index++;
    }
    
    if (role) {
      conditions.push(`role = $${index}`);
      values.push(role);
      index++;
    }
    
    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }
    
    query += `
      ORDER BY created_at DESC
      LIMIT $${index} OFFSET $${index + 1}
    `;
    
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1';
    if (conditions.length > 0) {
      countQuery += ` AND ${conditions.join(' AND ')}`;
    }
    
    const countResult = await pool.query(countQuery, values.slice(0, -2)); // Remove limit and offset
    const totalCount = parseInt(countResult.rows[0].count);
    
    return {
      users: result.rows,
      total: totalCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit
      }
    };
  }
  
  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} - Updated user or null if not found
   */
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let index = 1;
    
    // Only allow specific fields to be updated
    const allowedFields = ['full_name', 'role', 'is_active', 'password_hash'];
    
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
    
    values.push(id); // Add user ID for WHERE clause
    
    const query = `
      UPDATE users
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${index}
      RETURNING id, tenant_id, email, full_name, role, is_active, updated_at
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }
  
  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} - True if deleted, false if not found
   */
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
  
  /**
   * Check if tenant has reached user limit
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<boolean>} - True if limit reached
   */
  static async isUserLimitReached(tenantId) {
    // Get tenant's max users limit
    const tenantQuery = 'SELECT max_users FROM tenants WHERE id = $1';
    const tenantResult = await pool.query(tenantQuery, [tenantId]);
    
    if (tenantResult.rows.length === 0) {
      throw new Error('Tenant not found');
    }
    
    const maxUsers = tenantResult.rows[0].max_users;
    
    // Count current users
    const userQuery = 'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1';
    const userResult = await pool.query(userQuery, [tenantId]);
    const currentUserCount = parseInt(userResult.rows[0].count);
    
    return currentUserCount >= maxUsers;
  }
}

module.exports = User;