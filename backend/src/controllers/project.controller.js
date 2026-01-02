const { pool } = require('../config/database');
const { logAction } = require('../utils/auditLogger');
const { sanitizeString, sanitizeObject } = require('../utils/sanitize');
const logger = require('../utils/logger');

/**
 * Create a new project
 * POST /api/projects
 */
async function createProject(req, res) {
  const { name, description, status = 'active' } = req.body;

  try {
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }

    // Check if project limit has been reached
    const tenantResult = await pool.query(
      'SELECT max_projects FROM tenants WHERE id = $1',
      [req.user.tenantId]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const maxProjects = tenantResult.rows[0].max_projects;
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1',
      [req.user.tenantId]
    );
    
    if (parseInt(countResult.rows[0].count) >= maxProjects) {
      return res.status(409).json({
        success: false,
        message: 'Project limit reached for this tenant'
      });
    }

    // Create project
    const result = await pool.query(
      'INSERT INTO projects (tenant_id, name, description, status, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.tenantId, name.trim(), description ? description.trim() : null, status || 'active', req.user.id]
    );

    const newProject = result.rows[0];

    // Log action
    await logAction({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'CREATE_PROJECT',
      entityType: 'project',
      entityId: newProject.id,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: newProject
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project'
    });
  }
}

/**
 * List projects
 * GET /api/projects
 */
async function listProjects(req, res) {
  const { page = 1, limit = 20, status, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let query = `SELECT p.*, 
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id ${req.user.role === 'super_admin' ? '' : 'AND tenant_id = $1'}) as task_count
      FROM projects p`;
    let countQuery = 'SELECT COUNT(*) as count FROM projects';
    let whereClause = req.user.role === 'super_admin' ? '' : ' WHERE tenant_id = $1';
    query += whereClause;
    countQuery += whereClause;
    
    const params = req.user.role === 'super_admin' ? [] : [req.user.tenantId];
    const countParams = req.user.role === 'super_admin' ? [] : [req.user.tenantId];

    if (status) {
      const paramIndex = params.length + 1;
      query += (whereClause ? ' AND' : ' WHERE') + ` p.status = $${paramIndex}`;
      countQuery += (whereClause ? ' AND' : ' WHERE') + ` status = $${paramIndex}`;
      params.push(status);
      countParams.push(status);
      whereClause = ' WHERE'; // Update for potential search condition
    }

    if (search) {
      const paramIndex = params.length + 1;
      query += (whereClause ? ' AND' : ' WHERE') + ` (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      countQuery += (whereClause ? ' AND' : ' WHERE') + ` (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += ' ORDER BY p.created_at DESC';
    if (limit !== 'all') {
      const limitParamIndex = params.length + 1;
      const offsetParamIndex = params.length + 2;
      query += ` LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`;
      params.push(parseInt(limit), offset);
    }

    const [projectsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = limit !== 'all' ? Math.ceil(totalCount / parseInt(limit)) : 1;

    res.status(200).json({
      success: true,
      data: projectsResult.rows,
      pagination: limit !== 'all' ? {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: totalPages
      } : undefined
    });
  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list projects'
    });
  }
}

/**
 * Get project details
 * GET /api/projects/:projectId
 */
async function getProject(req, res) {
  const { projectId } = req.params;

  try {
    // Get project details
    let projectResult;
    if (req.user.role === 'super_admin') {
      projectResult = await pool.query(
        'SELECT * FROM projects WHERE id = $1',
        [projectId]
      );
    } else {
      projectResult = await pool.query(
        'SELECT * FROM projects WHERE id = $1 AND tenant_id = $2',
        [projectId, req.user.tenantId]
      );
    }

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projectResult.rows[0];

    // Get task statistics
    let statsQuery;
    if (req.user.role === 'super_admin') {
      statsQuery = `
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_count,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
        FROM tasks
        WHERE project_id = $1
      `;
    } else {
      statsQuery = `
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_count,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
        FROM tasks
        WHERE project_id = $1 AND tenant_id = $2
      `;
    }
    
    const statsResult = await pool.query(statsQuery, req.user.role === 'super_admin' ? [projectId] : [projectId, req.user.tenantId]);

    res.status(200).json({
      success: true,
      data: {
        ...project,
        taskStats: statsResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project'
    });
  }
}

/**
 * Update project
 * PUT /api/projects/:projectId
 */
async function updateProject(req, res) {
  const { projectId } = req.params;
  const { name, description, status } = req.body;

  try {
    // Check if project exists and belongs to user's tenant
    let projectResult;
    if (req.user.role === 'super_admin') {
      projectResult = await pool.query(
        'SELECT * FROM projects WHERE id = $1',
        [projectId]
      );
    } else {
      projectResult = await pool.query(
        'SELECT * FROM projects WHERE id = $1 AND tenant_id = $2',
        [projectId, req.user.tenantId]
      );
    }

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projectResult.rows[0];

    // Authorization: Only tenant_admin or project creator can update
    if (req.user.role !== 'tenant_admin' && project.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build update query
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name !== undefined && name.trim() !== '') {
      updates.push(`name = $${paramCount}`);
      params.push(name.trim());
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description ? description.trim() : null);
      paramCount++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push(`updated_at = NOW()`);
    params.push(projectId);
    
    // For super admins, update without tenant restriction; for others, update with tenant restriction
    if (req.user.role === 'super_admin') {
      params.push(project.tenant_id); // Use the project's actual tenant_id for the update
      const query = `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1} RETURNING *`;
      const result = await pool.query(query, params);
      const updatedProject = result.rows[0];
      
      // Log action
      await logAction({
        tenantId: project.tenant_id, // Use the project's actual tenant_id
        userId: req.user.id,
        action: 'UPDATE_PROJECT',
        entityType: 'project',
        entityId: projectId,
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: updatedProject
      });
    } else {
      params.push(req.user.tenantId);
      const query = `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1} RETURNING *`;
      const result = await pool.query(query, params);
      const updatedProject = result.rows[0];
      
      // Log action
      await logAction({
        tenantId: req.user.tenantId,
        userId: req.user.id,
        action: 'UPDATE_PROJECT',
        entityType: 'project',
        entityId: projectId,
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: updatedProject
      });
    }
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project'
    });
  }
}

