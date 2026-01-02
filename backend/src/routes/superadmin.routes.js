const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superadmin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// System Statistics
// GET /api/superadmin/stats
router.get('/stats', authenticate, authorize('super_admin'), superAdminController.getSystemStats);

// All Tenants Management
// GET /api/superadmin/tenants
router.get('/tenants', authenticate, authorize('super_admin'), superAdminController.getAllTenants);

// Update Tenant Status
// PUT /api/superadmin/tenants/:tenantId/status
router.put('/tenants/:tenantId/status', authenticate, authorize('super_admin'), superAdminController.updateTenantStatus);

// All Users Management
// GET /api/superadmin/users
router.get('/users', authenticate, authorize('super_admin'), superAdminController.getAllUsers);

// All Projects Management
// GET /api/superadmin/projects
router.get('/projects', authenticate, authorize('super_admin'), superAdminController.getAllProjects);

// All Tasks Management
// GET /api/superadmin/tasks
router.get('/tasks', authenticate, authorize('super_admin'), superAdminController.getAllTasks);

module.exports = router;