import api from './api';

const userService = {
  /**
   * Add user to tenant
   * @param {Object} userData - User data
   * @returns {Promise} - Axios promise
   */
  addUser(userData) {
    // The tenantId should be retrieved from the authenticated user context
    // For now, we'll assume the backend will get the tenantId from the JWT token
    const userPayload = {
      email: userData.email,
      password: userData.password,
      fullName: userData.fullName,
      role: userData.role
    };
    return api.post('/users', userPayload);
  },

  /**
   * Get all users for tenant
   * @returns {Promise} - Axios promise
   */
  getUsers() {
    return api.get('/users');
  },

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise} - Axios promise
   */
  updateUser(userId, userData) {
    return api.put(`/users/${userId}`, userData);
  },

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise} - Axios promise
   */
  deleteUser(userId) {
    return api.delete(`/users/${userId}`);
  }
};

export default userService;