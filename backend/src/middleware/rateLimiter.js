/**
 * Rate Limiting Middleware
 * Provides various rate limiting strategies for different endpoints
 */

const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_CONFIG } = require('../constants');
const logger = require('../utils/logger');

/**
 * Global rate limiter (applied to all routes)
 * 100 requests per 15 minutes per IP
 */
const globalLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.GLOBAL.windowMs,
  max: RATE_LIMIT_CONFIG.GLOBAL.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Auth endpoints rate limiter (strict)
 * 5 requests per 15 minutes per IP
 * Only counts failed attempts
 */
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.AUTH.windowMs,
  max: RATE_LIMIT_CONFIG.AUTH.max,
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req, res) => {
    // Use email as key for registration to prevent account enumeration
    if (req.path === '/register-tenant' && req.body?.adminEmail) {
      return req.body.adminEmail;
    }
    // Use email for login
    if (req.path === '/login' && req.body?.email) {
      return req.body.email;
    }
    // Fall back to IP
    return req.ip;
  },
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      identifier: req.body?.email || req.body?.adminEmail || req.ip
    });
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Register endpoint rate limiter (strict)
 * 3 requests per 15 minutes per IP
 * Prevents registration spam
 */
const registerLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.AUTH.windowMs,
  max: 3,
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Registration rate limit exceeded', {
      ip: req.ip,
      subdomain: req.body?.subdomain
    });
    res.status(429).json({
      success: false,
      message: 'Too many registration attempts. Please try again in 15 minutes.'
    });
  }
});

/**
 * Password reset rate limiter
 * 3 requests per 15 minutes per IP
 */
const passwordResetLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.AUTH.windowMs,
  max: 3,
  message: 'Too many password reset attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email
    });
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts. Please try again in 15 minutes.'
    });
  }
});

/**
 * API endpoints rate limiter
 * 30 requests per minute per IP
 * For regular API operations
 */
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.API.windowMs,
  max: RATE_LIMIT_CONFIG.API.max,
  message: 'Too many requests to this endpoint, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: req.user?.id
    });
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down.'
    });
  }
});

/**
 * Create rate limiter (POST/PUT operations)
 * 20 requests per minute per IP
 */
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Create rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.id
    });
    res.status(429).json({
      success: false,
      message: 'Too many creation requests. Please slow down.'
    });
  }
});

/**
 * Search/List rate limiter
 * 60 requests per minute per IP
 * More lenient for read operations
 */
const listLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Skip if not a GET request
    return req.method !== 'GET';
  }
});

/**
 * File upload rate limiter
 * 10 requests per 15 minutes per IP
 * Prevents storage abuse
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many file uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id
    });
    res.status(429).json({
      success: false,
      message: 'Upload limit exceeded. Please try again later.'
    });
  }
});

module.exports = {
  globalLimiter,
  authLimiter,
  registerLimiter,
  passwordResetLimiter,
  apiLimiter,
  createLimiter,
  listLimiter,
  uploadLimiter
};
