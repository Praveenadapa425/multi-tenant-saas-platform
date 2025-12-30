// Setup for backend tests
const { Pool } = require('pg');
require('dotenv').config();

// Create a separate test database connection
const testPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
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