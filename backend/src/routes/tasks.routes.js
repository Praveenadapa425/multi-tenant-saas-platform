const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { createTaskValidation } = require('../middleware/validation.middleware');

// Create Task
// POST /api/projects/:projectId/tasks
router.post('/projects/:projectId/tasks', authenticate, createTaskValidation, taskController.createTask);

// List Project Tasks
// GET /api/projects/:projectId/tasks
router.get('/projects/:projectId/tasks', authenticate, taskController.listTasks);

// Update Task Status
// PATCH /api/tasks/:taskId/status
router.patch('/tasks/:taskId/status', authenticate, taskController.updateTaskStatus);

// Update Task
// PUT /api/tasks/:taskId
router.put('/tasks/:taskId', authenticate, taskController.updateTask);

// Delete Task
// DELETE /api/tasks/:taskId
router.delete('/tasks/:taskId', authenticate, taskController.deleteTask);

module.exports = router;