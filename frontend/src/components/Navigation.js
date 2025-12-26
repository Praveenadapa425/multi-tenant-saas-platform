import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Navigation.css';

const Navigation = () => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!token) {
    return (
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/" className="brand-logo">SaaS Platform</Link>
        </div>
        <div className="navbar-menu">
          <Link to="/login" className="btn btn-secondary">Login</Link>
          <Link to="/register" className="btn btn-primary">Register</Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="brand-logo">SaaS Platform</Link>
      </div>
      <div className="navbar-menu">
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/projects" className="nav-link">Projects</Link>
        <Link to="/users" className="nav-link">Users</Link>
        {user?.role === 'super_admin' && (
          <Link to="/system-admin" className="nav-link">System Admin</Link>
        )}
      </div>
      <div className="navbar-user">
        <span className="user-name">{user?.fullName}</span>
        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
      </div>
    </nav>
  );
};

export default Navigation;
