const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Create a new pool instance
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'saas_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: process.env.NODE_ENV === 'production' ? 30 : 20, // Increase pool size in production
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  // Enable SSL in production if required
  ssl: process.env.DB_SSL_MODE === 'require' ? { rejectUnauthorized: false } : false
});

// Test the database connection only in non-test environments
if (process.env.NODE_ENV !== 'test') {
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Database connection error:', err.stack);
    } else {
      console.log('Database connected successfully');
    }
  });
}

module.exports = {
  pool,
};