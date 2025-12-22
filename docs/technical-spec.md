# Technical Specification

## Project Structure

### Backend Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers for each module
│   │   ├── auth.controller.js
│   │   ├── tenant.controller.js
│   │   ├── user.controller.js
│   │   ├── project.controller.js
│   │   └── task.controller.js
│   ├── models/         # Database models and queries
│   │   ├── tenant.model.js
│   │   ├── user.model.js
│   │   ├── project.model.js
│   │   └── task.model.js
│   ├── routes/         # API route definitions
│   │   ├── auth.routes.js
│   │   ├── tenants.routes.js
│   │   ├── users.routes.js
│   │   ├── projects.routes.js
│   │   └── tasks.routes.js
│   ├── middleware/     # Custom middleware functions
│   │   ├── auth.middleware.js
│   │   └── validation.middleware.js
│   ├── utils/          # Utility functions
│   │   ├── password.js
│   │   ├── jwt.js
│   │   └── auditLogger.js
│   ├── config/         # Configuration files
│   │   └── database.js
│   └── server.js       # Main application entry point
├── migrations/         # Database migration files
│   ├── 001_create_tenants_table.sql
│   ├── 002_create_users_table.sql
│   ├── 003_create_projects_table.sql
│   ├── 004_create_tasks_table.sql
│   ├── 005_create_audit_logs_table.sql
│   └── 006_seed_data.sql
├── tests/              # Test files
├── Dockerfile          # Docker configuration for backend
├── healthcheck.js      # Health check script
├── package.json        # Node.js dependencies and scripts
├── .env.example        # Environment variable template
└── .env                # Environment variables (development)
```

### Frontend Structure

```
frontend/
├── public/             # Static assets
│   ├── index.html      # Main HTML file
│   └── favicon.ico     # Application icon
├── src/                # React application source code
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API service functions
│   ├── utils/          # Utility functions
│   ├── hooks/          # Custom React hooks
│   ├── context/        # React context providers
│   ├── assets/         # Images, styles, etc.
│   ├── App.js          # Main application component
│   └── index.js        # Application entry point
├── Dockerfile          # Docker configuration for frontend
├── package.json        # Frontend dependencies and scripts
└── .env                # Environment variables
```

### Database Structure

```
database/
├── migrations/         # Database migration files (mirror of backend/migrations)
└── diagrams/           # Database diagrams and documentation
```

### Documentation Structure

```
docs/
├── research.md         # Multi-tenancy analysis and technology justification
├── PRD.md              # Product Requirements Document
├── architecture.md     # System architecture and database design
├── technical-spec.md   # Technical specifications and project structure
├── API.md              # API documentation
├── images/             # Documentation images
│   ├── system-architecture.png
│   └── database-erd.png
└── diagrams/           # Additional diagrams
```

## Development Setup Guide

### Prerequisites

- Node.js v18.x or higher
- npm v8.x or higher
- Docker and Docker Compose
- PostgreSQL v13 or higher (for local development)
- Git

### Environment Variables

#### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=my_secret_key_for_development_only_do_not_use_in_production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

#### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd multi-tenant-saas-platform
   ```

2. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up the database**:
   - Install PostgreSQL locally or use Docker
   - Create a database named `saas_db`
   - Update the `.env` file with your database credentials

5. **Run database migrations**:
   ```bash
   cd ../backend
   # Run migrations manually or use a migration tool
   ```

### How to Run Locally

#### Running the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Start the backend server:
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. The backend will be available at `http://localhost:5000`

#### Running the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Start the frontend development server:
   ```bash
   npm start
   ```

3. The frontend will be available at `http://localhost:3000`

### How to Run Tests

#### Backend Tests

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run all tests:
   ```bash
   npm test
   ```

3. Run tests with coverage:
   ```bash
   npm run test:coverage
   ```

#### Frontend Tests

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Run all tests:
   ```bash
   npm test
   ```

3. Run tests with coverage:
   ```bash
   npm run test:coverage
   ```

### Docker Setup Instructions

#### Building and Running with Docker Compose

1. Ensure Docker and Docker Compose are installed on your system.

2. From the project root directory, run:
   ```bash
   docker-compose up -d
   ```

3. This will start all services:
   - Database: PostgreSQL on port 5432
   - Backend API: Node.js/Express on port 5000
   - Frontend: React on port 3000

4. Access the services:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:5432 (direct access)

#### Stopping Services

To stop all services:
```bash
docker-compose down
```

To stop services and remove volumes (including database data):
```bash
docker-compose down -v
```

#### Viewing Logs

To view logs for all services:
```bash
docker-compose logs
```

To view logs for a specific service:
```bash
docker-compose logs backend
```

### Database Migrations

Database migrations are automatically run when the backend service starts in Docker. For manual migration:

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run migrations:
   ```bash
   npm run migrate
   ```

### Seed Data

Seed data is automatically loaded when the backend service starts in Docker. The seed data includes:

- Super Admin user
- Demo tenant with admin and regular users
- Sample projects and tasks

Credentials for seed data are documented in `submission.json`.