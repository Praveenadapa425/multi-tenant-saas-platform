const { pool } = require('../config/database');
const { hashPassword } = require('../utils/password');
const { sanitizeString, sanitizeObject } = require('../utils/sanitize');
const logger = require('../utils/logger');

// Helper function to generate a temporary password
function generateTemporaryPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  
  // Generate 8 random characters
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Ensure it meets complexity requirements: at least one uppercase, one lowercase, one number, one special character
  password += 'Aa1!'; // Add required character types
  
  return password;
}

// API 8: Add User to Tenant
exports.addUser = async (req, res) => {
  try {
    const { email, password, fullName, role = 'user' } = req.body;
    const tenantId = req.user.tenantId;
    
    // If no password is provided, generate a temporary one
    let hashedPassword;
    if (password) {
      hashedPassword = await hashPassword(password);
    } else {
      // Generate a temporary password for invited users
      const tempPassword = generateTemporaryPassword();
      hashedPassword = await hashPassword(tempPassword);
    }
    
    // Authorization check
    if (req.user.role !== 'tenant_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only tenant admins and super admins can add users'
      });
    }
    
    // No need to check tenantId since it's from the authenticated user
    
    // Check tenant limits
    const tenantResult = await pool.query(
      'SELECT max_users FROM tenants WHERE id = $1',
      [tenantId]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }
    
    const maxUsers = tenantResult.rows[0].max_users;
    
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1',
      [tenantId]
    );
    
    if (parseInt(countResult.rows[0].count) >= maxUsers) {
      return res.status(403).json({
        success: false,
        message: 'Subscription limit reached'
      });
    }
    
    // Check if email exists in this tenant
    const emailResult = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    );
    
    if (emailResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists in this tenant'
      });
    }
    
    // Password is already hashed above
    
    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, email, full_name, role, is_active, created_at`,
      [tenantId, email, hashedPassword, fullName, role]
    );
    
    const newUser = userResult.rows[0];
    
    // Log action
    await pool.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tenantId, req.user.id, 'CREATE_USER', 'user', newUser.id, req.ip]
    );
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        tenantId: tenantId,
        isActive: newUser.is_active,
        createdAt: newUser.created_at
      }
    });
  } catch (error) {
    console.error('Add user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
};

// API 9: List Current User's Tenant Users
exports.listUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;
    
    let query = 'SELECT id, email, full_name, role, is_active, created_at FROM users';
    let whereClause = req.user.role === 'super_admin' ? '' : ' WHERE tenant_id = $1';
    query += whereClause;
    const values = req.user.role === 'super_admin' ? [] : [req.user.tenantId];
    let paramCount = req.user.role === 'super_admin' ? 1 : 2;
    
    if (search) {
      query += (whereClause ? ' AND' : ' WHERE') + ` (email ILIKE $${paramCount} OR full_name ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
      whereClause = ' WHERE'; // Update for potential other conditions
    }
    
    if (role) {
      query += (whereClause ? ' AND' : ' WHERE') + ` role = $${paramCount}`;
      values.push(role);
      paramCount++;
      whereClause = ' WHERE'; // Update for potential other conditions
    }
    
    // Get total count
    const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await pool.query(countQuery, values.slice(0, paramCount - 1));
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated results
    const offset = (page - 1) * limit;
    query += ` ORDER BY created_at DESC`;
    if (limit !== 'all') {
      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      values.push(limit, offset);
    }
    
    const result = await pool.query(query, values);
    
    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at
    }));
    
    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        pagination: limit !== 'all' ? {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          limit: parseInt(limit)
        } : undefined
      }
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// API 9: List Users in Specific Tenant
exports.listUsersInTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { search, role, page = 1, limit = 50 } = req.query;
    
    // Authorization - user must be super_admin or belong to the requested tenant
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    let query = 'SELECT id, email, full_name, role, is_active, created_at FROM users WHERE tenant_id = $1';
    const values = [tenantId];
    let paramCount = 2;
    
    if (search) {
      query += ` AND (email ILIKE $${paramCount} OR full_name ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }
    
    if (role) {
      query += ` AND role = $${paramCount}`;
      values.push(role);
      paramCount++;
    }
    
    // Get total count
    const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await pool.query(countQuery, values.slice(0, paramCount - 1));
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated results
    const offset = (page - 1) * limit;
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at
    }));
    
    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('List users in tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// API 10: Update User
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, role, isActive } = req.body;
    
    // Get user to check tenant
    const userResult = await pool.query(
      'SELECT tenant_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const userTenantId = userResult.rows[0].tenant_id;
    
    // Authorization
    if (req.user.role !== 'tenant_admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (req.user.role === 'tenant_admin' && req.user.tenantId !== userTenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    let query = 'UPDATE users SET ';
    const values = [];
    const updates = [];
    let paramCount = 1;
    
    if (fullName) {
      updates.push(`full_name = $${paramCount}`);
      values.push(fullName);
      paramCount++;
    }
    
    if (role && req.user.role === 'tenant_admin') {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }
    
    if (isActive !== undefined && req.user.role === 'tenant_admin') {
      updates.push(`is_active = $${paramCount}`);
      values.push(isActive);
      paramCount++;
    }
    
    updates.push(`updated_at = NOW()`);
    query += updates.join(', ') + ` WHERE id = $${paramCount}`;
    values.push(userId);
    
    const updateResult = await pool.query(query, values);
    
    if (updateResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Log action
    await pool.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userTenantId, req.user.id, 'UPDATE_USER', 'user', userId, req.ip]
    );
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: userId,
        fullName,
        role,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

// API 11: Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user
    const userResult = await pool.query(
      'SELECT tenant_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const userTenantId = userResult.rows[0].tenant_id;
    
    // Authorization
    if (req.user.role !== 'tenant_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only tenant admins and super admins can delete users'
      });
    }
    
    // Super admins can delete users from any tenant, tenant admins can only delete from their own tenant
    if (req.user.role === 'tenant_admin' && req.user.tenantId !== userTenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Cannot delete self
    if (req.user.id === userId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete yourself'
      });
    }
    
    // Use a transaction to ensure data consistency
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Unassign tasks first
      await client.query(
        'UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1',
        [userId]
      );
      
      // Handle projects created by this user - set to NULL (allowed by DB constraint)
      await client.query(
        'UPDATE projects SET created_by = NULL WHERE created_by = $1',
        [userId]
      );
      
      // Delete user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      
      // Log action
      await logAction({
        tenantId: userTenantId,
        userId: req.user.id,
        action: 'DELETE_USER',
        entityType: 'user',
        entityId: userId,
        ipAddress: req.ip
      }, client);
      
      await client.query('COMMIT');
    } catch (transactionError) {
      await client.query('ROLLBACK');
      logger.error('Error in delete user transaction', transactionError);
      throw transactionError;
    } finally {
      client.release();
    }
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};