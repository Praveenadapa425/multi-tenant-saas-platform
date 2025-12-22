const Project = require('../models/project.model');
const { logAction } = require('../utils/auditLogger');

/**
 * Create project
 * POST /api/projects
 */
async function createProject(req, res) {
  try {
    const { name, description, status = 'active' } = req.body;
    
    // Check if tenant has reached project limit
    const isLimitReached = await Project.isProjectLimitReached(req.tenantId);
    if (isLimitReached) {
      return res.status(403).json({
        success: false,
        message: 'Subscription project limit reached'
      });
    }
    
    // Create project
    const project = await Project.create({
      tenantId: req.tenantId,
      name: name,
      description: description,
      status: status,
      createdBy: req.userId
    });
    
    // Log action
    await logAction({
      tenantId: req.tenantId,
      userId: req.userId,
      action: 'CREATE_PROJECT',
      entityType: 'project',
      entityId: project.id,
      ipAddress: req.ip
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: project.id,
        tenantId: project.tenant_id,
        name: project.name,
        description: project.description,
        status: project.status,
        createdBy: project.created_by,
        createdAt: project.created_at
      }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

/**
 * List projects
 * GET /api/projects
 */
async function listProjects(req, res) {
  try {
    const { status, search, page, limit } = req.query;
    
    const result = await Project.listByTenant(req.tenantId, {
      status: status,
      search: search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list projects',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

/**
 * Get project details
 * GET /api/projects/:projectId
 */
async function getProject(req, res) {
  try {
    const projectId = req.params.projectId;
    
    // Find project by ID and tenant ID
    const project = await Project.findByIdAndTenant(projectId, req.tenantId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

/**
 * Update project
 * PUT /api/projects/:projectId
 */
async function updateProject(req, res) {
  try {
    const projectId = req.params.projectId;
    
    // Find project by ID and tenant ID
    const project = await Project.findByIdAndTenant(projectId, req.tenantId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }
    
    // Authorization: tenant admins and project creators can update
    if (req.role !== 'tenant_admin' && project.created_by !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only tenant administrators or project creators can update this project'
      });
    }
    
    const updateData = {};
    const allowedFields = ['name', 'description', 'status'];
    
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
    
    // Update project
    const updatedProject = await Project.update(projectId, updateData);
    
    // Log action
    await logAction({
      tenantId: req.tenantId,
      userId: req.userId,
      action: 'UPDATE_PROJECT',
      entityType: 'project',
      entityId: projectId,
      ipAddress: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        id: updatedProject.id,
        name: updatedProject.name,
        description: updatedProject.description,
        status: updatedProject.status,
        updatedAt: updatedProject.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

/**
 * Delete project
 * DELETE /api/projects/:projectId
 */
async function deleteProject(req, res) {
  try {
    const projectId = req.params.projectId;
    
    // Find project by ID and tenant ID
    const project = await Project.findByIdAndTenant(projectId, req.tenantId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }
    
    // Authorization: tenant admins and project creators can delete
    if (req.role !== 'tenant_admin' && project.created_by !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only tenant administrators or project creators can delete this project'
      });
    }
    
    // Delete project
    const deleted = await Project.delete(projectId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Log action
    await logAction({
      tenantId: req.tenantId,
      userId: req.userId,
      action: 'DELETE_PROJECT',
      entityType: 'project',
      entityId: projectId,
      ipAddress: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject
};