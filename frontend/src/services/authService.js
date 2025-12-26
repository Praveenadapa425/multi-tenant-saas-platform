import api from './api';

/**
 * Register a new tenant with admin user
 * @param {Object} data - Registration data
 * @returns {Promise} - Axios promise
 */
export function registerTenant(data) {
  return api.post('/auth/register-tenant', data);
}

/**
 * User login
 * @param {Object} credentials - Login credentials
 * @returns {Promise} - Axios promise
 */
export function login(credentials) {
  return api.post('/auth/login', credentials);
}

/**
 * Get current user information
 * @returns {Promise} - Axios promise
 */
export function getCurrentUser() {
  return api.get('/auth/me');
}

/**
 * User logout
 * @returns {Promise} - Axios promise
 */
export function logout() {
  return api.post('/auth/logout');
}
