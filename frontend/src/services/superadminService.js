import api from './api';

const superadminService = {
  getSystemStats: async () => {
    try {
      const response = await api.get('/superadmin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  },

  getAllTenants: async (params = {}) => {
    try {
      const response = await api.get('/superadmin/tenants', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all tenants:', error);
      throw error;
    }
  },

  getAllUsers: async (params = {}) => {
    try {
      const response = await api.get('/superadmin/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  },

  updateTenantStatus: async (tenantId, status) => {
    try {
      const response = await api.put(`/superadmin/tenants/${tenantId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating tenant status:', error);
      throw error;
    }
  }
};

export default superadminService;