require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { pool } = require('./config/database');
const logger = require('./utils/logger');
const {
  globalLimiter,
  authLimiter,
  registerLimiter,
  passwordResetLimiter,
  apiLimiter,
  uploadLimiter
} = require('./middleware/rateLimiter');

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

// Apply global rate limiting to all requests
app.use(globalLimiter);

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

// Auth routes with strict rate limiting
// - login: 5 attempts per 15 min (successful attempts not counted)
// - register-tenant: 3 attempts per 15 min
// - logout: standard auth rate limit
app.use('/api/auth/login', authLimiter, require('./routes/auth.routes'));
app.use('/api/auth/register-tenant', registerLimiter, require('./routes/auth.routes'));
app.use('/api/auth/reset-password', passwordResetLimiter, require('./routes/auth.routes'));
app.use('/api/auth', authLimiter, require('./routes/auth.routes'));

// API routes with standard rate limiting
app.use('/api/tenants', apiLimiter, require('./routes/tenants.routes'));
app.use('/api/users', apiLimiter, require('./routes/users.routes'));
app.use('/api/projects', apiLimiter, require('./routes/projects.routes'));
app.use('/api/tasks', apiLimiter, require('./routes/tasks.routes'));

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

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, { port: PORT });
});

module.exports = app;