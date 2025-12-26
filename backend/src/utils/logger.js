/**
 * Structured Logger Utility
 * Provides consistent logging throughout the application
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Format log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 * @returns {string} - Formatted log message
 */
function formatLog(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data
  };
  return JSON.stringify(logEntry);
}

/**
 * Write log to file
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data
 */
function writeLog(level, message, data = {}) {
  const formatted = formatLog(level, message, data);
  const logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
  
  fs.appendFile(logFile, formatted + '\n', (err) => {
    if (err) console.error('Failed to write log:', err);
  });
}

/**
 * Log error
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object or data
 */
function error(message, error = {}) {
  const data = error instanceof Error ? { 
    errorMessage: error.message, 
    stack: error.stack 
  } : error;
  
  console.error(`[${LOG_LEVELS.ERROR}]`, message, data);
  writeLog(LOG_LEVELS.ERROR, message, data);
}

/**
 * Log warning
 * @param {string} message - Warning message
 * @param {Object} data - Additional data
 */
function warn(message, data = {}) {
  console.warn(`[${LOG_LEVELS.WARN}]`, message, data);
  writeLog(LOG_LEVELS.WARN, message, data);
}

/**
 * Log info
 * @param {string} message - Info message
 * @param {Object} data - Additional data
 */
function info(message, data = {}) {
  console.log(`[${LOG_LEVELS.INFO}]`, message, data);
  writeLog(LOG_LEVELS.INFO, message, data);
}

/**
 * Log debug (only in development)
 * @param {string} message - Debug message
 * @param {Object} data - Additional data
 */
function debug(message, data = {}) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[${LOG_LEVELS.DEBUG}]`, message, data);
    writeLog(LOG_LEVELS.DEBUG, message, data);
  }
}

module.exports = {
  error,
  warn,
  info,
  debug,
  LOG_LEVELS
};
