import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import projectService from '../services/projectService';
import taskService from '../services/taskService';
import userService from '../services/userService';
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
  const { user, tenant } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
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
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
          <h1>Dashboard</h1>
          <p className="subtitle">Welcome back, {user?.fullName}!</p>
          {tenant && <p className="tenant-info">Organization: {tenant.name}</p>}
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
                  <span className={`status status-${project.status}`}>
                    {project.status}
                  </span>
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
                  <span className={`status status-${task.status}`}>
                    {task.status}
                  </span>
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
        </div>
      </section>
    </div>
  );
};

export default Dashboard;