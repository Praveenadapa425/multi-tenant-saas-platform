// Setup for backend tests
process.env.NODE_ENV = 'test'; // Set test environment to prevent DB connection in config

// In test environment, we'll mock the database pool
// The actual pool will be mocked in individual test files

// Clean up function
afterAll(async () => {
  // Nothing to clean up as we're using mocked pool
});