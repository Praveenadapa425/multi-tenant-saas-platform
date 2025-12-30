const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Create a database pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'saas',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // Create super admin user if not exists
    const superAdminEmail = 'superadmin@system.com';
    const superAdminCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1', 
      [superAdminEmail]
    );

    if (superAdminCheck.rows.length === 0) {
      console.log('Creating super admin user...');
      
      const superAdminTenantId = uuidv4();
      const superAdminUserId = uuidv4();
      
      // Create super admin tenant
      await pool.query(`
        INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        superAdminTenantId,
        'System Admin',
        'system',
        'active',
        'enterprise',
        100,
        100
      ]);

      // Hash the super admin password
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      // Create super admin user
      await pool.query(`
        INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        superAdminUserId,
        superAdminTenantId,
        superAdminEmail,
        hashedPassword,
        'System',
        'Admin',
        'super_admin',
        'active'
      ]);

      console.log('Super admin user created successfully');
    } else {
      console.log('Super admin user already exists');
    }

    // Create a sample tenant with tenant admin if not exists
    const sampleTenantSubdomain = 'demo';
    const tenantCheck = await pool.query(
      'SELECT id FROM tenants WHERE subdomain = $1', 
      [sampleTenantSubdomain]
    );

    if (tenantCheck.rows.length === 0) {
      console.log('Creating sample tenant with tenant admin...');
      
      const tenantId = uuidv4();
      const tenantAdminId = uuidv4();
      
      // Create sample tenant
      await pool.query(`
        INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        tenantId,
        'Demo Tenant',
        sampleTenantSubdomain,
        'active',
        'pro',
        20,
        20
      ]);

      // Hash the tenant admin password
      const hashedPassword = await bcrypt.hash('Demo@123', 10);
      
      // Create tenant admin user
      await pool.query(`
        INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        tenantAdminId,
        tenantId,
        'admin@demo.com',
        hashedPassword,
        'Demo',
        'Admin',
        'tenant_admin',
        'active'
      ]);

      console.log('Sample tenant with admin created successfully');
    } else {
      console.log('Sample tenant already exists');
    }

    // Get the demo tenant ID to create sample data
    const demoTenantResult = await pool.query(
      'SELECT id FROM tenants WHERE subdomain = $1', 
      [sampleTenantSubdomain]
    );

    if (demoTenantResult.rows.length > 0) {
      const demoTenantId = demoTenantResult.rows[0].id;
      
      // Get tenant admin user ID
      const tenantAdminResult = await pool.query(
        'SELECT id FROM users WHERE tenant_id = $1 AND role = $2', 
        [demoTenantId, 'tenant_admin']
      );
      
      const tenantAdminId = tenantAdminResult.rows[0]?.id;

      // Create sample projects if not exist
      const projectCheck = await pool.query(
        'SELECT id FROM projects WHERE tenant_id = $1 LIMIT 1', 
        [demoTenantId]
      );

      if (projectCheck.rows.length === 0 && tenantAdminId) {
        console.log('Creating sample projects...');
        
        const project1Id = uuidv4();
        const project2Id = uuidv4();
        
        await pool.query(`
          INSERT INTO projects (id, tenant_id, user_id, name, description) 
          VALUES ($1, $2, $3, $4, $5)
        `, [
          project1Id,
          demoTenantId,
          tenantAdminId,
          'Website Redesign',
          'Redesign the company website with modern UI/UX'
        ]);

        await pool.query(`
          INSERT INTO projects (id, tenant_id, user_id, name, description) 
          VALUES ($1, $2, $3, $4, $5)
        `, [
          project2Id,
          demoTenantId,
          tenantAdminId,
          'Mobile App Development',
          'Develop a mobile application for customer engagement'
        ]);

        console.log('Sample projects created successfully');
      }

      // Get a project ID to create sample tasks
      const projectResult = await pool.query(
        'SELECT id FROM projects WHERE tenant_id = $1 LIMIT 1', 
        [demoTenantId]
      );

      if (projectResult.rows.length > 0) {
        const projectId = projectResult.rows[0].id;
        
        // Create sample users if not exist
        const userCheck = await pool.query(
          'SELECT id FROM users WHERE tenant_id = $1 AND role = $2 LIMIT 1', 
          [demoTenantId, 'user']
        );

        let userId = userCheck.rows[0]?.id;
        if (!userId) {
          console.log('Creating sample user...');
          const newUserId = uuidv4();
          
          const hashedPassword = await bcrypt.hash('User@123', 10);
          
          await pool.query(`
            INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            newUserId,
            demoTenantId,
            'user@demo.com',
            hashedPassword,
            'Demo',
            'User',
            'user',
            'active'
          ]);
          
          userId = newUserId;
          console.log('Sample user created successfully');
        }

        // Create sample tasks if not exist
        const taskCheck = await pool.query(
          'SELECT id FROM tasks WHERE project_id = $1 LIMIT 1', 
          [projectId]
        );

        if (taskCheck.rows.length === 0 && userId) {
          console.log('Creating sample tasks...');
          
          const task1Id = uuidv4();
          const task2Id = uuidv4();
          const task3Id = uuidv4();
          
          await pool.query(`
            INSERT INTO tasks (id, tenant_id, project_id, assigned_user_id, title, description, status, priority) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            task1Id,
            demoTenantId,
            projectId,
            userId,
            'Design Homepage',
            'Create mockup for the new homepage design',
            'in_progress',
            'high'
          ]);

          await pool.query(`
            INSERT INTO tasks (id, tenant_id, project_id, assigned_user_id, title, description, status, priority) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            task2Id,
            demoTenantId,
            projectId,
            userId,
            'Implement Login',
            'Build authentication system with JWT',
            'todo',
            'medium'
          ]);

          await pool.query(`
            INSERT INTO tasks (id, tenant_id, project_id, assigned_user_id, title, description, status, priority) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            task3Id,
            demoTenantId,
            projectId,
            userId,
            'Database Setup',
            'Configure PostgreSQL database schema',
            'done',
            'high'
          ]);

          console.log('Sample tasks created successfully');
        }
      }
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };