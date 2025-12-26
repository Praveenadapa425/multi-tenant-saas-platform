import api from './api';

const projectService = {
  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @returns {Promise} - Axios promise
   */
  createProject(projectData) {
    return api.post('/projects', projectData);
  },

  /**
   * Get all projects
   * @returns {Promise} - Axios promise
   */
  getProjects() {
    return api.get('/projects');
  },

  /**
   * Get project by ID
   * @param {string} projectId - Project ID
   * @returns {Promise} - Axios promise
   */
  getProject(projectId) {
    return api.get(`/projects/${projectId}`);
  },

  /**
   * Update project
   * @param {string} projectId - Project ID
   * @param {Object} projectData - Project data to update
   * @returns {Promise} - Axios promise
   */
  updateProject(projectId, projectData) {
    return api.put(`/projects/${projectId}`, projectData);
  },

  /**
   * Delete project
   * @param {string} projectId - Project ID
   * @returns {Promise} - Axios promise
   */
  deleteProject(projectId) {
    return api.delete(`/projects/${projectId}`);
  }
};

export default projectService;