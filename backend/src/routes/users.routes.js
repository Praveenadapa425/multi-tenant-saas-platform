const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize, tenantIsolation } = require('../middleware/auth.middleware');
const { createUserValidation } = require('../middleware/validation.middleware');

// Add User to Tenant
// POST /api/tenants/:tenantId/users
router.post('/tenants/:tenantId/users', authenticate, tenantIsolation, authorize('tenant_admin'), createUserValidation, userController.addUser);

// List Tenant Users
// GET /api/tenants/:tenantId/users
router.get('/tenants/:tenantId/users', authenticate, tenantIsolation, userController.listUsers);

// Update User
// PUT /api/users/:userId
router.put('/users/:userId', authenticate, userController.updateUser);

// Delete User
// DELETE /api/users/:userId
router.delete('/users/:userId', authenticate, authorize('tenant_admin'), userController.deleteUser);

module.exports = router;