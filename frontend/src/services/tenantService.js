import api from './api';

const tenantService = {
  /**
   * Get all tenants (Super Admin only)
   * @returns {Promise} - Axios promise
   */
  getAllTenants() {
    return api.get('/tenants');
  },

  /**
   * Get tenant by ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise} - Axios promise
   */
  getTenant(tenantId) {
    return api.get(`/tenants/${tenantId}`);
  },

  /**
   * Update tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} tenantData - Tenant data to update
   * @returns {Promise} - Axios promise
   */
  updateTenant(tenantId, tenantData) {
    return api.put(`/tenants/${tenantId}`, tenantData);
  }
};

export default tenantService;