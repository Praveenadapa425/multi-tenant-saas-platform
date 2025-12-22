const Tenant = require('../models/tenant.model');
const { logAction } = require('../utils/auditLogger');

/**
 * Get tenant details
 * GET /api/tenants/:tenantId
 */
async function getTenant(req, res) {
  try {
    let tenant;
    
    // Super admins can access any tenant, regular users can only access their own
    if (req.role === 'super_admin') {
      tenant = await Tenant.findById(req.params.tenantId);
    } else {
      // Regular users can only access their own tenant
      if (req.params.tenantId !== req.tenantId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      tenant = await Tenant.findById(req.tenantId);
    }
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }
    
    // Get tenant statistics
    const stats = await Tenant.getStats(tenant.id);
    
    res.status(200).json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        subscriptionPlan: tenant.subscription_plan,
        maxUsers: tenant.max_users,
        maxProjects: tenant.max_projects,
        createdAt: tenant.created_at,
        stats: stats
      }
    });
  } catch (error) {
    console.error('Error getting tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant information',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

/**
 * Update tenant
 * PUT /api/tenants/:tenantId
 */
async function updateTenant(req, res) {
  try {
    // Check if tenant exists
    const tenant = await Tenant.findById(req.params.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }
    
    // Authorization checks
    if (req.role === 'tenant_admin') {
      // Tenant admins can only update the name
      const allowedFields = ['name'];
      const updateData = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      
      // Check if any restricted fields are being updated
      const restrictedFields = ['status', 'subscription_plan', 'max_users', 'max_projects'];
      for (const field of restrictedFields) {
        if (req.body[field] !== undefined) {
          return res.status(403).json({
            success: false,
            message: `Cannot update ${field}. Only super admins can update this field.`
          });
        }
      }
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }
      
      // Update tenant
      const updatedTenant = await Tenant.update(req.params.tenantId, updateData);
      
      // Log action
      await logAction({
        tenantId: req.tenantId,
        userId: req.userId,
        action: 'UPDATE_TENANT',
        entityType: 'tenant',
        entityId: req.params.tenantId,
        ipAddress: req.ip
      });
      
      res.status(200).json({
        success: true,
        message: 'Tenant updated successfully',
        data: {
          id: updatedTenant.id,
          name: updatedTenant.name,
          updatedAt: updatedTenant.updated_at
        }
      });
    } else if (req.role === 'super_admin') {
      // Super admins can update all fields
      const updateData = {};
      const allowedFields = ['name', 'status', 'subscription_plan', 'max_users', 'max_projects'];
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }
      
      // Update tenant
      const updatedTenant = await Tenant.update(req.params.tenantId, updateData);
      
      // Log action
      await logAction({
        tenantId: req.tenantId,
        userId: req.userId,
        action: 'UPDATE_TENANT',
        entityType: 'tenant',
        entityId: req.params.tenantId,
        ipAddress: req.ip
      });
      
      res.status(200).json({
        success: true,
        message: 'Tenant updated successfully',
        data: {
          id: updatedTenant.id,
          name: updatedTenant.name,
          updatedAt: updatedTenant.updated_at
        }
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

/**
 * List all tenants (super admin only)
 * GET /api/tenants
 */
async function listTenants(req, res) {
  try {
    if (req.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can list all tenants'
      });
    }
    
    const { page, limit, status, subscriptionPlan } = req.query;
    
    const result = await Tenant.listAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status: status,
      subscriptionPlan: subscriptionPlan
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error listing tenants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list tenants',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

module.exports = {
  getTenant,
  updateTenant,
  listTenants
};