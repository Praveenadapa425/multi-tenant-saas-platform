/**
 * Application Constants and Enums
 * Centralized configuration for all application-wide constants
 */

// ============================================
// USER ROLES AND PERMISSIONS
// ============================================

const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  USER: 'user'
};

const ROLE_DESCRIPTIONS = {
  super_admin: 'System Administrator with full access',
  tenant_admin: 'Organization Administrator',
  user: 'Regular Team Member'
};

const ROLE_PERMISSIONS = {
  super_admin: ['manage_all_tenants', 'view_all_data', 'create_tenant', 'manage_users', 'manage_projects', 'manage_tasks'],
  tenant_admin: ['manage_tenant', 'manage_users', 'manage_projects', 'manage_tasks', 'view_reports'],
  user: ['manage_own_profile', 'view_projects', 'manage_tasks', 'collaborate']
};

// ============================================
// SUBSCRIPTION PLANS AND LIMITS
// ============================================

const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

const SUBSCRIPTION_LIMITS = {
  free: {
    maxUsers: 5,
    maxProjects: 3,
    maxStorage: 1000000000, // 1GB
    features: ['basic_projects', 'basic_tasks', 'email_support']
  },
  pro: {
    maxUsers: 25,
    maxProjects: 15,
    maxStorage: 10000000000, // 10GB
    features: ['advanced_projects', 'advanced_tasks', 'team_collaboration', 'analytics', 'priority_support']
  },
  enterprise: {
    maxUsers: 100,
    maxProjects: 50,
    maxStorage: 100000000000, // 100GB
    features: ['all_features', 'sso', 'advanced_analytics', 'dedicated_support', 'custom_workflows']
  }
};

const SUBSCRIPTION_DESCRIPTIONS = {
  free: 'Perfect for small teams getting started',
  pro: 'Great for growing organizations',
  enterprise: 'For large-scale enterprises'
};

const SUBSCRIPTION_PRICES = {
  free: 0,
  pro: 29,
  enterprise: 99
};

// ============================================
// TENANT MANAGEMENT
// ============================================

const TENANT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  TRIAL: 'trial',
  INACTIVE: 'inactive'
};

const TENANT_STATUS_DESCRIPTIONS = {
  active: 'Tenant is active and operational',
  suspended: 'Tenant account is suspended',
  trial: 'Tenant is in trial period',
  inactive: 'Tenant account is inactive'
};

// ============================================
// PROJECT MANAGEMENT
// ============================================

const PROJECT_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold'
};

const PROJECT_STATUS_DESCRIPTIONS = {
  active: 'Project is active',
  archived: 'Project is archived',
  completed: 'Project is completed',
  on_hold: 'Project is on hold'
};

const PROJECT_VISIBILITY = {
  PRIVATE: 'private',
  TEAM: 'team',
  PUBLIC: 'public'
};

// ============================================
// TASK MANAGEMENT
// ============================================

const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled'
};

const TASK_STATUS_DESCRIPTIONS = {
  todo: 'Task needs to be started',
  in_progress: 'Task is being worked on',
  in_review: 'Task is under review',
  completed: 'Task is completed',
  blocked: 'Task is blocked',
  cancelled: 'Task is cancelled'
};

const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

const TASK_PRIORITY_DESCRIPTIONS = {
  low: 'Can be done when time permits',
  medium: 'Should be done soon',
  high: 'Should be prioritized',
  critical: 'Must be done immediately'
};

const TASK_PRIORITY_LEVELS = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

// ============================================
// AUDIT AND LOGGING
// ============================================

const AUDIT_ACTIONS = {
  // User Actions
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_REGISTERED: 'USER_REGISTERED',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_PASSWORD_CHANGED: 'USER_PASSWORD_CHANGED',
  USER_PASSWORD_RESET: 'USER_PASSWORD_RESET',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  
  // Tenant Actions
  TENANT_CREATED: 'TENANT_CREATED',
  TENANT_UPDATED: 'TENANT_UPDATED',
  TENANT_DELETED: 'TENANT_DELETED',
  TENANT_STATUS_CHANGED: 'TENANT_STATUS_CHANGED',
  
  // Project Actions
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_UPDATED: 'PROJECT_UPDATED',
  PROJECT_DELETED: 'PROJECT_DELETED',
  PROJECT_ARCHIVED: 'PROJECT_ARCHIVED',
  
  // Task Actions
  TASK_CREATED: 'TASK_CREATED',
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_DELETED: 'TASK_DELETED',
  TASK_STATUS_CHANGED: 'TASK_STATUS_CHANGED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  
  // Access Actions
  ACCESS_GRANTED: 'ACCESS_GRANTED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  ACCESS_REVOKED: 'ACCESS_REVOKED'
};

const AUDIT_ENTITY_TYPES = {
  USER: 'user',
  TENANT: 'tenant',
  PROJECT: 'project',
  TASK: 'task',
  SYSTEM: 'system'
};

// ============================================
// HTTP STATUS CODES
// ============================================

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

const HTTP_STATUS_MESSAGES = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable'
};

// ============================================
// ERROR MESSAGES
// ============================================

