import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import tenantService from '../services/tenantService';
import '../styles/Dashboard.css';

const SuperAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        const response = await tenantService.getAllTenants();
        if (response.data?.success) {
          setTenants(response.data.tenants || []);
        } else {
          setError(response.data?.message || 'Failed to load tenants');
        }
      } catch (err) {
        setError('Failed to load tenants');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'super_admin') {
      fetchTenants();
    }
  }, [user]);

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
          <p className="subtitle">Manage all tenants in the system</p>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading tenants...</div>
      ) : (
        <div className="dashboard-content">
          <section className="recent-section">
            <div className="section-header">
              <h2>All Tenants</h2>
              <span className="count">{tenants.length} total tenants</span>
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
                    </div>
                    <div className="item-meta">
                      <p>Created: {new Date(tenant.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No tenants found in the system.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;