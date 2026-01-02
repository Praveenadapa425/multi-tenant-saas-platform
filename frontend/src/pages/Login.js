import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Building2, User, Shield } from 'lucide-react';
import '../styles/Auth.css';

export default function Login() {
  const [loginType, setLoginType] = useState('tenant'); // 'tenant' or 'superadmin'
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    tenantSubdomain: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subdomainError, setSubdomainError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError('');
    setSubdomainError('');
    
    // For tenant login, subdomain is required
    if (loginType === 'tenant' && !form.tenantSubdomain.trim()) {
      setSubdomainError('Please enter the tenant subdomain');
      setLoading(false);
      return;
    }
    
    try {
      // For superadmin login, send null for tenantSubdomain
      if (loginType === 'superadmin') {
        await login(form.email, form.password, null);
      } else {
        await login(form.email, form.password, form.tenantSubdomain);
      }
      // Redirect based on user role after login
      if (loginType === 'superadmin') {
        navigate('/system-admin');
      } else {
        navigate('/dashboard');
      }
    } catch (e) {
      console.error('Login error:', e);
      setError(e.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    // Clear form when switching login types
    setForm({ 
      email: '', 
      password: '', 
      tenantSubdomain: '' 
    });
    setError('');
    setSubdomainError('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl mb-4">
            <span className="text-white font-bold text-2xl">PM</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to ProjectHub to continue</p>
        </div>

        {/* Login Type Selector */}
        <div className="login-mode-toggle">
          <button
            type="button"
            className={`mode-btn ${loginType === 'tenant' ? 'active' : ''}`}
            onClick={() => handleLoginTypeChange('tenant')}
          >
            <User className="w-4 h-4 mr-2" />
            Tenant Login
          </button>
          <button
            type="button"
            className={`mode-btn ${loginType === 'superadmin' ? 'active' : ''}`}
            onClick={() => handleLoginTypeChange('superadmin')}
          >
            <Shield className="w-4 h-4 mr-2" />
            Super Admin Login
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={submit} className="auth-form" noValidate>
          {/* Tenant Subdomain - Only show for tenant login */}
          {loginType === 'tenant' && (
            <div className="form-group">
              <label htmlFor="tenantSubdomain" className="block text-sm font-medium text-gray-700 mb-2">
                Tenant Subdomain
              </label>
              <div className="input-group">
                <div className="input-addon">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="tenantSubdomain"
                  type="text"
                  className="input"
                  placeholder="your-company"
                  value={form.tenantSubdomain}
                  onChange={(e) => setForm({ 
                    ...form, 
                    tenantSubdomain: e.target.value.toLowerCase() 
                  })}
                  autoComplete="off"
                />
              </div>
              {subdomainError && (
                <p className="text-red-600 text-sm mt-1">{subdomainError}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="input-group">
              <div className="input-addon">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                className="input"
                placeholder={loginType === 'superadmin' ? "superadmin@system.com" : "you@example.com"}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="input-group">
              <div className="input-addon">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="form-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}