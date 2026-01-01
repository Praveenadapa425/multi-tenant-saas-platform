require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { pool } = require('./config/database');
const logger = require('./utils/logger');

// Conditionally import rate limiters based on environment
let globalLimiter, authLimiter, registerLimiter, passwordResetLimiter, apiLimiter, uploadLimiter;
if (process.env.NODE_ENV !== 'test') {
  const rateLimiterModule = require('./middleware/rateLimiter');
  globalLimiter = rateLimiterModule.globalLimiter;
  authLimiter = rateLimiterModule.authLimiter;
  registerLimiter = rateLimiterModule.registerLimiter;
  passwordResetLimiter = rateLimiterModule.passwordResetLimiter;
  apiLimiter = rateLimiterModule.apiLimiter;
  uploadLimiter = rateLimiterModule.uploadLimiter;
}

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Docker environment
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Use combined format for production, dev format for development
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// Apply rate limiting based on environment
if (process.env.NODE_ENV !== 'test') {
  app.use(globalLimiter);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (no rate limiting)
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    // Return detailed health information in production
    const healthInfo = {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
    
    if (process.env.NODE_ENV !== 'production') {
      healthInfo.memoryUsage = process.memoryUsage();
    }
    
    res.status(200).json(healthInfo);
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// Auth routes with rate limiting based on environment
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/auth/login', authLimiter, require('./routes/auth.routes'));
  app.use('/api/auth/register-tenant', registerLimiter, require('./routes/auth.routes'));
  app.use('/api/auth/reset-password', passwordResetLimiter, require('./routes/auth.routes'));
  app.use('/api/auth', authLimiter, require('./routes/auth.routes'));
} else {
  app.use('/api/auth/login', require('./routes/auth.routes'));
  app.use('/api/auth/register-tenant', require('./routes/auth.routes'));
  app.use('/api/auth/reset-password', require('./routes/auth.routes'));
  app.use('/api/auth', require('./routes/auth.routes'));
}

// API routes with rate limiting based on environment
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/tenants', apiLimiter, require('./routes/tenants.routes'));
  app.use('/api/users', apiLimiter, require('./routes/users.routes'));
  app.use('/api/projects', apiLimiter, require('./routes/projects.routes'));
  app.use('/api/tasks', apiLimiter, require('./routes/tasks.routes'));
  app.use('/api/superadmin', apiLimiter, require('./routes/superadmin.routes'));
} else {
  app.use('/api/tenants', require('./routes/tenants.routes'));
  app.use('/api/users', require('./routes/users.routes'));
  app.use('/api/projects', require('./routes/projects.routes'));
  app.use('/api/tasks', require('./routes/tasks.routes'));
  app.use('/api/superadmin', require('./routes/superadmin.routes'));
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Only start server if not running in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, { port: PORT });
  });
}

module.exports = app;