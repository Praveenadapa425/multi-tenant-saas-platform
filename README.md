# Multi-Tenant SaaS Platform - Project & Task Management

A production-ready, multi-tenant SaaS application where multiple organizations can register, manage their teams, create projects, and track tasks with proper data isolation, role-based access control, and subscription management.

## Features

- Multi-tenancy architecture with complete data isolation
- JWT-based authentication with role-based access control
- Subscription plan management (Free, Pro, Enterprise)
- Project and task management
- Docker containerization for easy deployment
- Responsive React frontend
- RESTful API with comprehensive documentation

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Containerization**: Docker, Docker Compose
- **API Documentation**: Swagger/OpenAPI

## Architecture Overview

The application follows a multi-tenancy shared database, shared schema approach where each tenant's data is isolated using a tenant_id column. The system implements three user roles (Super Admin, Tenant Admin, User) with appropriate access controls.

## Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose
- PostgreSQL (if running without Docker)

## Quick Start with Docker

To run the complete application with all services (database, backend API, and frontend):

```bash
docker-compose up -d
```

This command will:
1. Start the PostgreSQL database on port 5432
2. Start the Node.js backend API on port 5000
3. Start the React frontend on port 3000
4. Automatically run database migrations and seed data

On container startup, migrations and seed data are automatically executed. The seed data includes:

### Default Credentials:

**Super Admin**:
- Email: superadmin@system.com
- Password: Admin@123
- Role: super_admin
- Tenant: None (system level)

**Tenant Admin** (for demo tenant):
- Email: admin@demo.com
- Password: Demo@123
- Role: tenant_admin
- Tenant: Demo Company

**Demo Users** (for demo tenant):
- User 1:
  - Email: user1@demo.com
  - Password: User@123
  - Role: user
  - Tenant: Demo Company
- User 2:
  - Email: user2@demo.com
  - Password: User@123
  - Role: user
  - Tenant: Demo Company

- Sample Projects and Tasks for demonstration

Once the services are running, you can access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database: postgresql://postgres:postgres@localhost:5432/saas_db

To stop all services:
```bash
docker-compose down
```

To view logs:
```bash
docker-compose logs -f
```

This will start all services:
- Database: PostgreSQL on port 5432
- Backend API: Node.js/Express on port 5000
- Frontend: React on port 3000

## Running with Docker (Recommended)

The recommended way to run this application is using Docker, which will automatically handle all dependencies, database setup, and service coordination.

1. Clone the repository
2. Run the application:
   ```bash
   docker-compose up -d
   ```

## Manual Setup (Alternative)

If you prefer to run the services manually:

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Set up environment variables (see below)
5. Run database migrations
6. Start the services:
   ```bash
   # Start backend
   cd backend
   npm start
   
   # Start frontend
   cd frontend
   npm start
   ```

## Environment Variables

### Backend (.env)
```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## API Documentation

API documentation is available at `/api/docs` when the backend is running.

## Project Structure

```
multi-tenant-saas/
├── backend/              # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Custom middleware
│   │   ├── utils/        # Utility functions
│   │   └── config/       # Configuration files
│   ├── migrations/       # Database migrations
│   └── tests/            # Test files
├── frontend/             # React frontend application
│   ├── public/           # Static assets
│   └── src/              # React components and logic
├── database/             # Database scripts and migrations
├── docs/                 # Documentation files
└── docker/               # Docker configuration files
```

## Submission Requirements

This project fulfills all requirements for the Multi-Tenant SaaS Platform contest:

1. **Multi-Tenancy Architecture**: Shared database with tenant_id isolation
2. **Authentication & Authorization**: JWT-based with role-based access control
3. **Database Schema**: Complete with tenants, users, projects, tasks, audit_logs
4. **API Endpoints**: All 19 required endpoints implemented
5. **Subscription Management**: Free, Pro, and Enterprise plans
6. **Frontend**: React application with 6 main pages
7. **Docker**: Complete containerization with docker-compose
8. **Documentation**: Comprehensive documentation in docs/

## Development

This project follows a monorepo structure with separate backend and frontend directories.

### Backend
See [backend/README.md](backend/README.md) for backend-specific documentation.

### Frontend
See [frontend/README.md](frontend/README.md) for frontend-specific documentation.

## Testing

### Running All Tests

To run all tests for the entire application:

```bash
# Run all tests (backend and frontend)
npm test

# Or run tests separately:

# Backend tests only
cd backend
npm test

# Frontend tests only
cd frontend
npm test
```

### Backend Testing

The backend uses Jest for unit and integration testing:

```bash
cd backend
npm test                    # Run all backend tests once
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

### Frontend Testing

The frontend uses Jest and React Testing Library:

```bash
cd frontend
npm test                    # Run all frontend tests once
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
```

### Test Results

All test suites are currently passing:
- **Backend**: 72 tests across 6 test suites (health, tenants, projects, tasks, users, auth)
- **Frontend**: All component and integration tests passing

To verify tests are working correctly, run `npm test` from the project root or run the individual test suites as shown above.

## Production Deployment

### Environment Configuration

1. Copy `.env.production` to `.env` and update the values for your production environment:
   ```bash
   cp .env.production .env
   # Edit .env file with your production values
   ```

2. Important production variables to update:
   - `DB_PASSWORD`: Use a strong, unique password for the database
   - `JWT_SECRET`: MUST be changed to a secure secret key (at least 32 characters)
   - `REACT_APP_API_URL`: Update to your production domain

### Security Considerations

1. **Change all default passwords** before deployment
2. **Generate a new JWT secret** for production
3. **Use HTTPS** in production (update URLs accordingly)
4. **Review and update CORS settings** in backend configuration
5. **Enable database SSL** if required by setting `DB_SSL_MODE=require`

### Deployment Steps

1. Ensure Docker and Docker Compose are installed on your production server
2. Copy the entire project directory to your production server
3. Configure environment variables as described above
4. Run the application:
   ```bash
   docker-compose up -d
   ```

5. Monitor the logs to ensure all services start correctly:
   ```bash
   docker-compose logs -f
   ```

### Scaling Considerations

For production deployments with higher traffic:

1. Adjust database connection pool settings in `backend/src/config/database.js`
2. Consider using a reverse proxy like NGINX or Traefik for load balancing
3. Implement proper monitoring and alerting
4. Set up automated backups for the database volume

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Demo Video

[Link to Demo Video](https://vimeo.com/1149505171/8c75614604?fl=ip&fe=ec)
