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

```bash
docker-compose up -d
```

This will start all services:
- Database: PostgreSQL on port 5432
- Backend API: Node.js/Express on port 5000
- Frontend: React on port 3000

## Manual Setup

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

## Demo Video

[Link to YouTube demo video will be added here]
