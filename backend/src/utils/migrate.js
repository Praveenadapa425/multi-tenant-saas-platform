const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'saas_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Function to run a migration file
async function runMigration(client, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`Running migration: ${path.basename(filePath)}`);
  
  // Execute the entire SQL file content as a single query to handle functions with $$ delimiters properly
  try {
    await client.query(sql);
  } catch (error) {
    console.error(`Error executing ${path.basename(filePath)}:`, error.message);
    throw error;
  }
  
  console.log(`Completed migration: ${path.basename(filePath)}`);
}

// Main migration function
async function runMigrations() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Get migration files in order
    const migrationsDir = path.join(__dirname, '../../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // Check if tables already exist to avoid duplicate creation
    const { rows } = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants');"
    );
    
    if (rows[0].exists) {
      console.log('Tables already exist, skipping migrations');
      return;
    }
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Run each migration
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      await runMigration(client, filePath);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('All migrations completed successfully');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('Migration process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration process failed:', error);
    process.exit(1);
  });