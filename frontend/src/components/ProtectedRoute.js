import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ element }) => {
  const { token, user } = useContext(AuthContext);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" />;
  }

  // Check if accessing super admin route
  const isSuperAdminRoute = location.pathname === '/system-admin';
  
  if (isSuperAdminRoute && user?.role !== 'super_admin') {
    // Redirect to dashboard if not super admin
    return <Navigate to="/dashboard" />;
  }

  return element;
};

export default ProtectedRoute;
