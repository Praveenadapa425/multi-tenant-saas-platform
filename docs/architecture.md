# System Architecture

**Version**: 1.0
**Date**: December 22, 2025
**Author**: Multi-Tenant SaaS Team

## System Architecture Diagram

```
                    ┌─────────────────────────────┐
                    │         Browser             │
                    └────────────┬────────────────┘
                                 │
                    ┌────────────▼────────────────┐
                    │      Load Balancer          │
                    └────────────┬────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌─────────▼─────────┐
│   Frontend        │  │   Frontend        │  │   Frontend        │
│   (React)         │  │   (React)         │  │   (React)         │
└─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────────┐
                    │      API Gateway            │
                    └────────────┬────────────────┘
                                 │
                    ┌────────────▼────────────────┐
                    │      Load Balancer          │
                    └────────────┬────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌─────────▼─────────┐
│   Backend API     │  │   Backend API     │  │   Backend API     │
│   (Node.js)       │  │   (Node.js)       │  │   (Node.js)       │
└─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────────┐
                    │        PostgreSQL           │
                    │        (Database)           │
                    └─────────────────────────────┘
```

## Database Schema Design

### Entity Relationship Diagram (ERD)

```
┌─────────────────┐        ┌─────────────────┐
│    tenants      │        │     users       │
├─────────────────┤        ├─────────────────┤
│ id (PK)         │◄──────►│ tenant_id (FK)  │
│ name            │        │ id (PK)         │
│ subdomain       │        │ email           │
│ status          │        │ password_hash   │
│ subscription_plan│       │ full_name       │
│ max_users       │        │ role            │
│ max_projects    │        │ is_active       │
│ created_at      │        │ created_at      │
│ updated_at      │        │ updated_at      │
└─────────────────┘        └─────────────────┘
                                    │
                                    ▼
┌─────────────────┐        ┌─────────────────┐
│   projects      │        │   audit_logs    │
├─────────────────┤        ├─────────────────┤
│ id (PK)         │        │ id (PK)         │
│ tenant_id (FK)  │◄──────►│ tenant_id (FK)  │
│ name            │        │ user_id (FK)    │
│ description     │        │ action          │
│ status          │        │ entity_type     │
│ created_by (FK) │        │ entity_id       │
│ created_at      │        │ ip_address      │
│ updated_at      │        │ created_at      │
└─────────────────┘        └─────────────────┘
        │
        ▼
┌─────────────────┐
│     tasks       │
├─────────────────┤
│ id (PK)         │
│ project_id (FK) │
│ tenant_id (FK)  │
│ title           │
│ description     │
│ status          │
│ priority        │
│ assigned_to (FK)│
│ due_date        │
│ created_at      │
│ updated_at      │
└─────────────────┘
```

## API Architecture

### Authentication Module

| Endpoint | Method | Description | Authentication | Role |
|----------|--------|-------------|----------------|------|
| `/api/auth/register-tenant` | POST | Register a new tenant with admin user | None | Public |
| `/api/auth/login` | POST | User login with email, password, and tenant | None | Public |
| `/api/auth/me` | GET | Get current user information | Required | All |
| `/api/auth/logout` | POST | User logout | Required | All |

### Tenant Management Module

| Endpoint | Method | Description | Authentication | Role |
|----------|--------|-------------|----------------|------|
| `/api/tenants/:tenantId` | GET | Get tenant details | Required | Tenant Admin, Super Admin |
| `/api/tenants/:tenantId` | PUT | Update tenant information | Required | Tenant Admin, Super Admin |
| `/api/tenants` | GET | List all tenants | Required | Super Admin |

### User Management Module

| Endpoint | Method | Description | Authentication | Role |
|----------|--------|-------------|----------------|------|
| `/api/tenants/:tenantId/users` | POST | Add user to tenant | Required | Tenant Admin |
| `/api/tenants/:tenantId/users` | GET | List tenant users | Required | All |
| `/api/users/:userId` | PUT | Update user information | Required | User, Tenant Admin |
| `/api/users/:userId` | DELETE | Delete user | Required | Tenant Admin |

### Project Management Module

| Endpoint | Method | Description | Authentication | Role |
|----------|--------|-------------|----------------|------|
| `/api/projects` | POST | Create project | Required | All |
| `/api/projects` | GET | List projects | Required | All |
| `/api/projects/:projectId` | GET | Get project details | Required | All |
| `/api/projects/:projectId` | PUT | Update project | Required | Tenant Admin, Project Creator |
| `/api/projects/:projectId` | DELETE | Delete project | Required | Tenant Admin, Project Creator |

### Task Management Module

| Endpoint | Method | Description | Authentication | Role |
|----------|--------|-------------|----------------|------|
| `/api/projects/:projectId/tasks` | POST | Create task | Required | All |
| `/api/projects/:projectId/tasks` | GET | List project tasks | Required | All |
| `/api/tasks/:taskId/status` | PATCH | Update task status | Required | All |
| `/api/tasks/:taskId` | PUT | Update task | Required | All |
| `/api/tasks/:taskId` | DELETE | Delete task | Required | All |