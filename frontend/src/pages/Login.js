import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Building2 } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', tenantSubdomain: '' });
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
    
    // Check if subdomain is required (for non-super-admin users)
    if (!form.tenantSubdomain.trim()) {
      // Check if it's a superadmin email
      const isSuperAdmin = form.email.toLowerCase() === 'superadmin@system.com';
      
      if (!isSuperAdmin) {
        setSubdomainError('Please enter the subdomain');
        setLoading(false);
        return;
      }
    }
    
    try {
      await login(form.email, form.password, form.tenantSubdomain || null);
      navigate('/dashboard');
    } catch (e) {
      console.error('Login error:', e);
      setError(e.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdminEmail = form.email.toLowerCase() === 'superadmin@system.com';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl mb-4">
            <span className="text-white font-bold text-2xl">PM</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to ProjectHub to continue</p>
        </div>

        {/* Login Card */}
        <div className="card p-8 shadow-soft-xl">
          <form onSubmit={submit} className="space-y-5" noValidate>
            {/* Tenant Subdomain */}
            <div>
              <label htmlFor="tenantSubdomain" className="block text-sm font-medium text-gray-700 mb-2">
                Tenant Subdomain{' '}
                <span className="text-xs text-gray-500">(omit for Super Admin)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="tenantSubdomain"
                  type="text"
                  className={`input pl-10 ${subdomainError ? 'border-red-500' : ''}`}
                  placeholder={isSuperAdminEmail ? "Optional for Super Admin" : "your-company"}
                  value={form.tenantSubdomain}
                  onChange={(e) => setForm({ ...form, tenantSubdomain: e.target.value.toLowerCase() })}
                  autoComplete="off"
                  pattern=".*"
                  title=""
                />
              </div>
              {subdomainError && (
                <p className="text-red-600 text-sm mt-1">{subdomainError}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  className="input pl-10"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="username"
                  pattern=".*"
                  title=""
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  className="input pl-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                  pattern=".*"
                  title=""
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary btn-lg"
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
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
            Create one now
          </Link>
        </p>
      </div>
    </div>
  );
}