const { body, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
}

/**
 * Validation rules for tenant registration
 */
const tenantRegistrationValidation = [
  body('tenantName')
    .notEmpty()
    .withMessage('Tenant name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Tenant name must be between 3 and 100 characters'),
  
  body('subdomain')
    .notEmpty()
    .withMessage('Subdomain is required')
    .isLength({ min: 3, max: 63 })
    .withMessage('Subdomain must be between 3 and 63 characters')
    .matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/)
    .withMessage('Subdomain can only contain lowercase letters, numbers, and hyphens (cannot start or end with hyphen)'),
  
  body('adminEmail')
    .notEmpty()
    .withMessage('Admin email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  body('adminPassword')
    .notEmpty()
    .withMessage('Admin password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('adminFullName')
    .notEmpty()
    .withMessage('Admin full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  handleValidationErrors
];

/**
 * Validation rules for user login
 */
const userLoginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('tenantSubdomain')
    .notEmpty()
    .withMessage('Tenant subdomain is required'),
  
  handleValidationErrors
];

/**
 * Validation rules for creating a user
 */
const createUserValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('role')
    .optional()
    .isIn(['user', 'tenant_admin'])
    .withMessage('Role must be "user" or "tenant_admin"'),
  
  handleValidationErrors
];

/**
 * Validation rules for creating a project
 */
const createProjectValidation = [
  body('name')
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Project name must be between 1 and 255 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Project description must be less than 1000 characters'),
  
  body('status')
    .optional()
    .isIn(['active', 'archived', 'completed'])
    .withMessage('Status must be "active", "archived", or "completed"'),
  
  handleValidationErrors
];

/**
 * Validation rules for creating a task
 */
const createTaskValidation = [
  body('title')
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Task title must be between 1 and 255 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Task description must be less than 1000 characters'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be "low", "medium", or "high"'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),
  
  handleValidationErrors
];

module.exports = {
  tenantRegistrationValidation,
  userLoginValidation,
  createUserValidation,
  createProjectValidation,
  createTaskValidation
};