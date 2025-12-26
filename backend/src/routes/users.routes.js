const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { createUserValidation } = require('../middleware/validation.middleware');

// Add User to Tenant
// POST /api/users
router.post('/', authenticate, authorize('tenant_admin'), createUserValidation, userController.addUser);

// List Tenant Users
// GET /api/tenants/:tenantId/users
router.get('/tenants/:tenantId', authenticate, userController.listUsersInTenant);

// List Current User's Tenant Users
// GET /api/users
router.get('/', authenticate, userController.listUsers);

// Update User
// PUT /api/users/:userId
router.put('/:userId', authenticate, userController.updateUser);

// Delete User
// DELETE /api/users/:userId
router.delete('/:userId', authenticate, authorize('tenant_admin'), userController.deleteUser);

module.exports = router;