import axios from 'axios';
import { getProjects, createProject, updateProject, deleteProject } from '../src/services/projectService';
import { getUsers, createUser, updateUser, deleteUser } from '../src/services/userService';
import { getTenant, updateTenant } from '../src/services/tenantService';
import { getTasks, createTask, updateTask, deleteTask } from '../src/services/taskService';

// Mock axios
jest.mock('axios');

describe('API Service Tests', () => {
  const mockToken = 'test-token';
  const mockAxios = axios;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Project Service', () => {
    test('getProjects makes correct API call', async () => {
      const mockResponse = { data: { success: true, data: [] } };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await getProjects(mockToken);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'GET',
        url: 'http://localhost:3000/api/projects',
        headers: { Authorization: `Bearer ${mockToken}` }
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('createProject makes correct API call', async () => {
      const projectData = { name: 'Test Project', description: 'Test Description' };
      const mockResponse = { data: { success: true, data: { id: '1', ...projectData } } };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await createProject(projectData, mockToken);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        headers: { Authorization: `Bearer ${mockToken}` },
        data: projectData
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('updateProject makes correct API call', async () => {
      const projectId = '1';
      const updateData = { name: 'Updated Project' };
      const mockResponse = { data: { success: true, data: { id: '1', name: 'Updated Project' } } };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await updateProject(projectId, updateData, mockToken);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'PUT',
        url: `http://localhost:3000/api/projects/${projectId}`,
        headers: { Authorization: `Bearer ${mockToken}` },
        data: updateData
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('deleteProject makes correct API call', async () => {
      const projectId = '1';
      const mockResponse = { data: { success: true, message: 'Project deleted' } };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await deleteProject(projectId, mockToken);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'DELETE',
        url: `http://localhost:3000/api/projects/${projectId}`,
        headers: { Authorization: `Bearer ${mockToken}` }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('User Service', () => {
    test('getUsers makes correct API call', async () => {
      const mockResponse = { data: { success: true, data: [] } };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await getUsers(mockToken);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'GET',
        url: 'http://localhost:3000/api/users',
        headers: { Authorization: `Bearer ${mockToken}` }
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('createUser makes correct API call', async () => {
      const userData = { 
        firstName: 'Test', 
        lastName: 'User', 
        email: 'test@example.com', 
        password: 'Password123!',
        role: 'user'
      };
      const mockResponse = { data: { success: true, data: { id: '1', ...userData } } };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await createUser(userData, mockToken);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'POST',
        url: 'http://localhost:3000/api/users',
        headers: { Authorization: `Bearer ${mockToken}` },
        data: userData
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('updateUser makes correct API call', async () => {
      const userId = '1';
      const updateData = { firstName: 'Updated' };
      const mockResponse = { data: { success: true, data: { id: '1', firstName: 'Updated' } } };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await updateUser(userId, updateData, mockToken);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'PUT',
        url: `http://localhost:3000/api/users/${userId}`,
        headers: { Authorization: `Bearer ${mockToken}` },
        data: updateData
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('deleteUser makes correct API call', async () => {
      const userId = '1';
      const mockResponse = { data: { success: true, message: 'User deleted' } };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await deleteUser(userId, mockToken);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'DELETE',
        url: `http://localhost:3000/api/users/${userId}`,
        headers: { Authorization: `Bearer ${mockToken}` }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Tenant Service', () => {
    test('getTenant makes correct API call', async () => {
      const tenantId = '1';
      const mockResponse = { data: { success: true, data: { id: '1', name: 'Test Tenant' } } };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await getTenant(tenantId, mockToken);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'GET',
        url: `http://localhost:3000/api/tenants/${tenantId}`,
        headers: { Authorization: `Bearer ${mockToken}` }
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('updateTenant makes correct API call', async () => {
      const tenantId = '1';
      const updateData = { name: 'Updated Tenant' };
      const mockResponse = { data: { success: true, data: { id: '1', name: 'Updated Tenant' } } };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await updateTenant(tenantId, updateData, mockToken);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'PUT',
        url: `http://localhost:3000/api/tenants/${tenantId}`,
        headers: { Authorization: `Bearer ${mockToken}` },
        data: updateData
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Task Service', () => {
    test('getTasks makes correct API call', async () => {
      const mockResponse = { data: { success: true, data: [] } };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await getTasks(mockToken);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'GET',
        url: 'http://localhost:3000/api/tasks',
        headers: { Authorization: `Bearer ${mockToken}` }
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('createTask makes correct API call', async () => {
      const taskData = { 
        title: 'Test Task', 
        description: 'Test Description', 
        status: 'todo',
        priority: 'medium',
        assigned_user_id: 'user-id'
      };
      const mockResponse = { data: { success: true, data: { id: '1', ...taskData } } };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await createTask('project-id', taskData, mockToken);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'POST',
        url: 'http://localhost:3000/api/projects/project-id/tasks',
        headers: { Authorization: `Bearer ${mockToken}` },
        data: taskData
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('updateTask makes correct API call', async () => {
      const taskId = '1';
      const updateData = { title: 'Updated Task' };
      const mockResponse = { data: { success: true, data: { id: '1', title: 'Updated Task' } } };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await updateTask(taskId, updateData, mockToken);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'PUT',
        url: `http://localhost:3000/api/tasks/${taskId}`,
        headers: { Authorization: `Bearer ${mockToken}` },
        data: updateData
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('deleteTask makes correct API call', async () => {
      const taskId = '1';
      const mockResponse = { data: { success: true, message: 'Task deleted' } };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await deleteTask(taskId, mockToken);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'DELETE',
        url: `http://localhost:3000/api/tasks/${taskId}`,
        headers: { Authorization: `Bearer ${mockToken}` }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});