import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { validateEmail } from '../utils/validation';
import '../styles/Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login, token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors({ ...errors, email: '' });
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) setErrors({ ...errors, password: '' });
  };

  const handleSubdomainChange = (e) => {
    setSubdomain(e.target.value);
    if (errors.subdomain) setErrors({ ...errors, subdomain: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    const newErrors = {};
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }
    
    if (!password || password.trim() === '') {
      newErrors.password = 'Password is required';
    }
    
    if (!subdomain || subdomain.trim() === '') {
      newErrors.subdomain = 'Subdomain is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError('Please fix the errors above');
      return;
    }
    
    setError('');
    setErrors({});
    setLoading(true);

    try {
      await login(email, password, subdomain);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Login</h1>
        
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="subdomain">Organization Subdomain</label>
            <input
              id="subdomain"
              type="text"
              value={subdomain}
              onChange={handleSubdomainChange}
              required
              placeholder="e.g., mycompany"
              disabled={loading}
              style={{
                borderColor: errors.subdomain ? '#dc3545' : '#ccc'
              }}
            />
            {errors.subdomain && (
              <small style={{ color: '#dc3545' }}>{errors.subdomain}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
              placeholder="Enter your email"
              disabled={loading}
              style={{
                borderColor: errors.email ? '#dc3545' : '#ccc'
              }}
            />
            {errors.email && (
              <small style={{ color: '#dc3545' }}>{errors.email}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
              placeholder="Enter your password"
              disabled={loading}
              style={{
                borderColor: errors.password ? '#dc3545' : '#ccc'
              }}
            />
            {errors.password && (
              <small style={{ color: '#dc3545' }}>{errors.password}</small>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;