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
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND tenant_id = $1) as task_count
      FROM projects p WHERE p.tenant_id = $1`;
    let countQuery = 'SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1';
    const params = [req.user.tenantId];
    const countParams = [req.user.tenantId];

    if (status) {
      query += ' AND p.status = $' + (params.length + 1);
      countQuery += ' AND status = $' + (countParams.length + 1);
      params.push(status);
      countParams.push(status);
    }

    if (search) {
      query += ' AND (p.name ILIKE $' + (params.length + 1) + ' OR p.description ILIKE $' + (params.length + 1) + ')';
      countQuery += ' AND (name ILIKE $' + (countParams.length + 1) + ' OR description ILIKE $' + (countParams.length + 1) + ')';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += ' ORDER BY p.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), offset);

    const [projectsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.status(200).json({
      success: true,
      data: projectsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: totalPages
      }
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
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND tenant_id = $2',
      [projectId, req.user.tenantId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projectResult.rows[0];

    // Get task statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_count,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
      FROM tasks
      WHERE project_id = $1 AND tenant_id = $2
    `, [projectId, req.user.tenantId]);

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
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND tenant_id = $2',
      [projectId, req.user.tenantId]
    );

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
    // Check if project exists and belongs to user's tenant
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND tenant_id = $2',
      [projectId, req.user.tenantId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projectResult.rows[0];

    // Authorization: Only tenant_admin or project creator can delete
    if (req.user.role !== 'tenant_admin' && project.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete all tasks in the project first
    await pool.query('DELETE FROM tasks WHERE project_id = $1', [projectId]);

    // Delete project
    const deleteResult = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING id',
      [projectId]
    );

    // Log action
    await logAction({
      tenantId: req.user.tenantId,
      userId: req.user.id,
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