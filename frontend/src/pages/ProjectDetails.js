import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import projectService from '../services/projectService';
import taskService from '../services/taskService';
import '../styles/ProjectDetails.css';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending'
  });
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const projectRes = await projectService.getProject(projectId);
      
      // Handle project data - API returns {success: true, data: {...}}
      if (projectRes.data?.success && projectRes.data?.data) {
        setProject(projectRes.data.data);
      } else {
        setProject(projectRes.data || null);
      }
      
      // Handle tasks data with proper error handling for 404
      try {
        const tasksRes = await taskService.getProjectTasks(projectId);
        // Handle tasks data - API returns {success: true, data: [...]}
        if (tasksRes.data?.success && Array.isArray(tasksRes.data?.data)) {
          setTasks(tasksRes.data.data);
        } else {
          setTasks(tasksRes.data || []);
        }
      } catch (tasksErr) {
        // If tasks API returns 404 (no tasks found), set empty array
        if (tasksErr.response?.status === 404) {
          setTasks([]);
        } else {
          // For other errors, log them but don't fail the entire page
          console.error('Error fetching tasks:', tasksErr);
          setTasks([]);
        }
      }
    } catch (err) {
      setError('Failed to load project data');
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await taskService.createTask(projectId, newTask);
      setNewTask({ title: '', description: '', priority: 'medium', status: 'pending' });
      setShowNewTaskForm(false);
      await fetchData();
    } catch (err) {
      setError('Failed to create task');
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeletingTaskId(taskId);
      await taskService.deleteTask(taskId);
      await fetchData();
      setError('');
    } catch (err) {
      setError('Failed to delete task');
      console.error(err);
    } finally {
      setDeletingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="project-details-page">
        <div className="loading">Loading project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-details-page">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-details-page">
        <div className="alert alert-error">Project not found</div>
      </div>
    );
  }

  return (
    <div className="project-details-page">
      <div className="project-header">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/projects')}
        >
          ← Back to Projects
        </button>
        <div>
          <h1>{project.name}</h1>
          <span className={`status status-${project.status || 'active'}`}>
            {project.status || 'active'}
          </span>
        </div>
      </div>

      <section className="project-info">
        <p className="project-description">{project.description}</p>
      </section>

      <section className="tasks-section">
        <div className="section-header">
          <h2>Tasks ({tasks.length})</h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowNewTaskForm(!showNewTaskForm)}
          >
            {showNewTaskForm ? 'Cancel' : '+ Add Task'}
          </button>
        </div>

        {showNewTaskForm && (
          <div className="task-form-container">
            <form onSubmit={handleCreateTask} className="task-form">
              <div className="form-group">
                <label htmlFor="title">Task Title *</label>
                <input
                  id="title"
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  required
                  placeholder="Enter task title"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Enter task description"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={newTask.status}
                    onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary">Create Task</button>
            </form>
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>No tasks yet</h3>
            <p>Create your first task to start tracking work on this project.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowNewTaskForm(true)}
            >
              Create First Task
            </button>
          </div>
        ) : (
          <div className="tasks-list">
            {tasks.map((task) => (
              <div key={task.id} className="task-card">
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <div className="task-actions">
                    <span className={`priority priority-${task.priority || 'medium'}`}>
                      {task.priority || 'medium'}
                    </span>
                    <button 
                      className="btn btn-small btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                      title="Delete Task"
                      disabled={deletingTaskId === task.id}
                    >
                      {deletingTaskId === task.id ? 'Deleting...' : '🗑️'}
                    </button>
                  </div>
                </div>
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
                <div className="task-footer">
                  <span className={`status status-${task.status || 'pending'}`}>
                    {task.status || 'pending'}
                  </span>
                  {task.dueDate || task.due_date && (
                    <span className="due-date">Due: {task.dueDate || task.due_date}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProjectDetails;