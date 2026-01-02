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
export function login(email, password, tenantSubdomain) {
  // Create credentials object conditionally including tenantSubdomain only if provided
  // For superadmin login, tenantSubdomain will be null
  if (tenantSubdomain) {
    // Include tenantSubdomain for regular user login
    return api.post('/auth/login', {
      email,
      password,
      tenantSubdomain
    });
  } else {
    // Don't include tenantSubdomain for superadmin login
    return api.post('/auth/login', {
      email,
      password
    });
  }
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
