const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { createProjectValidation, createTaskValidation } = require('../middleware/validation.middleware');

// Create Project
// POST /api/projects
router.post('/', authenticate, createProjectValidation, projectController.createProject);

// List Projects
// GET /api/projects
router.get('/', authenticate, projectController.listProjects);

// Get Project Details
// GET /api/projects/:projectId
router.get('/:projectId', authenticate, projectController.getProject);

// Update Project
// PUT /api/projects/:projectId
router.put('/:projectId', authenticate, projectController.updateProject);

// Delete Project
// DELETE /api/projects/:projectId
router.delete('/:projectId', authenticate, projectController.deleteProject);

// Create Task for Project
// POST /api/projects/:projectId/tasks
router.post('/:projectId/tasks', authenticate, createTaskValidation, taskController.createTask);

// List Tasks for Project
// GET /api/projects/:projectId/tasks
router.get('/:projectId/tasks', authenticate, taskController.listTasks);

module.exports = router;