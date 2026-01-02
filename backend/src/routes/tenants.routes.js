const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Get Tenant Details
// GET /api/tenants/:tenantId
router.get('/:tenantId', authenticate, tenantController.getTenant);

// Update Tenant
// PUT /api/tenants/:tenantId
router.put('/:tenantId', authenticate, authorize('tenant_admin', 'super_admin'), tenantController.updateTenant);

// List All Tenants (Super Admin Only)
// GET /api/tenants
router.get('/', authenticate, authorize('super_admin'), tenantController.listTenants);

// Delete Tenant (Super Admin Only)
// DELETE /api/tenants/:tenantId
router.delete('/:tenantId', authenticate, authorize('super_admin'), tenantController.deleteTenant);

module.exports = router;