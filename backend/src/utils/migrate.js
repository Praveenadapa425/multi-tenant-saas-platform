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
  
  // Split SQL into individual statements (handle multiple statements in one file)
  const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
  
  for (const statement of statements) {
    if (statement.trim() !== '') {
      try {
        await client.query(statement);
      } catch (error) {
        console.error(`Error executing statement in ${path.basename(filePath)}:`, error.message);
        throw error;
      }
    }
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