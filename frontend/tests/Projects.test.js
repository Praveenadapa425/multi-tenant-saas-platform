import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Projects from '../src/pages/Projects';
import { useAuth } from '../src/context/AuthContext';

// Mock the AuthContext
jest.mock('../src/context/AuthContext');

// Mock the project service
jest.mock('../src/services/projectService', () => ({
  getProjects: jest.fn().mockResolvedValue({ success: true, data: [] }),
  createProject: jest.fn().mockResolvedValue({ success: true }),
  updateProject: jest.fn().mockResolvedValue({ success: true }),
  deleteProject: jest.fn().mockResolvedValue({ success: true })
}));

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('Projects Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({
      user: { 
        id: 'user-id', 
        email: 'test@example.com', 
        first_name: 'Test', 
        last_name: 'User', 
        role: 'user' 
      },
      token: 'test-token',
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    });
  });

  test('renders projects page with header', () => {
    renderWithRouter(<Projects />);
    
    expect(screen.getByText(/projects/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument();
  });

  test('loads and displays projects', async () => {
    const mockProjects = [
      { id: '1', name: 'Project 1', description: 'Description 1', status: 'active' },
      { id: '2', name: 'Project 2', description: 'Description 2', status: 'active' }
    ];
    
    const { getProjects } = require('../src/services/projectService');
    getProjects.mockResolvedValue({ success: true, data: mockProjects });
    
    renderWithRouter(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText(/project 1/i)).toBeInTheDocument();
      expect(screen.getByText(/project 2/i)).toBeInTheDocument();
    });
  });

  test('shows loading state while fetching projects', () => {
    renderWithRouter(<Projects />);
    
    expect(screen.getByText(/loading projects.../i)).toBeInTheDocument();
  });

  test('shows error message when project fetch fails', async () => {
    const { getProjects } = require('../src/services/projectService');
    getProjects.mockResolvedValue({ success: false, message: 'Failed to fetch projects' });
    
    renderWithRouter(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch projects/i)).toBeInTheDocument();
    });
  });

  test('opens and closes project creation modal', () => {
    renderWithRouter(<Projects />);
    
    const createButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(createButton);
    
    expect(screen.getByText(/create new project/i)).toBeInTheDocument();
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText(/create new project/i)).not.toBeInTheDocument();
  });

  test('submits project creation form', async () => {
    const { createProject } = require('../src/services/projectService');
    createProject.mockResolvedValue({ success: true, data: { id: 'new-project', name: 'New Project' } });
    
    renderWithRouter(<Projects />);
    
    const createButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(createButton);
    
    const nameInput = screen.getByLabelText(/project name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const submitButton = screen.getByRole('button', { name: /create/i });
    
    fireEvent.change(nameInput, { target: { value: 'New Project' } });
    fireEvent.change(descriptionInput, { target: { value: 'New Project Description' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(createProject).toHaveBeenCalledWith(
        { name: 'New Project', description: 'New Project Description' },
        'test-token'
      );
    });
  });

  test('shows validation errors for project creation', async () => {
    renderWithRouter(<Projects />);
    
    const createButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(createButton);
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
    });
  });

  test('allows project deletion', async () => {
    const mockProjects = [
      { id: '1', name: 'Project 1', description: 'Description 1', status: 'active' }
    ];
    
    const { getProjects, deleteProject } = require('../src/services/projectService');
    getProjects.mockResolvedValue({ success: true, data: mockProjects });
    deleteProject.mockResolvedValue({ success: true });
    
    renderWithRouter(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText(/project 1/i)).toBeInTheDocument();
    });
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(deleteProject).toHaveBeenCalledWith('1', 'test-token');
    });
  });

  test('allows project editing', async () => {
    const mockProjects = [
      { id: '1', name: 'Project 1', description: 'Description 1', status: 'active' }
    ];
    
    const { getProjects, updateProject } = require('../src/services/projectService');
    getProjects.mockResolvedValue({ success: true, data: mockProjects });
    updateProject.mockResolvedValue({ success: true, data: { id: '1', name: 'Updated Project' } });
    
    renderWithRouter(<Projects />);
    
    await waitFor(() => {
      expect(screen.getByText(/project 1/i)).toBeInTheDocument();
    });
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    const nameInput = screen.getByLabelText(/project name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Project' } });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(updateProject).toHaveBeenCalledWith(
        '1',
        { name: 'Updated Project' },
        'test-token'
      );
    });
  });
});