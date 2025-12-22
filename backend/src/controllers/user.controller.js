const User = require('../models/user.model');
const { hashPassword } = require('../utils/password');
const { logAction } = require('../utils/auditLogger');

/**
 * Add user to tenant
 * POST /api/tenants/:tenantId/users
 */
async function addUser(req, res) {
  try {
    // Only tenant admins can add users
    if (req.role !== 'tenant_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only tenant administrators can add users'
      });
    }
    
    const { email, password, fullName, role = 'user' } = req.body;
    
    // Check if tenant has reached user limit
    const isLimitReached = await User.isUserLimitReached(req.targetTenantId);
    if (isLimitReached) {
      return res.status(403).json({
        success: false,
        message: 'Subscription user limit reached'
      });
    }
    
    // Check if email already exists in this tenant
    const existingUser = await User.findByEmailAndTenant(email, req.targetTenantId);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists in this tenant'
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const user = await User.create({
      tenantId: req.targetTenantId,
      email: email,
      passwordHash: hashedPassword,
      fullName: fullName,
      role: role,
      isActive: true
    });
    
    // Log action
    await logAction({
      tenantId: req.targetTenantId,
      userId: req.userId,
      action: 'CREATE_USER',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.ip
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tenantId: user.tenant_id,
        isActive: user.is_active,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

/**
 * List tenant users
 * GET /api/tenants/:tenantId/users
 */
async function listUsers(req, res) {
  try {
    const { search, role, page, limit } = req.query;
    
    const result = await User.listByTenant(req.targetTenantId, {
      search: search,
      role: role,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list users',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

/**
 * Update user
 * PUT /api/users/:userId
 */
async function updateUser(req, res) {
  try {
    const userId = req.params.userId;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Authorization: users can update themselves, tenant admins can update anyone in their tenant
    if (req.role === 'user' && userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Users can only update their own profile'
      });
    }
    
    // Tenant admins and users can only update users in their own tenant
    if (user.tenant_id !== req.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const updateData = {};
    
    // Users can only update their full name
    if (req.role === 'user') {
      if (req.body.fullName !== undefined) {
        updateData.fullName = req.body.fullName;
      }
    } 
    // Tenant admins can update role and isActive in addition to fullName
    else if (req.role === 'tenant_admin') {
      const allowedFields = ['fullName', 'role', 'isActive'];
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
    }
    
    // Prevent users from updating their own role or isActive
    if (req.role === 'user' && (req.body.role !== undefined || req.body.isActive !== undefined)) {
      return res.status(403).json({
        success: false,
        message: 'Users cannot update their role or active status'
      });
    }
    
    // Prevent users from changing their role to tenant_admin
    if (req.role === 'user' && req.body.role === 'tenant_admin') {
      return res.status(403).json({
        success: false,
        message: 'Users cannot promote themselves to tenant administrator'
      });
    }
    
    // Prevent tenant admins from updating super admins
    if (user.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot update super administrator'
      });
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    // Hash password if provided
    if (req.body.password) {
      updateData.passwordHash = await hashPassword(req.body.password);
    }
    
    // Update user
    const updatedUser = await User.update(userId, updateData);
    
    // Log action
    await logAction({
      tenantId: req.tenantId,
      userId: req.userId,
      action: 'UPDATE_USER',
      entityType: 'user',
      entityId: userId,
      ipAddress: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updatedUser.id,
        fullName: updatedUser.full_name,
        role: updatedUser.role,
        updatedAt: updatedUser.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

/**
 * Delete user
 * DELETE /api/users/:userId
 */
async function deleteUser(req, res) {
  try {
    // Only tenant admins can delete users
    if (req.role !== 'tenant_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only tenant administrators can delete users'
      });
    }
    
    const userId = req.params.userId;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent users from deleting themselves
    if (userId === req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete yourself'
      });
    }
    
    // Tenant admins can only delete users in their own tenant
    if (user.tenant_id !== req.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Prevent tenant admins from deleting super admins
    if (user.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super administrator'
      });
    }
    
    // Delete user
    const deleted = await User.delete(userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Log action
    await logAction({
      tenantId: req.tenantId,
      userId: req.userId,
      action: 'DELETE_USER',
      entityType: 'user',
      entityId: userId,
      ipAddress: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

module.exports = {
  addUser,
  listUsers,
  updateUser,
  deleteUser
};