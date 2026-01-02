import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import projectService from '../services/projectService';
import taskService from '../services/taskService';
import userService from '../services/userService';
import superadminService from '../services/superadminService';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    users: 0,
    completedTasks: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        if (user?.role === 'super_admin') {
          // For super admin, get system-wide stats
          const statsRes = await superadminService.getSystemStats();
          if (statsRes.success) {
            setStats({
              projects: statsRes.data.totalProjects,
              tasks: statsRes.data.totalTasks,
              users: statsRes.data.totalUsers,
              completedTasks: 0 // This would need a separate endpoint to calculate
            });
          }

          // Get recent projects and tasks
          const [projectsRes, tasksRes] = await Promise.allSettled([
            projectService.getProjects(),
            taskService.getTasks()
          ]);

          // Handle projects response
          let projects = [];
          if (projectsRes.status === 'fulfilled' && projectsRes.value?.data?.success) {
            projects = projectsRes.value.data.data || [];
          } else {
            console.error('Error fetching projects:', projectsRes.reason);
          }

          // Handle tasks response
          let tasks = [];
          if (tasksRes.status === 'fulfilled' && tasksRes.value?.data?.success) {
            tasks = tasksRes.value.data.data || [];
          } else {
            console.error('Error fetching tasks:', tasksRes.reason);
          }

          const completedTasks = tasks.filter(t => t.status === 'completed').length;
          setStats(prev => ({ 
            projects: prev.projects, 
            tasks: prev.tasks, 
            users: prev.users, 
            completedTasks 
          }));

          setRecentProjects(projects.slice(0, 5));
          setRecentTasks(tasks.slice(0, 5));
        } else {
          // For regular users, get tenant-specific data
          // Fetch all data in parallel
          const [projectsRes, tasksRes, usersRes] = await Promise.allSettled([
            projectService.getProjects(),
            taskService.getTasks(),
            userService.getUsers()
          ]);

          // Handle projects response
          let projects = [];
          if (projectsRes.status === 'fulfilled' && projectsRes.value?.data?.success) {
            projects = projectsRes.value.data.data || [];
          } else {
            console.error('Error fetching projects:', projectsRes.reason);
          }

          // Handle tasks response
          let tasks = [];
          if (tasksRes.status === 'fulfilled' && tasksRes.value?.data?.success) {
            tasks = tasksRes.value.data.data || [];
          } else {
            console.error('Error fetching tasks:', tasksRes.reason);
          }

          // Handle users response
          let users = [];
          if (usersRes.status === 'fulfilled' && usersRes.value?.data?.success) {
            users = usersRes.value.data.data || [];
          } else {
            console.error('Error fetching users:', usersRes.reason);
          }

          const completedTasks = tasks.filter(t => t.status === 'completed').length;

          setStats({
            projects: projects.length,
            tasks: tasks.length,
            users: users.length,
            completedTasks: completedTasks
          });

          setRecentProjects(projects.slice(0, 5));
          setRecentTasks(tasks.slice(0, 5));
        }
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This will also delete all tasks in this project. This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeletingProjectId(projectId);
      await projectService.deleteProject(projectId);
      await fetchDashboardData();
      setError('');
    } catch (err) {
      setError('Failed to delete project');
      console.error(err);
    } finally {
      setDeletingProjectId(null);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeletingTaskId(taskId);
      await taskService.deleteTask(taskId);
      await fetchDashboardData();
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
      <div className="dashboard-page">
        <div className="loading">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-header">
        <div>
          <h1>{user?.role === 'super_admin' ? 'System Dashboard' : 'Dashboard'}</h1>
          <p className="subtitle">Welcome back, {user?.fullName}!</p>
          {user?.role !== 'super_admin' && user?.tenant && (
            <p className="tenant-info">Organization: {user.tenant.name}</p>
          )}
          {user?.role === 'super_admin' && (
            <p className="tenant-info">System Administrator - Access to all tenants</p>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <p className="stat-label">Total Projects</p>
            <p className="stat-number">{stats.projects}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <p className="stat-label">Total Tasks</p>
            <p className="stat-number">{stats.tasks}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <p className="stat-label">Completed Tasks</p>
            <p className="stat-number">{stats.completedTasks}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <p className="stat-label">Team Members</p>
            <p className="stat-number">{stats.users}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <section className="recent-section">
          <div className="section-header">
            <h2>Recent Projects</h2>
            <button 
              className="btn btn-small btn-primary"
              onClick={() => navigate('/projects')}
            >
              View All
            </button>
          </div>
          {recentProjects.length > 0 ? (
            <div className="recent-list">
              {recentProjects.map(project => (
                <div 
                  key={project.id} 
                  className="recent-item"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="item-content">
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
                  </div>
                  <div className="item-actions">
                    <span className={`status status-${project.status}`}>
                      {project.status}
                    </span>
                    <button 
                      className="btn btn-small btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      title="Delete Project"
                      disabled={deletingProjectId === project.id}
                    >
                      {deletingProjectId === project.id ? 'Deleting...' : '🗑️'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No projects yet. Create your first project!</p>
          )}
        </section>

        <section className="recent-section">
          <div className="section-header">
            <h2>Recent Tasks</h2>
            <button 
              className="btn btn-small btn-primary"
              onClick={() => navigate('/projects')}
            >
              View All
            </button>
          </div>
          {recentTasks.length > 0 ? (
            <div className="recent-list">
              {recentTasks.map(task => (
                <div key={task.id} className="recent-item">
                  <div className="item-content">
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                  </div>
                  <div className="item-actions">
                    <span className={`status status-${task.status}`}>
                      {task.status}
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
              ))}
            </div>
          ) : (
            <p className="empty-state">No tasks yet. Start by creating a task!</p>
          )}
        </section>
      </div>

      <section className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button 
            className="action-btn"
            onClick={() => navigate('/projects')}
          >
            <span className="action-icon">📋</span>
            <span className="action-text">View Projects</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/users')}
          >
            <span className="action-icon">👥</span>
            <span className="action-text">Manage Users</span>
          </button>
          {user?.role === 'super_admin' && (
            <button 
              className="action-btn"
              onClick={() => navigate('/system-admin')}
            >
              <span className="action-icon">⚙️</span>
              <span className="action-text">System Admin</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
