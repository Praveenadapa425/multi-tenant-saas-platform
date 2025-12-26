import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import projectService from '../services/projectService';
import taskService from '../services/taskService';
import '../styles/Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'active'
  });
  const [taskModal, setTaskModal] = useState({
    show: false,
    projectId: null,
    projectIndex: null
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjects();
      // The API response has a success property and data property
      if (response.data?.success && Array.isArray(response.data?.data)) {
        setProjects(response.data.data || []);
      } else {
        setProjects([]);
      }
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await projectService.createProject(newProject);
      setNewProject({ name: '', description: '', status: 'active' });
      setShowNewForm(false);
      await fetchProjects();
    } catch (err) {
      setError('Failed to create project');
      console.error(err);
    }
  };

  const handleTaskModal = (projectId, projectIndex) => {
    setTaskModal({
      show: true,
      projectId,
      projectIndex
    });
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: ''
    });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await taskService.createTask(taskModal.projectId, newTask);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: ''
      });
      setTaskModal({ show: false, projectId: null, projectIndex: null });
      
      // Refresh the projects list to update task counts
      await fetchProjects();
    } catch (err) {
      setError('Failed to create task');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="projects-page">
        <div className="loading">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="subtitle">Manage your organization's projects</p>
        </div>
        <button 
          className="btn btn-primary btn-large"
          onClick={() => setShowNewForm(!showNewForm)}
        >
          {showNewForm ? 'Cancel' : '+ Create New Project'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showNewForm && (
        <div className="create-form-container">
          <form onSubmit={handleCreateProject} className="create-form">
            <div className="form-group">
              <label htmlFor="name">Project Name *</label>
              <input
                id="name"
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                required
                placeholder="Enter project name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                placeholder="Enter project description"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={newProject.status}
                onChange={(e) => setNewProject({...newProject, status: e.target.value})}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary">Create Project</button>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No projects yet</h2>
          <p>Create your first project to get started managing tasks and teams.</p>
          <button 
            className="btn btn-primary btn-large"
            onClick={() => setShowNewForm(true)}
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="project-card"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="project-header">
                <h3>{project.name}</h3>
                <span className={`status status-${project.status || 'active'}`}>
                  {project.status || 'active'}
                </span>
              </div>
              <p className="project-description">{project.description}</p>
              <div className="project-footer">
                <span className="task-count">📋 {project.task_count || project.taskCount || 0} tasks</span>
                <button 
                  className="btn btn-small btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    const projectIndex = projects.findIndex(p => p.id === project.id);
                    handleTaskModal(project.id, projectIndex);
                  }}
                >
                  + Add Task
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Creation Modal */}
      {taskModal.show && (
        <div className="modal-overlay" onClick={() => setTaskModal({ show: false, projectId: null, projectIndex: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Task</h3>
              <button 
                className="modal-close"
                onClick={() => setTaskModal({ show: false, projectId: null, projectIndex: null })}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="task-form">
              <div className="form-group">
                <label htmlFor="task-title">Task Title *</label>
                <input
                  id="task-title"
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  required
                  placeholder="Enter task title"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="task-description">Description</label>
                <textarea
                  id="task-description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Enter task description"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="task-dueDate">Due Date (optional)</label>
                <input
                  id="task-dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setTaskModal({ show: false, projectId: null, projectIndex: null })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;