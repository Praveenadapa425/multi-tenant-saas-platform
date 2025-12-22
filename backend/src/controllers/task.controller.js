const Task = require('../models/task.model');
const Project = require('../models/project.model');
const User = require('../models/user.model');
const { logAction } = require('../utils/auditLogger');

/**
 * Create task
 * POST /api/projects/:projectId/tasks
 */
async function createTask(req, res) {
  try {
    const projectId = req.params.projectId;
    
    // Verify project exists and belongs to user's tenant
    const project = await Project.findByIdAndTenant(projectId, req.tenantId);
    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }
    
    const { title, description, assignedTo, priority = 'medium', dueDate } = req.body;
    
    // If assignedTo is provided, verify user belongs to same tenant
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser || assignedUser.tenant_id !== req.tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user does not belong to this tenant'
        });
      }
    }
    
    // Create task with tenant_id from project (not from JWT for data integrity)
    const task = await Task.create({
      projectId: projectId,
      tenantId: project.tenant_id,
      title: title,
      description: description,
      priority: priority,
      assignedTo: assignedTo,
      dueDate: dueDate
    });
    
    // Log action
    await logAction({
      tenantId: req.tenantId,
      userId: req.userId,
      action: 'CREATE_TASK',
      entityType: 'task',
      entityId: task.id,
      ipAddress: req.ip
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: task.id,
        projectId: task.project_id,
        tenantId: task.tenant_id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assigned_to,
        dueDate: task.due_date,
        createdAt: task.created_at
      }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

/**
 * List project tasks
 * GET /api/projects/:projectId/tasks
 */
async function listTasks(req, res) {
  try {
    const projectId = req.params.projectId;
    
    // Verify project exists and belongs to user's tenant
    const project = await Project.findByIdAndTenant(projectId, req.tenantId);
    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }
    
    const { status, assignedTo, priority, search, page, limit } = req.query;
    
    const result = await Task.listByProject(projectId, {
      status: status,
      assignedTo: assignedTo,
      priority: priority,
      search: search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error listing tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

/**
 * Update task status
 * PATCH /api/tasks/:taskId/status
 */
async function updateTaskStatus(req, res) {
  try {
    const taskId = req.params.taskId;
    const { status } = req.body;
    
    // Validate status
    if (!['todo', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be todo, in_progress, or completed'
      });
    }
    
    // Find task by ID and tenant ID
    const task = await Task.findByIdAndTenant(taskId, req.tenantId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied'
      });
    }
    
    // Update task status
    const updatedTask = await Task.updateStatus(taskId, status);
    
    // Log action
    await logAction({
      tenantId: req.tenantId,
      userId: req.userId,
      action: 'UPDATE_TASK_STATUS',
      entityType: 'task',
      entityId: taskId,
      ipAddress: req.ip
    });
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedTask.id,
        status: updatedTask.status,
        updatedAt: updatedTask.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

/**
 * Update task
 * PUT /api/tasks/:taskId
 */
async function updateTask(req, res) {
  try {
    const taskId = req.params.taskId;
    
    // Find task by ID and tenant ID
    const task = await Task.findByIdAndTenant(taskId, req.tenantId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied'
      });
    }
    
    const updateData = {};
    const allowedFields = ['title', 'description', 'status', 'priority', 'assigned_to', 'due_date'];
    
    // Process each field
    for (const field of allowedFields) {
      const camelCaseField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (req.body[camelCaseField] !== undefined) {
        // Handle special case for assigned_to (can be null to unassign)
        if (field === 'assigned_to' && req.body[camelCaseField] === null) {
          updateData[field] = null;
        } else {
          updateData[field] = req.body[camelCaseField];
        }
      }
    }
    
    // If assigned_to is provided, verify user belongs to same tenant
    if (updateData.assigned_to) {
      const assignedUser = await User.findById(updateData.assigned_to);
      if (!assignedUser || assignedUser.tenant_id !== req.tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user does not belong to this tenant'
        });
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    // Update task
    const updatedTask = await Task.update(taskId, updateData);
    
    // Log action
    await logAction({
      tenantId: req.tenantId,
      userId: req.userId,
      action: 'UPDATE_TASK',
      entityType: 'task',
      entityId: taskId,
      ipAddress: req.ip
    });
    
    // Get assigned user details if task has an assignee
    let assignedToDetails = null;
    if (updatedTask.assigned_to) {
      const assignedUser = await User.findById(updatedTask.assigned_to);
      if (assignedUser) {
        assignedToDetails = {
          id: assignedUser.id,
          fullName: assignedUser.full_name,
          email: assignedUser.email
        };
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        assignedTo: assignedToDetails,
        dueDate: updatedTask.due_date,
        updatedAt: updatedTask.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

/**
 * Delete task
 * DELETE /api/tasks/:taskId
 */
async function deleteTask(req, res) {
  try {
    const taskId = req.params.taskId;
    
    // Find task by ID and tenant ID
    const task = await Task.findByIdAndTenant(taskId, req.tenantId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied'
      });
    }
    
    // Delete task
    const deleted = await Task.delete(taskId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Log action
    await logAction({
      tenantId: req.tenantId,
      userId: req.userId,
      action: 'DELETE_TASK',
      entityType: 'task',
      entityId: taskId,
      ipAddress: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}

module.exports = {
  createTask,
  listTasks,
  updateTaskStatus,
  updateTask,
  deleteTask
};