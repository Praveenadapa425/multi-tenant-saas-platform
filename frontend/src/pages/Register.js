import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { registerTenant } from '../services/authService';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateSubdomain
} from '../utils/validation';

const Register = () => {
  const { register } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    tenantName: '',
    subdomain: '',
    adminEmail: '',
    adminPassword: '',
    adminFullName: '',
    confirmPassword: '',
    terms: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate tenant name
    const tenantNameValidation = validateName(formData.tenantName);
    if (!tenantNameValidation.isValid) {
      newErrors.tenantName = tenantNameValidation.error;
    }

    // Validate subdomain
    const subdomainValidation = validateSubdomain(formData.subdomain);
    if (!subdomainValidation.isValid) {
      newErrors.subdomain = subdomainValidation.error;
    }

    // Validate email
    const emailValidation = validateEmail(formData.adminEmail);
    if (!emailValidation.isValid) {
      newErrors.adminEmail = emailValidation.error;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.adminPassword);
    if (!passwordValidation.isValid) {
      newErrors.adminPassword = passwordValidation.error;
    }

    // Validate full name
    const nameValidation = validateName(formData.adminFullName);
    if (!nameValidation.isValid) {
      newErrors.adminFullName = nameValidation.error;
    }

    // Check if passwords match
    if (formData.adminPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Check terms
    if (!formData.terms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError('Please fix the errors above');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await registerTenant({
        tenantName: formData.tenantName,
        subdomain: formData.subdomain,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        adminFullName: formData.adminFullName
      });
      
      setSuccess('Tenant registered successfully! You can now login.');
      // Reset form
      setFormData({
        tenantName: '',
        subdomain: '',
        adminEmail: '',
        adminPassword: '',
        adminFullName: '',
        confirmPassword: ''
      });
      
      // Optionally redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Registration error:', err); // Debug log
      const errorResponse = err.response?.data;
      const errorMessage = errorResponse?.message || 'Registration failed';
      
      // Handle field-specific errors from backend validation
      if (errorResponse?.errors && Array.isArray(errorResponse?.errors)) {
        // Handle express-validator errors
        const fieldErrors = {};
        errorResponse.errors.forEach(error => {
          if (error.path === 'subdomain') {
            fieldErrors.subdomain = error.msg;
          } else if (error.path === 'adminEmail') {
            fieldErrors.adminEmail = error.msg;
          } else if (error.path === 'tenantName') {
            fieldErrors.tenantName = error.msg;
          } else if (error.path === 'adminFullName') {
            fieldErrors.adminFullName = error.msg;
          } else if (error.path === 'adminPassword') {
            fieldErrors.adminPassword = error.msg;
          }
        });
        setErrors(fieldErrors);
        setError('');
      } else {
        // Handle specific error messages
        if (errorMessage.includes('Subdomain already exists')) {
          setErrors({
            subdomain: 'Subdomain already exists'
          });
          setError('');
        } else if (errorMessage.includes('Email already registered')) {
          setErrors({
            adminEmail: 'Email already registered'
          });
          setError('');
        } else if (errorMessage.includes('Validation failed')) {
          setError('Please fix the validation errors above');
        } else {
          // Show the actual error message from backend
          setError(errorMessage);
          // Clear field-specific errors
          setErrors({});
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-form-container">
        <h2>Register Your Organization</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="tenantName">Organization Name:</label>
            <input
              type="text"
              id="tenantName"
              name="tenantName"
              value={formData.tenantName}
              onChange={handleChange}
              required
              style={{
                borderColor: errors.tenantName ? '#dc3545' : '#ccc'
              }}
            />
            {errors.tenantName && (
              <small style={{ color: '#dc3545' }}>{errors.tenantName}</small>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="subdomain">Subdomain:</label>
            <div className="input-group">
              <input
                type="text"
                id="subdomain"
                name="subdomain"
                value={formData.subdomain}
                onChange={handleChange}
                required
                style={{
                  borderColor: errors.subdomain ? '#dc3545' : '#ccc'
                }}
              />
              <span className="input-addon">.yourapp.com</span>
            </div>
            {errors.subdomain && (
              <small style={{ color: '#dc3545' }}>{errors.subdomain}</small>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="adminFullName">Admin Full Name:</label>
            <input
              type="text"
              id="adminFullName"
              name="adminFullName"
              value={formData.adminFullName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="adminEmail">Admin Email:</label>
            <input
              type="email"
              id="adminEmail"
              name="adminEmail"
              value={formData.adminEmail}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="adminPassword">Password:</label>
            <input
              type="password"
              id="adminPassword"
              name="adminPassword"
              value={formData.adminPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="terms"
                checked={formData.terms}
                onChange={(e) => setFormData({...formData, terms: e.target.checked})}
                required
              />
              I accept the terms and conditions
            </label>
            {errors.terms && (
              <small style={{ color: '#dc3545' }}>{errors.terms}</small>
            )}
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register Organization'}
          </button>
        </form>
        
        <div className="form-footer">
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;