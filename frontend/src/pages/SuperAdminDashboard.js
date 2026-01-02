import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import superadminService from '../services/superadminService';
import projectService from '../services/projectService';
import '../styles/Dashboard.css';

const SuperAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'tenants', 'users', 'projects'
  const [error, setError] = useState('');
  const [deletingTenantId, setDeletingTenantId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, tenantsRes, usersRes, projectsRes] = await Promise.all([
          superadminService.getSystemStats(),
          superadminService.getAllTenants({ limit: 10 }),
          superadminService.getAllUsers({ limit: 10 }),
          projectService.getProjects() // Get all projects for super admin
        ]);
        
        if (statsRes.success) setStats(statsRes.data);
        if (tenantsRes.success) setTenants(tenantsRes.data);
        if (usersRes.success) setUsers(usersRes.data);
        if (projectsRes.data?.success) setProjects(projectsRes.data.data || []);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'super_admin') {
      fetchData();
    }
  }, [user]);

  const handleDeleteTenant = async (tenantId) => {
    if (!window.confirm('Are you sure you want to delete this tenant? This will permanently delete all data associated with this tenant including users, projects, and tasks. This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeletingTenantId(tenantId);
      const deleteResult = await superadminService.deleteTenant(tenantId);
      
      if (!deleteResult.success) {
        setError(deleteResult.message || 'Failed to delete tenant');
        console.error('Tenant deletion failed:', deleteResult);
        return;
      }
      
      // Refresh the tenants list
      const tenantsRes = await superadminService.getAllTenants({ limit: 10 });
      if (tenantsRes.success) {
        setTenants(tenantsRes.data);
        setError('');
      } else {
        setError('Tenant deleted but failed to refresh tenant list');
        console.error('Failed to refresh tenant list:', tenantsRes);
      }
    } catch (err) {
      setError('Failed to delete tenant: ' + (err.response?.data?.message || err.message || 'Unknown error'));
      console.error('Error deleting tenant:', err);
    } finally {
      setDeletingTenantId(null);
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="dashboard-page">
        <div className="alert alert-error">
          Access denied. Super admin privileges required.
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="dashboard-header">
        <div>
          <h1>System Administration</h1>
          <p className="subtitle">Manage all tenants and users in the system</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          System Stats
        </button>
        <button 
          className={`tab-button ${activeTab === 'tenants' ? 'active' : ''}`}
          onClick={() => setActiveTab('tenants')}
        >
          All Tenants
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          All Users
        </button>
        <button 
          className={`tab-button ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          All Projects
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading dashboard data...</div>
      ) : (
        <div className="dashboard-content">
          {/* System Statistics Tab */}
          {activeTab === 'stats' && stats && (
            <section className="stats-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{stats.totalTenants}</h3>
                  <p>Total Tenants</p>
                </div>
                <div className="stat-card">
                  <h3>{stats.totalUsers}</h3>
                  <p>Total Users</p>
                </div>
                <div className="stat-card">
                  <h3>{stats.totalProjects}</h3>
                  <p>Total Projects</p>
                </div>
                <div className="stat-card">
                  <h3>{stats.totalTasks}</h3>
                  <p>Total Tasks</p>
                </div>
              </div>
            </section>
          )}

          {/* All Tenants Tab */}
          {activeTab === 'tenants' && (
            <section className="recent-section">
              <div className="section-header">
                <h2>All Tenants</h2>
                <span className="count">{tenants.length} recent tenants</span>
              </div>
              
              {tenants.length > 0 ? (
                <div className="recent-list">
                  {tenants.map(tenant => (
                    <div key={tenant.id} className="recent-item">
                      <div className="item-content">
                        <h3>{tenant.name}</h3>
                        <p>Subdomain: {tenant.subdomain}</p>
                        <p>Status: <span className={`status status-${tenant.status}`}>
                          {tenant.status}
                        </span></p>
                        <p>Plan: {tenant.subscription_plan}</p>
                      </div>
                      <div className="item-actions">
                        <div className="item-meta">
                          <p>Created: {new Date(tenant.created_at).toLocaleDateString()}</p>
                        </div>
                        <button 
                          className="btn btn-small btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTenant(tenant.id);
                          }}
                          title="Delete Tenant"
                          disabled={deletingTenantId === tenant.id}
                        >
                          {deletingTenantId === tenant.id ? 'Deleting...' : '🗑️'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No tenants found in the system.</p>
              )}
            </section>
          )}

          {/* All Users Tab */}
          {activeTab === 'users' && (
            <section className="recent-section">
              <div className="section-header">
                <h2>All Users</h2>
                <span className="count">{users.length} recent users</span>
              </div>
              
              {users.length > 0 ? (
                <div className="recent-list">
                  {users.map(user => (
                    <div key={user.id} className="recent-item">
                      <div className="item-content">
                        <h3>{user.full_name}</h3>
                        <p>Email: {user.email}</p>
                        <p>Role: <span className={`role role-${user.role}`}>
                          {user.role}
                        </span></p>
                        <p>Status: <span className={`status status-${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span></p>
                        {user.tenant_name && (
                          <p>Tenant: {user.tenant_name} ({user.tenant_subdomain})</p>
                        )}
                      </div>
                      <div className="item-meta">
                        <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No users found in the system.</p>
              )}
            </section>
          )}

          {/* All Projects Tab */}
          {activeTab === 'projects' && (
            <section className="recent-section">
              <div className="section-header">
                <h2>All Projects</h2>
                <span className="count">{projects.length} projects</span>
              </div>
              
              {projects.length > 0 ? (
                <div className="recent-list">
                  {projects.map(project => (
                    <div key={project.id} className="recent-item">
                      <div className="item-content">
                        <h3>{project.name}</h3>
                        <p>{project.description}</p>
                        <p>Status: <span className={`status status-${project.status}`}>
                          {project.status}
                        </span></p>
                        <p>Tenant ID: {project.tenant_id}</p>
                      </div>
                      <div className="item-meta">
                        <p>Created: {new Date(project.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No projects found in the system.</p>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
