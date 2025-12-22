const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { tenantRegistrationValidation, userLoginValidation } = require('../middleware/validation.middleware');

// Tenant Registration
// POST /api/auth/register-tenant
router.post('/register-tenant', tenantRegistrationValidation, authController.registerTenant);

// User Login
// POST /api/auth/login
router.post('/login', userLoginValidation, authController.login);

// Get Current User (requires authentication)
// GET /api/auth/me
router.get('/me', authController.getCurrentUser);

// User Logout (requires authentication)
// POST /api/auth/logout
router.post('/logout', authController.logout);

module.exports = router;