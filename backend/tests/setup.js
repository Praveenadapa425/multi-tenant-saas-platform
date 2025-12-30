// Setup for backend tests
process.env.NODE_ENV = 'test'; // Set test environment to prevent DB connection in config

const { Pool } = require('pg');
require('dotenv').config();

// Create a separate test database connection
// In CI environment, use 'localhost' as the host since PostgreSQL runs as a service
const testPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1', // Use IP address to avoid potential DNS issues in CI
  database: process.env.DB_NAME || 'saas_test',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Set the pool for tests
global.testPool = testPool;

// Clean up function
afterAll(async () => {
  await testPool.end();
});