# Multi-Tenant SaaS Platform - Backend

This is the backend API for the Multi-Tenant SaaS Platform built with Node.js and Express.

## Features

- JWT-based authentication
- Multi-tenancy with data isolation
- Role-based access control (Super Admin, Tenant Admin, User)
- Project and task management
- Subscription plan management
- Audit logging
- RESTful API design

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- JWT (JSON Web Tokens)
- Bcrypt
- Express Validator

## Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables (see .env.example)
5. Start the development server:
   ```bash
   npm run dev
   ```

Or for production:
```bash
npm start
```

The backend API will be available at http://localhost:5000

## Environment Variables

- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name (default: saas_db)
- `DB_USER`: Database user (default: postgres)
- `DB_PASSWORD`: Database password (default: postgres)
- `JWT_SECRET`: Secret key for JWT signing (required)
- `JWT_EXPIRES_IN`: JWT expiration time (default: 24h)
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (default: development)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:3000)

## API Endpoints

### Authentication
- `POST /api/auth/register-tenant` - Register a new tenant
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Tenants
- `GET /api/tenants/:tenantId` - Get tenant details
- `PUT /api/tenants/:tenantId` - Update tenant
- `GET /api/tenants` - List all tenants (Super Admin only)

### Users
- `POST /api/tenants/:tenantId/users` - Add user to tenant
- `GET /api/tenants/:tenantId/users` - List tenant users
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:projectId` - Get project details
- `PUT /api/projects/:projectId` - Update project
- `DELETE /api/projects/:projectId` - Delete project

### Tasks
- `POST /api/projects/:projectId/tasks` - Create task
- `GET /api/projects/:projectId/tasks` - List project tasks
- `PATCH /api/tasks/:taskId/status` - Update task status
- `PUT /api/tasks/:taskId` - Update task
- `DELETE /api/tasks/:taskId` - Delete task

## Folder Structure

```
src/
├── controllers/     # Request handlers
├── models/         # Database models
├── routes/         # API routes
├── middleware/     # Custom middleware
├── utils/          # Utility functions
├── config/         # Configuration files
└── server.js       # Main application entry point
```

## Database Migrations

Database migrations are located in the `migrations/` directory. Run migrations using your preferred PostgreSQL migration tool.

## Available Scripts

- `npm start`: Start the production server
- `npm run dev`: Start the development server with nodemon
- `npm test`: Run tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Run tests with coverage report
- `npm run migrate`: Run database migrations

## Testing

The backend uses Jest for unit and integration testing. To run the tests:

```bash
npm test                    # Run all tests once
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
npx jest                    # Direct Jest command
```

**Note for Windows users:** If you encounter issues with environment variables, use:

```bash
# For Windows systems
set NODE_ENV=test && npm test
# Or directly run
npx jest
```

### Test Results

All backend tests are currently passing:
- **72 tests** across 6 test suites (health, tenants, projects, tasks, users, auth)
- All CRUD operations properly tested
- All authentication and authorization flows verified
- All multi-tenancy isolation checks passing

## Production Deployment

When deploying to production:

1. Ensure all environment variables are properly set
2. Use a strong JWT secret (at least 32 characters)
3. Change default database credentials
4. Enable SSL for database connections if required
5. Review and adjust database connection pool settings based on expected load

## License

This project is licensed under the MIT License.