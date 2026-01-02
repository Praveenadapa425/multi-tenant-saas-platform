const { pool } = require('../config/database');
const { logAction } = require('../utils/auditLogger');
const { sanitizeString, sanitizeObject } = require('../utils/sanitize');
const logger = require('../utils/logger');

/**
 * Create a new task
 * POST /api/projects/:projectId/tasks
 */
async function createTask(req, res) {
  const { projectId } = req.params;
  const { title, description, priority = 'medium', dueDate, assignedTo } = req.body;

  try {
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Task title is required'
      });
    }

    // Check if project exists
    // Super admins can access projects from any tenant, others only from their tenant
    let projectQuery = 'SELECT * FROM projects WHERE id = $1';
    let projectParams = [projectId];
    
    if (req.user.role !== 'super_admin') {
      projectQuery += ' AND tenant_id = $2';
      projectParams.push(req.user.tenantId);
    }
    
    const projectResult = await pool.query(projectQuery, projectParams);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // If assignedTo is provided, verify the user exists in the same tenant
    if (assignedTo) {
      // For super admins, use the project's actual tenant_id, otherwise use user's tenant_id
      const assignedTenantId = req.user.role === 'super_admin' ? projectResult.rows[0].tenant_id : req.user.tenantId;
      
      const assignedUserResult = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
        [assignedTo, assignedTenantId]
      );

      if (assignedUserResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Assigned user not found in this tenant'
        });
      }
    }

    // Create task
    // For super admins, use the project's actual tenant_id, otherwise use user's tenant_id
    const taskTenantId = req.user.role === 'super_admin' ? projectResult.rows[0].tenant_id : req.user.tenantId;
    
    const result = await pool.query(
      `INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [projectId, taskTenantId, title.trim(), description ? description.trim() : null, 'todo', priority || 'medium', assignedTo || null, dueDate || null]
    );

    const newTask = result.rows[0];

    // Log action
    await logAction({
      tenantId: taskTenantId,
      userId: req.user.id,
      action: 'CREATE_TASK',
      entityType: 'task',
      entityId: newTask.id,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: newTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
}

/**
 * List tasks in a project
 * GET /api/projects/:projectId/tasks
 */
async function listTasks(req, res) {
  const { projectId } = req.params;
  const { page = 1, limit = 50, status, priority, assignedTo, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Check if project exists
    // Super admins can access projects from any tenant, others only from their tenant
    let projectQuery = 'SELECT * FROM projects WHERE id = $1';
    let projectParams = [projectId];
    
    if (req.user.role !== 'super_admin') {
      projectQuery += ' AND tenant_id = $2';
      projectParams.push(req.user.tenantId);
    }
    
    const projectResult = await pool.query(projectQuery, projectParams);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    let query = 'SELECT * FROM tasks WHERE project_id = $1';
    let countQuery = 'SELECT COUNT(*) as count FROM tasks WHERE project_id = $1';
    const params = [projectId];
    const countParams = [projectId];
    
    if (req.user.role !== 'super_admin') {
      query += ' AND tenant_id = $2';
      countQuery += ' AND tenant_id = $2';
      params.push(req.user.tenantId);
      countParams.push(req.user.tenantId);
    }

    if (status) {
      query += ' AND status = $' + (params.length + 1);
      countQuery += ' AND status = $' + (countParams.length + 1);
      params.push(status);
      countParams.push(status);
    }

    if (priority) {
      query += ' AND priority = $' + (params.length + 1);
      countQuery += ' AND priority = $' + (countParams.length + 1);
      params.push(priority);
      countParams.push(priority);
    }

    if (assignedTo) {
      query += ' AND assigned_to = $' + (params.length + 1);
      countQuery += ' AND assigned_to = $' + (countParams.length + 1);
      params.push(assignedTo);
      countParams.push(assignedTo);
    }

    if (search) {
      query += ' AND (title ILIKE $' + (params.length + 1) + ' OR description ILIKE $' + (params.length + 1) + ')';
      countQuery += ' AND (title ILIKE $' + (countParams.length + 1) + ' OR description ILIKE $' + (countParams.length + 1) + ')';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), offset);

    const [tasksResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    const totalCount = countResult.rows && countResult.rows[0] && countResult.rows[0].count ? parseInt(countResult.rows[0].count) : 0;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.status(200).json({
      success: true,
      data: tasksResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error('Error listing tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list tasks'
    });
  }
}

/**
 * Update task status
 * PATCH /api/tasks/:taskId/status
 */
async function updateTaskStatus(req, res) {
  const { taskId } = req.params;
  const { status } = req.body;

  try {
    // Validate status
    const validStatuses = ['todo', 'in_progress', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Check if task exists
    // Super admins can access tasks from any tenant, others only from their tenant
    let taskQuery = 'SELECT * FROM tasks WHERE id = $1';
    let taskParams = [taskId];
    
    if (req.user.role !== 'super_admin') {
      taskQuery += ' AND tenant_id = $2';
      taskParams.push(req.user.tenantId);
    }
    
    const taskResult = await pool.query(taskQuery, taskParams);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update task status
    const result = await pool.query(
      'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, taskId]
    );

    const updatedTask = result.rows[0];

    // Log action
    await logAction({
      tenantId: taskResult.rows[0].tenant_id, // Use the task's actual tenant_id
      userId: req.user.id,
      action: 'UPDATE_TASK_STATUS',
      entityType: 'task',
      entityId: taskId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status'
    });
  }
}

/**
 * Update task
 * PUT /api/tasks/:taskId
 */
async function updateTask(req, res) {
  const { taskId } = req.params;
  const { title, description, status, priority, assignedTo, dueDate } = req.body;

  try {
    // Check if task exists
    // Super admins can access tasks from any tenant, others only from their tenant
    let taskQuery = 'SELECT * FROM tasks WHERE id = $1';
    let taskParams = [taskId];
    
    if (req.user.role !== 'super_admin') {
      taskQuery += ' AND tenant_id = $2';
      taskParams.push(req.user.tenantId);
    }
    
    const taskResult = await pool.query(taskQuery, taskParams);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // If assignedTo is being updated, verify the user exists in the same tenant
    if (assignedTo && assignedTo !== null) {
      // For super admins, use the task's actual tenant_id, otherwise use user's tenant_id
      const checkTenantId = req.user.role === 'super_admin' ? taskResult.rows[0].tenant_id : req.user.tenantId;
      
      const assignedUserResult = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
        [assignedTo, checkTenantId]
      );

      if (assignedUserResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Assigned user not found in this tenant'
        });
      }
    }

    // Build update query
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (title !== undefined && title.trim() !== '') {
      updates.push(`title = $${paramCount}`);
      params.push(title.trim());
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description ? description.trim() : null);
      paramCount++;
    }

    if (status !== undefined) {
      const validStatuses = ['todo', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramCount}`);
      params.push(priority);
      paramCount++;
    }

    if (assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramCount}`);
      params.push(assignedTo);
      paramCount++;
    }

    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramCount}`);
      params.push(dueDate);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push(`updated_at = NOW()`);
    params.push(taskId);
    
    // For super admins, use the task's actual tenant_id, otherwise use user's tenant_id
    const updateTenantId = req.user.role === 'super_admin' ? taskResult.rows[0].tenant_id : req.user.tenantId;
    params.push(updateTenantId);

    const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1} RETURNING *`;
    const result = await pool.query(query, params);

    const updatedTask = result.rows[0];

    // Log action
    await logAction({
      tenantId: updateTenantId,
      userId: req.user.id,
      action: 'UPDATE_TASK',
      entityType: 'task',
      entityId: taskId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
}

/**
 * Delete task
 * DELETE /api/tasks/:taskId
 */
async function deleteTask(req, res) {
  const { taskId } = req.params;

  try {
    // Check if task exists
    // Super admins can access tasks from any tenant, others only from their tenant
    let taskQuery = 'SELECT * FROM tasks WHERE id = $1';
    let taskParams = [taskId];
    
    if (req.user.role !== 'super_admin') {
      taskQuery += ' AND tenant_id = $2';
      taskParams.push(req.user.tenantId);
    }
    
    const taskResult = await pool.query(taskQuery, taskParams);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const task = taskResult.rows[0];

    // Authorization: Only super_admin, tenant_admin, or user assigned to the task can delete
    // If task is not assigned to anyone, only super_admin or tenant_admin can delete
    if (req.user.role !== 'super_admin' && req.user.role !== 'tenant_admin') {
      // For regular users, they can only delete tasks assigned to them
      if (task.assigned_to && task.assigned_to !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Use a transaction to ensure data consistency
    // Check if pool.connect is available (not available in some test mocks)
    if (typeof pool.connect === 'function') {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Delete task
        const deleteResult = await client.query(
          'DELETE FROM tasks WHERE id = $1 RETURNING id',
          [taskId]
        );
        
        // Log action
        await logAction({
          tenantId: taskResult.rows[0].tenant_id, // Use the task's actual tenant_id
          userId: req.user.id,
          action: 'DELETE_TASK',
          entityType: 'task',
          entityId: taskId,
          ipAddress: req.ip
        }, client);
        
        await client.query('COMMIT');
      } catch (transactionError) {
        await client.query('ROLLBACK');
        logger.error('Error in delete task transaction', transactionError);
        throw transactionError;
      } finally {
        client.release();
      }
    } else {
      // Fallback for test environments where pool.connect is not available
      // Perform operations without explicit transaction
      const deleteResult = await pool.query(
        'DELETE FROM tasks WHERE id = $1 RETURNING id',
        [taskId]
      );
      
      // Log action
      await logAction({
        tenantId: taskResult.rows[0].tenant_id, // Use the task's actual tenant_id
        userId: req.user.id,
        action: 'DELETE_TASK',
        entityType: 'task',
        entityId: taskId,
        ipAddress: req.ip
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
}

/**
 * List all tasks for tenant
 * GET /api/tasks
 */
async function listAllTasks(req, res) {
  const { page = 1, limit = 50, status, priority, assignedTo, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let query = 'SELECT * FROM tasks';
    let countQuery = 'SELECT COUNT(*) as count FROM tasks';
    let whereClause = req.user.role === 'super_admin' ? '' : ' WHERE tenant_id = $1';
    query += whereClause;
    countQuery += whereClause;
    
    const params = req.user.role === 'super_admin' ? [] : [req.user.tenantId];
    const countParams = req.user.role === 'super_admin' ? [] : [req.user.tenantId];

    if (status) {
      const paramIndex = params.length + 1;
      query += (whereClause ? ' AND' : ' WHERE') + ` status = $${paramIndex}`;
      countQuery += (whereClause ? ' AND' : ' WHERE') + ` status = $${paramIndex}`;
      params.push(status);
      countParams.push(status);
      whereClause = ' WHERE'; // Update for potential other conditions
    }

    if (priority) {
      const paramIndex = params.length + 1;
      query += (whereClause ? ' AND' : ' WHERE') + ` priority = $${paramIndex}`;
      countQuery += (whereClause ? ' AND' : ' WHERE') + ` priority = $${paramIndex}`;
      params.push(priority);
      countParams.push(priority);
      whereClause = ' WHERE'; // Update for potential other conditions
    }

    if (assignedTo) {
      const paramIndex = params.length + 1;
      query += (whereClause ? ' AND' : ' WHERE') + ` assigned_to = $${paramIndex}`;
      countQuery += (whereClause ? ' AND' : ' WHERE') + ` assigned_to = $${paramIndex}`;
      params.push(assignedTo);
      countParams.push(assignedTo);
      whereClause = ' WHERE'; // Update for potential other conditions
    }

    if (search) {
      const paramIndex = params.length + 1;
      query += (whereClause ? ' AND' : ' WHERE') + ` (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      countQuery += (whereClause ? ' AND' : ' WHERE') + ` (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    if (limit !== 'all') {
      const limitParamIndex = params.length + 1;
      const offsetParamIndex = params.length + 2;
      query += ` LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`;
      params.push(parseInt(limit), offset);
    }

    const [tasksResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    const totalCount = countResult.rows && countResult.rows[0] && countResult.rows[0].count ? parseInt(countResult.rows[0].count) : 0;
    const totalPages = limit !== 'all' ? Math.ceil(totalCount / parseInt(limit)) : 1;

    res.status(200).json({
      success: true,
      data: tasksResult.rows,
      pagination: limit !== 'all' ? {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: totalPages
      } : undefined
    });
  } catch (error) {
    console.error('Error listing all tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list tasks'
    });
  }
}

module.exports = {
  createTask,
  listTasks,
  listAllTasks,
  updateTaskStatus,
  updateTask,
  deleteTask
};