/**
 * Delete project
 * DELETE /api/projects/:projectId
 */
async function deleteProject(req, res) {
  const { projectId } = req.params;

  try {
    let projectResult;
    let project;

    // Super admins can delete projects across any tenant
    if (req.user.role === 'super_admin') {
      projectResult = await pool.query(
        'SELECT * FROM projects WHERE id = $1',
        [projectId]
      );
    } else {
      // Regular users can only delete projects in their own tenant
      projectResult = await pool.query(
        'SELECT * FROM projects WHERE id = $1 AND tenant_id = $2',
        [projectId, req.user.tenantId]
      );
    }

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project = projectResult.rows[0];

    // Authorization: Only tenant_admin, super_admin, or project creator can delete
    if (req.user.role !== 'super_admin' && req.user.role !== 'tenant_admin' && project.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Use a transaction to ensure data consistency
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete all tasks in the project first
      await client.query('DELETE FROM tasks WHERE project_id = $1', [projectId]);

      // Delete project - super admins can delete from any tenant, others only from their tenant
      let deleteResult;
      if (req.user.role === 'super_admin') {
        deleteResult = await client.query(
          'DELETE FROM projects WHERE id = $1 RETURNING id',
          [projectId]
        );
      } else {
        deleteResult = await client.query(
          'DELETE FROM projects WHERE id = $1 AND tenant_id = $2 RETURNING id',
          [projectId, req.user.tenantId]
        );
      }
      
      // Log action
      await logAction({
        tenantId: req.user.role === 'super_admin' ? project.tenant_id : req.user.tenantId,
        userId: req.user.id,
        action: 'DELETE_PROJECT',
        entityType: 'project',
        entityId: projectId,
        ipAddress: req.ip
      }, client);
      
      await client.query('COMMIT');
    } catch (transactionError) {
      await client.query('ROLLBACK');
      logger.error('Error in delete project transaction', transactionError);
      throw transactionError;
    } finally {
      client.release();
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
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