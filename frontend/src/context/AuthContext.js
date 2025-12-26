import React, { createContext, useState, useCallback, useEffect } from 'react';
import { getCurrentUser, registerTenant, login as loginService, logout as logoutService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is still logged in on mount
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, []);

  const verifyToken = useCallback(async () => {
    try {
      const response = await getCurrentUser();
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        logout();
      }
    } catch (err) {
      logout();
    }
  }, [token]);

  const register = useCallback(async (tenantName, subdomain, adminEmail, adminPassword, adminFullName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await registerTenant({
        tenantName,
        subdomain,
        adminEmail,
        adminPassword,
        adminFullName
      });
      if (response.data.success) {
        setUser(response.data.data.user);
        setToken(response.data.data.token);
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('tenantSubdomain', subdomain);
        return { success: true };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password, tenantSubdomain) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginService({ email, password, tenantSubdomain });
      if (response.data.success) {
        setUser(response.data.data.user);
        setToken(response.data.data.token);
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('tenantSubdomain', tenantSubdomain);
        return { success: true };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await logoutService();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('tenantSubdomain');
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, error, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