const ERROR_MESSAGES = {
  // Authentication Errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_INVALID: 'Invalid or expired token',
  TOKEN_REQUIRED: 'Access token is required',
  TOKEN_EXPIRED: 'Your session has expired. Please login again.',
  
  // Authorization Errors
  AUTH_REQUIRED: 'Authentication required',
  ACCESS_DENIED: 'Access denied',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
  
  // Resource Errors
  TENANT_NOT_FOUND: 'Tenant not found',
  USER_NOT_FOUND: 'User not found',
  PROJECT_NOT_FOUND: 'Project not found',
  TASK_NOT_FOUND: 'Task not found',
  
  // Validation Errors
  INVALID_REQUEST: 'Invalid request data',
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
  PASSWORD_MISMATCH: 'Passwords do not match',
  
  // Business Logic Errors
  SUBSCRIPTION_LIMIT_REACHED: 'You have reached your subscription limit',
  USER_LIMIT_REACHED: 'Maximum users limit reached for this plan',
  PROJECT_LIMIT_REACHED: 'Maximum projects limit reached for this plan',
  DUPLICATE_EMAIL: 'Email already exists',
  DUPLICATE_SUBDOMAIN: 'Subdomain already taken',
  
  // Status Errors
  USER_INACTIVE: 'User account is inactive',
  TENANT_INACTIVE: 'Tenant account is not active',
  TENANT_SUSPENDED: 'Tenant account is suspended',
  
  // Server Errors
  INTERNAL_ERROR: 'An internal error occurred',
  DATABASE_ERROR: 'Database error occurred',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable'
};

// ============================================
// SUCCESS MESSAGES
// ============================================

const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  REGISTRATION_SUCCESS: 'Registration successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  
  // CRUD Operations
  CREATED_SUCCESS: 'Created successfully',
  UPDATED_SUCCESS: 'Updated successfully',
  DELETED_SUCCESS: 'Deleted successfully',
  ARCHIVED_SUCCESS: 'Archived successfully',
  
  // User Management
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User information updated',
  USER_DELETED: 'User deleted successfully',
  USER_INVITED: 'User invited successfully',
  
  // Project Management
  PROJECT_CREATED: 'Project created successfully',
  PROJECT_UPDATED: 'Project updated successfully',
  PROJECT_DELETED: 'Project deleted successfully',
  
  // Task Management
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated successfully',
  TASK_DELETED: 'Task deleted successfully',
  TASK_ASSIGNED: 'Task assigned successfully'
};

// ============================================
// VALIDATION RULES
// ============================================

const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  SUBDOMAIN_REGEX: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
  PROJECT_NAME_MAX_LENGTH: 255,
  TASK_TITLE_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 1000,
  SUBDOMAIN_MIN_LENGTH: 3,
  SUBDOMAIN_MAX_LENGTH: 63
};

// ============================================
// JWT CONFIGURATION
// ============================================

const JWT_CONFIG = {
  ALGORITHM: 'HS256',
  EXPIRY: '24h',
  REFRESH_EXPIRY: '7d',
  SUBJECT_PREFIX: 'saas_'
};

// ============================================
// RATE LIMITING CONFIGURATION
// ============================================

const RATE_LIMIT_CONFIG = {
  GLOBAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000 // 2000 requests per window
  },
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per window
  },
  API: {
    windowMs: 60 * 1000, // 1 minute
    max: 500 // 500 requests per window
  }
};

// ============================================
// PAGINATION DEFAULTS
// ============================================

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_SORT_BY: 'created_at',
  DEFAULT_SORT_ORDER: 'DESC'
};

// ============================================
// DATE AND TIME
// ============================================

const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  ISO_TIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_TIME: 'MMM DD, YYYY HH:mm'
};

const TIME_UNITS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000
};

// ============================================
// FILE UPLOAD CONFIGURATION
// ============================================

const FILE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'],
  UPLOAD_DIR: 'uploads/',
  MAX_FILES_PER_UPLOAD: 5
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Roles and Permissions
  USER_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
  
  // Subscription
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_LIMITS,
  SUBSCRIPTION_DESCRIPTIONS,
  SUBSCRIPTION_PRICES,
  
  // Tenants
  TENANT_STATUS,
  TENANT_STATUS_DESCRIPTIONS,
  
  // Projects
  PROJECT_STATUS,
  PROJECT_STATUS_DESCRIPTIONS,
  PROJECT_VISIBILITY,
  
  // Tasks
  TASK_STATUS,
  TASK_STATUS_DESCRIPTIONS,
  TASK_PRIORITY,
  TASK_PRIORITY_DESCRIPTIONS,
  TASK_PRIORITY_LEVELS,
  
  // Audit
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  
  // HTTP
  HTTP_STATUS,
  HTTP_STATUS_MESSAGES,
  
  // Messages
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  
  // Validation
  VALIDATION_RULES,
  
  // Security
  JWT_CONFIG,
  RATE_LIMIT_CONFIG,
  
  // Utilities
  PAGINATION,
  DATE_FORMATS,
  TIME_UNITS,
  FILE_CONFIG
};
