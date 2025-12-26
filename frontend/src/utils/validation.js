/**
 * Form Validation Utilities
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateEmail(email) {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true, error: '' };
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, error: string, strength: number }
 */
export function validatePassword(password) {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required', strength: 0 };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long', strength: 1 };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  let strength = 0;
  if (hasUpperCase) strength++;
  if (hasLowerCase) strength++;
  if (hasNumbers) strength++;
  if (hasSpecialChar) strength++;

  if (hasUpperCase && hasLowerCase && hasNumbers) {
    return { isValid: true, error: '', strength };
  }

  return {
    isValid: false,
    error: 'Password must contain uppercase, lowercase, and numbers',
    strength
  };
}

/**
 * Validate full name
 * @param {string} name - Name to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateName(name) {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (name.trim().length > 100) {
    return { isValid: false, error: 'Name must be less than 100 characters' };
  }

  return { isValid: true, error: '' };
}

/**
 * Validate subdomain
 * @param {string} subdomain - Subdomain to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateSubdomain(subdomain) {
  if (!subdomain || subdomain.trim() === '') {
    return { isValid: false, error: 'Subdomain is required' };
  }

  const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  if (!subdomainRegex.test(subdomain)) {
    return {
      isValid: false,
      error: 'Subdomain must start with lowercase letter or number, contain only lowercase letters, numbers, and hyphens'
    };
  }

  if (subdomain.length < 3 || subdomain.length > 63) {
    return { isValid: false, error: 'Subdomain must be between 3 and 63 characters' };
  }

  return { isValid: true, error: '' };
}

/**
 * Validate project name
 * @param {string} name - Project name to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateProjectName(name) {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Project name is required' };
  }

  if (name.trim().length > 255) {
    return { isValid: false, error: 'Project name must be less than 255 characters' };
  }

  return { isValid: true, error: '' };
}

/**
 * Validate task title
 * @param {string} title - Task title to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateTaskTitle(title) {
  if (!title || title.trim() === '') {
    return { isValid: false, error: 'Task title is required' };
  }

  if (title.trim().length > 255) {
    return { isValid: false, error: 'Task title must be less than 255 characters' };
  }

  return { isValid: true, error: '' };
}

/**
 * Validate description
 * @param {string} description - Description to validate
 * @param {number} maxLength - Maximum length (default 1000)
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateDescription(description, maxLength = 1000) {
  if (description && description.length > maxLength) {
    return { isValid: false, error: `Description must be less than ${maxLength} characters` };
  }

  return { isValid: true, error: '' };
}

/**
 * Validate date format
 * @param {string} date - Date to validate (ISO format)
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateDate(date) {
  if (!date) {
    return { isValid: true, error: '' }; // Date is optional
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { isValid: false, error: 'Please enter a valid date (YYYY-MM-DD)' };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Please enter a valid date' };
  }

  return { isValid: true, error: '' };
}

/**
 * Validate select input
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateSelect(value, fieldName = 'This field') {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true, error: '' };
}

/**
 * Sanitize input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}
