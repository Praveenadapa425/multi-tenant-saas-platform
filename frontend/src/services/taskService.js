import api from './api';

const taskService = {
  /**
   * Get all tasks for current tenant
   * @returns {Promise} - Axios promise
   */
  getTasks() {
    return api.get('/tasks');
  },

  /**
   * Create a new task
   * @param {string} projectId - Project ID
   * @param {Object} taskData - Task data
   * @returns {Promise} - Axios promise
   */
  createTask(projectId, taskData) {
    return api.post(`/projects/${projectId}/tasks`, taskData);
  },

  /**
   * Get all tasks for a project
   * @param {string} projectId - Project ID
   * @returns {Promise} - Axios promise
   */
  getProjectTasks(projectId) {
    return api.get(`/projects/${projectId}/tasks`);
  },

  /**
   * Update task status
   * @param {string} taskId - Task ID
   * @param {string} status - New status
   * @returns {Promise} - Axios promise
   */
  updateTaskStatus(taskId, status) {
    return api.patch(`/tasks/${taskId}/status`, { status });
  },

  /**
   * Update task
   * @param {string} taskId - Task ID
   * @param {Object} taskData - Task data to update
   * @returns {Promise} - Axios promise
   */
  updateTask(taskId, taskData) {
    return api.put(`/tasks/${taskId}`, taskData);
  },

  /**
   * Delete task
   * @param {string} taskId - Task ID
   * @returns {Promise} - Axios promise
   */
  deleteTask(taskId) {
    return api.delete(`/tasks/${taskId}`);
  }
};

export default taskService;