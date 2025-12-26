/**
 * Input Sanitization Utility
 * Prevents XSS and injection attacks
 */

const xss = require('xss');
const sanitizeHtml = require('sanitize-html');

/**
 * Sanitize string input to prevent XSS attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  return xss(input, {
    whiteList: {},
    stripIgnoredTag: true,
    stripLeadingAndTrailingWhitespace: true
  });
}

/**
 * Sanitize HTML content
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
function sanitizeHTML(html) {
  if (typeof html !== 'string') {
    return html;
  }
  
  return sanitizeHtml(html, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: {
      'a': ['href', 'title']
    }
  });
}

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return email;
  }
  
  return email.toLowerCase().trim();
}

/**
 * Sanitize object by sanitizing all string values
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Sanitize array of objects
 * @param {Array} arr - Array to sanitize
 * @returns {Array} - Sanitized array
 */
function sanitizeArray(arr) {
  if (!Array.isArray(arr)) {
    return arr;
  }
  
  return arr.map(item => {
    if (typeof item === 'string') {
      return sanitizeString(item);
    } else if (typeof item === 'object' && item !== null) {
      return sanitizeObject(item);
    }
    return item;
  });
}

/**
 * Sanitize file name to prevent directory traversal
 * @param {string} filename - File name to sanitize
 * @returns {string} - Sanitized file name
 */
function sanitizeFileName(filename) {
  if (typeof filename !== 'string') {
    return filename;
  }
  
  // Remove path separators and dangerous characters
  return filename
    .replace(/[\/\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*]/g, '')
    .trim();
}

module.exports = {
  sanitizeString,
  sanitizeHTML,
  sanitizeEmail,
  sanitizeObject,
  sanitizeArray,
  sanitizeFileName
};
