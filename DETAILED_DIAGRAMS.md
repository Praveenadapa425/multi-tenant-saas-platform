# 📊 Improved Diagrams - Database ERD & System Architecture

## 1️⃣ Enhanced Database Entity-Relationship Diagram (ERD)

### Complete Multi-Tenant Database Schema

```
╔════════════════════════════════════════════════════════════════════════════╗
║                    MULTI-TENANT SAAS DATABASE SCHEMA                      ║
╚════════════════════════════════════════════════════════════════════════════╝

┏━━━━━━━━━━━━━━━━━━━━━┓
┃   📦 TENANTS       ┃
┃  (Organizations)   ┃
┣━━━━━━━━━━━━━━━━━━━━━┫
┃ PK: id (UUID)      ┃
┃ • name             ┃◄─────────────────────┐
┃ • subdomain        ┃                      │
┃ • status           ┃                      │
┃ • subscription_plan┃                      │
┃ • max_users        ┃                      │ One-to-Many
┃ • max_projects     ┃                      │ 
┃ • created_at       ┃                      │
┃ • updated_at       ┃                      │
┗━━━━━━━━━━━━━━━━━━━━━┛                      │
         ▲                                   │
         │                                   │
    1:Many                                   ▼
         │                   ┏━━━━━━━━━━━━━━━━━━━━━┓
         │                   ┃   👥 USERS         ┃
         │                   ┃  (Team Members)    ┃
         │                   ┣━━━━━━━━━━━━━━━━━━━━━┫
         │                   ┃ PK: id (UUID)      ┃
         │                   ┃ FK: tenant_id      ┃◄──┐
         │                   ┃ • email (UNIQUE)   ┃   │
         │                   ┃ • password_hash    ┃   │
         │                   ┃ • full_name        ┃   │
         │                   ┃ • role             ┃   │
         │                   ┃ • is_active        ┃   │
         │                   ┃ • last_login_at    ┃   │
         │                   ┃ • created_at       ┃   │
         │                   ┃ • updated_at       ┃   │
         │                   ┗━━━━━━━━━━━━━━━━━━━━━┛   │
         │                                            │
         │                                     assigned_to/
         │                                    created_by (FK)
         │                                            │
         └────────────────────┬─────────────────────┘
                              │
                         1:Many│
                              │
        ┏━━━━━━━━━━━━━━━━━━━━━▼━━┓
        ┃   🗂️ PROJECTS        ┃
        ┃  (Organization Work) ┃
        ┣━━━━━━━━━━━━━━━━━━━━━━━┫
        ┃ PK: id (UUID)         ┃
        ┃ FK: tenant_id         ┃───────┐
        ┃ FK: created_by        ┃       │
        ┃ • name                ┃       │
        ┃ • description         ┃       │ 1:Many
        ┃ • status              ┃       │
        ┃ • start_date          ┃       │
        ┃ • end_date            ┃       │
        ┃ • created_at          ┃       │
        ┃ • updated_at          ┃       │
        ┗━━━━━━━━━━━━━━━━━━━━━━━┛       │
                 │                       │
                 │ 1:Many                │
                 │                       │
        ┏━━━━━━━━▼━━━━━━━━━━┓          │
        ┃  ✓ TASKS          ┃          │
        ┃ (Work Items)      ┃          │
        ┣━━━━━━━━━━━━━━━━━━┫          │
        ┃ PK: id (UUID)     ┃          │
        ┃ FK: project_id    ┃          │
        ┃ FK: tenant_id     ┃◄─────────┘
        ┃ FK: assigned_to   ┃───────┐
        ┃ • title           ┃       │
        ┃ • description     ┃       │ Assigned to User
        ┃ • status          ┃       │
        ┃ • priority        ┃       │
        ┃ • due_date        ┃       │
        ┃ • completion_%    ┃       │
        ┃ • created_at      ┃       │
        ┃ • updated_at      ┃       │
        ┗━━━━━━━━━━━━━━━━━━┛       │
                                   │
                          ┌────────┘
                          │
                          ▼
        ┏━━━━━━━━━━━━━━━━━━━━━┓
        ┃  📋 AUDIT_LOGS      ┃
        ┃ (Activity History)  ┃
        ┣━━━━━━━━━━━━━━━━━━━━━┫
        ┃ PK: id (UUID)       ┃
        ┃ FK: tenant_id       ┃───────┐
        ┃ FK: user_id         ┃       │
        ┃ • action            ┃       │ Tenant & User
        ┃ • entity_type       ┃       │ Association
        ┃ • entity_id         ┃       │
        ┃ • changes (JSON)    ┃       │
        ┃ • ip_address        ┃       │
        ┃ • user_agent        ┃       │
        ┃ • created_at        ┃       │
        ┗━━━━━━━━━━━━━━━━━━━━━┛       │
                 ▲                    │
                 │                    │
                 └────────────────────┘


╔════════════════════════════════════════════════════════════════════════════╗
║                         RELATIONSHIP SUMMARY                              ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  • 1 Tenant : Many Users (Organization has multiple team members)        ║
║  • 1 Tenant : Many Projects (Organization can have multiple projects)   ║
║  • 1 Tenant : Many Tasks (All tenant tasks across projects)             ║
║  • 1 Tenant : Many AuditLogs (Track all tenant activity)                ║
║  • 1 Project : Many Tasks (Project contains multiple tasks)             ║
║  • 1 User : Many Tasks (User assigned to multiple tasks)                ║
║  • 1 User : Many AuditLogs (Track user actions)                         ║
║                                                                            ║
║  KEY FEATURE: All tables include tenant_id for complete data isolation   ║
║               enabling secure multi-tenancy at the database layer        ║
╚════════════════════════════════════════════════════════════════════════════╝
```

### Field Specifications by Table

#### 📦 TENANTS Table
```
Field               Type        Constraints         Description
─────────────────────────────────────────────────────────────────
id                  UUID        PRIMARY KEY         Unique tenant ID
name                VARCHAR     NOT NULL, UNIQUE    Organization name
subdomain           VARCHAR     NOT NULL, UNIQUE    URL subdomain
status              ENUM        NOT NULL            active/inactive
subscription_plan   VARCHAR     NOT NULL            free/pro/enterprise
max_users           INT         NOT NULL            User limit
max_projects        INT         NOT NULL            Project limit
created_at          TIMESTAMP   NOT NULL            Creation date
updated_at          TIMESTAMP   NOT NULL            Last update
```

#### 👥 USERS Table
```
Field               Type        Constraints         Description
─────────────────────────────────────────────────────────────────
id                  UUID        PRIMARY KEY         Unique user ID
tenant_id           UUID        FOREIGN KEY         Tenant reference
email               VARCHAR     NOT NULL, UNIQUE    Email address
password_hash       VARCHAR     NOT NULL            Encrypted password
full_name           VARCHAR     NOT NULL            User's full name
role                ENUM        NOT NULL            super_admin/admin/user
is_active           BOOLEAN     DEFAULT true        Account status
last_login_at       TIMESTAMP   NULLABLE            Last login time
created_at          TIMESTAMP   NOT NULL            Account creation
updated_at          TIMESTAMP   NOT NULL            Last update
```

#### 🗂️ PROJECTS Table
```
Field               Type        Constraints         Description
─────────────────────────────────────────────────────────────────
id                  UUID        PRIMARY KEY         Unique project ID
tenant_id           UUID        FOREIGN KEY         Tenant reference
created_by          UUID        FOREIGN KEY         User reference
name                VARCHAR     NOT NULL            Project name
description         TEXT        NULLABLE            Project details
status              ENUM        NOT NULL            planning/active/completed
start_date          DATE        NULLABLE            Project start
end_date            DATE        NULLABLE            Project end
created_at          TIMESTAMP   NOT NULL            Creation date
updated_at          TIMESTAMP   NOT NULL            Last update
```

#### ✓ TASKS Table
```
Field               Type        Constraints         Description
─────────────────────────────────────────────────────────────────
id                  UUID        PRIMARY KEY         Unique task ID
project_id          UUID        FOREIGN KEY         Project reference
tenant_id           UUID        FOREIGN KEY         Tenant reference
assigned_to         UUID        FOREIGN KEY         User reference
title               VARCHAR     NOT NULL            Task title
description         TEXT        NULLABLE            Task details
status              ENUM        NOT NULL            todo/in_progress/done
priority            ENUM        NOT NULL            low/medium/high/urgent
due_date            DATE        NULLABLE            Task deadline
completion_%        INT         DEFAULT 0           Progress (0-100)
created_at          TIMESTAMP   NOT NULL            Creation date
updated_at          TIMESTAMP   NOT NULL            Last update
```

#### 📋 AUDIT_LOGS Table
```
Field               Type        Constraints         Description
─────────────────────────────────────────────────────────────────
id                  UUID        PRIMARY KEY         Unique log ID
tenant_id           UUID        FOREIGN KEY         Tenant reference
user_id             UUID        FOREIGN KEY         User reference
action              VARCHAR     NOT NULL            Action type
entity_type         VARCHAR     NOT NULL            Entity being modified
entity_id           UUID        NULLABLE            Entity ID
changes             JSONB       NULLABLE            Change details
ip_address          VARCHAR     NULLABLE            Client IP
user_agent          TEXT        NULLABLE            Browser info
created_at          TIMESTAMP   NOT NULL            Log timestamp
```

---

## 2️⃣ Enhanced System Architecture Diagram

### Complete Three-Tier Architecture

```
╔════════════════════════════════════════════════════════════════════════════╗
║            MULTI-TENANT SAAS PLATFORM - SYSTEM ARCHITECTURE               ║
╚════════════════════════════════════════════════════════════════════════════╝


                           ┏━━━━━━━━━━━━━━━━━━━━━━━━┓
                           ┃   🌍 INTERNET / DNS   ┃
                           ┗━━━━━━━━━┬━━━━━━━━━━━━┛
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
         ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
         │  Client Browser │ │  Mobile App  │ │ API Consumer │
         │ (React App)     │ │  (iOS/And)   │ │  (Third-party)│
         └────────┬────────┘ └───────┬──────┘ └───────┬──────┘
                  │                  │                │
                  └──────────────────┼────────────────┘
                                     │
                                     │ HTTPS/TLS
                                     │
                    ┌────────────────▼────────────────┐
                    │   🔐 LOAD BALANCER (LB)        │
                    │   • SSL/TLS Termination         │
                    │   • Request Distribution        │
                    │   • Rate Limiting               │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
          ┌─────────▼────────┐ ┌─────▼────────┐ ┌───▼─────────┐
          │  API SERVER #1   │ │ API SERVER#2 │ │ API SERVER#3│
          │  (Node.js/Exp)   │ │ (Node.js/Exp)│ │(Node.js/Exp)│
          ├──────────────────┤ ├──────────────┤ ├─────────────┤
          │ • Routes         │ │ • Routes     │ │ • Routes    │
          │ • Controllers    │ │ • Controllers│ │ • Controllers
          │ • Middleware     │ │ • Middleware │ │ • Middleware│
          │ • Services       │ │ • Services   │ │ • Services  │
          │ • Auth Logic     │ │ • Auth Logic │ │ • Auth Logic│
          └────────┬─────────┘ └──────┬───────┘ └─────┬──────┘
                   │                  │                │
                   │ Connection Pool  │ Connection Pool│
                   │                  │                │
                   └──────────────────┼────────────────┘
                                      │
                           ┌──────────▼─────────┐
                           │ 📊 CONNECTION POOL │
                           │ (Max Connections)  │
                           └──────────┬─────────┘
                                      │
                           ┌──────────▼─────────────┐
                           │ 🗄️ DATABASE CLUSTER  │
                           │ PostgreSQL 15         │
                           ├───────────────────────┤
                           │ PRIMARY (Write)       │
                           │ • Tenants             │
                           │ • Users               │
                           │ • Projects            │
                           │ • Tasks               │
                           │ • Audit Logs          │
                           └───────┬───────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
         ┌──────▼──────┐    ┌──────▼──────┐   ┌──────▼──────┐
         │ REPLICA #1  │    │ REPLICA #2  │   │ REPLICA #3  │
         │ (Read-only) │    │ (Read-only) │   │ (Read-only) │
         └─────────────┘    └─────────────┘   └─────────────┘
                (Replication - Streaming)


╔════════════════════════════════════════════════════════════════════════════╗
║                        FRONTEND LAYER DETAIL                              ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  React 18.2 Single Page Application (SPA)                                 ║
║  ├─ Pages (7 total)                                                       ║
║  │  ├─ Home.js              - Landing page & intro                       ║
║  │  ├─ Login.js             - User authentication                        ║
║  │  ├─ Register.js          - Organization registration                 ║
║  │  ├─ Dashboard.js         - Analytics & overview                      ║
║  │  ├─ Projects.js          - Project listing & management              ║
║  │  ├─ ProjectDetails.js    - Project + tasks view                     ║
║  │  └─ Users.js             - Team member management                   ║
║  │                                                                        ║
║  ├─ Components (Reusable)                                                ║
║  │  ├─ Navigation          - Header & user menu                        ║
║  │  ├─ ProtectedRoute      - Route authentication wrapper              ║
║  │  └─ ErrorBoundary       - Error handling component                  ║
║  │                                                                        ║
║  ├─ Services (API Layer)                                                 ║
║  │  ├─ api.js              - Axios base configuration                  ║
║  │  ├─ authService.js      - Auth API calls                            ║
║  │  ├─ projectService.js   - Project API calls                         ║
║  │  ├─ taskService.js      - Task API calls                            ║
║  │  └─ userService.js      - User API calls                            ║
║  │                                                                        ║
║  ├─ Context (State)                                                      ║
║  │  └─ AuthContext.js      - Global auth state                         ║
║  │                                                                        ║
║  └─ Styling (Responsive)                                                 ║
║     ├─ Navigation.css      - Header styles                             ║
║     ├─ Auth.css            - Login/Register styles                     ║
║     ├─ Home.css            - Home page styles                          ║
║     ├─ Dashboard.css       - Dashboard styles                          ║
║     ├─ Projects.css        - Projects list styles                      ║
║     ├─ ProjectDetails.css  - Detail view styles                        ║
║     ├─ Users.css           - Users page styles                         ║
║     └─ App.css             - Global styles                             ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝


╔════════════════════════════════════════════════════════════════════════════╗
║                         BACKEND API LAYER                                  ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  Express.js RESTful API (19 Endpoints)                                    ║
║                                                                            ║
║  🔐 AUTH Routes (/api/auth) - 4 endpoints                                 ║
║  ├─ POST /register-tenant   - Register new organization                 ║
║  ├─ POST /login             - User authentication                       ║
║  ├─ GET /me                 - Get current user                          ║
║  └─ POST /logout            - User logout                               ║
║                                                                            ║
║  🏢 TENANT Routes (/api/tenants) - 4 endpoints                            ║
║  ├─ GET /                   - List all tenants                          ║
║  ├─ GET /:id                - Get tenant details                        ║
║  ├─ PUT /:id                - Update tenant                             ║
║  └─ DELETE /:id             - Delete tenant                             ║
║                                                                            ║
║  👥 USER Routes (/api/users) - 5 endpoints                                ║
║  ├─ POST /                  - Create new user                           ║
║  ├─ GET /                   - List tenant users                         ║
║  ├─ GET /:id                - Get user details                          ║
║  ├─ PUT /:id                - Update user                               ║
║  └─ DELETE /:id             - Delete user                               ║
║                                                                            ║
║  📂 PROJECT Routes (/api/projects) - 5 endpoints                          ║
║  ├─ POST /                  - Create project                            ║
║  ├─ GET /                   - List tenant projects                      ║
║  ├─ GET /:id                - Get project details                       ║
║  ├─ PUT /:id                - Update project                            ║
║  └─ DELETE /:id             - Delete project                            ║
║                                                                            ║
║  ✓ TASK Routes (/api/tasks) - 5 endpoints                                 ║
║  ├─ POST /                  - Create task                               ║
║  ├─ GET /                   - List tenant tasks                         ║
║  ├─ GET /:id                - Get task details                          ║
║  ├─ PUT /:id                - Update task                               ║
║  └─ DELETE /:id             - Delete task                               ║
║                                                                            ║
║  ❤️ HEALTH Route (/api/health)                                            ║
║  └─ GET /health             - System health check                       ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝


╔════════════════════════════════════════════════════════════════════════════╗
║                     DEPLOYMENT ARCHITECTURE                               ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  Docker Compose (Development) / Kubernetes (Production)                   ║
║                                                                            ║
║  ┌──────────────────────┐  ┌─────────────────┐  ┌────────────────┐      ║
║  │   Frontend Service   │  │  Backend Service │  │ Database Service│      ║
║  ├──────────────────────┤  ├─────────────────┤  ├────────────────┤      ║
║  │ Port: 3000           │  │ Port: 5000      │  │ Port: 5432     │      ║
║  │ Image: node:18-alpine│  │ Image: node:18  │  │ Image: postgres│      ║
║  │ Build: ./frontend    │  │ Build: ./backend│  │ Volume: db_data│      ║
║  │ Health: HTTP check   │  │ Health: /health │  │ Health: pg_isready     ║
║  │ Depends: backend ✓   │  │ Depends: db ✓   │  │                │      ║
║  │ Network: saas-network│  │ Network: saas-  │  │ Network: saas- │      ║
║  │                      │  │        network  │  │        network │      ║
║  └──────────────────────┘  └─────────────────┘  └────────────────┘      ║
║          ▲                        ▲                      ▲                 ║
║          │                        │                      │                 ║
║          └────────────────┬───────┴──────────────────────┘                ║
║                           │                                               ║
║                    Bridge Network: saas-network                           ║
║                    (Internal service discovery)                           ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝


╔════════════════════════════════════════════════════════════════════════════╗
║                      SECURITY & FLOW LAYERS                               ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  REQUEST FLOW:                                                             ║
║  ────────────                                                              ║
║                                                                            ║
║  1. Client Request                                                         ║
║     └─> CORS Check (Helmet Security Headers)                             ║
║     └─> Rate Limiting Check                                              ║
║     └─> Route Matching (Express Router)                                  ║
║                                                                            ║
║  2. Authentication Layer                                                   ║
║     └─> Check JWT Token (auth.middleware.js)                             ║
║     └─> Verify Signature                                                 ║
║     └─> Check Token Expiration                                           ║
║     └─> Extract User Info                                                ║
║                                                                            ║
║  3. Authorization Layer                                                    ║
║     └─> Check User Role (super_admin/admin/user)                         ║
║     └─> Verify Tenant Access                                             ║
║     └─> Check Resource Ownership                                         ║
║                                                                            ║
║  4. Validation Layer                                                       ║
║     └─> Input Validation (express-validator)                             ║
║     └─> Type Checking                                                    ║
║     └─> Business Logic Validation                                        ║
║                                                                            ║
║  5. Business Logic (Controller)                                            ║
║     └─> Database Query Execution                                         ║
║     └─> Tenant-specific Filtering (tenant_id)                            ║
║     └─> Response Formatting                                              ║
║                                                                            ║
║  6. Audit Logging                                                          ║
║     └─> Log Action to audit_logs table                                   ║
║     └─> Record User, Timestamp, IP                                       ║
║     └─> Store Changes (if applicable)                                    ║
║                                                                            ║
║  7. Response                                                               ║
║     └─> JSON Response with Status Code                                   ║
║     └─> Return to Client via HTTPS                                       ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

### Architecture Features

✅ **Scalability**
- Horizontal scaling: Add more API servers
- Load balancing: Distribute requests
- Database replication: Read replicas for scaling reads
- Connection pooling: Optimize database usage

✅ **High Availability**
- Multi-instance backend
- Database replication
- Health checks on all services
- Graceful degradation

✅ **Security**
- SSL/TLS encryption in transit
- JWT authentication
- Role-based access control
- Input validation
- SQL injection prevention
- CORS configuration
- Security headers (Helmet)

✅ **Performance**
- Connection pooling
- Caching ready
- Query optimization
- Asset compression
- CDN ready

✅ **Monitoring & Observability**
- Health check endpoints
- Audit logging
- Request logging (Morgan)
- Error tracking
- Performance metrics ready

---

## 📊 Data Flow Diagram

### Complete Request-Response Cycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CLIENT REQUEST FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

      USER                    BROWSER                 NETWORK
        │                       │                         │
        │  Type URL             │                         │
        ├──────────────────────>│                         │
        │                       │  HTTPS Request          │
        │                       ├────────────────────────>│
        │                       │                    Load Balancer
        │                       │                    (Port 3000/5000)
        │                       │                         │
        │                       │                   API Server #1
        │                       │                   ├─ Route Handler
        │                       │                   ├─ Auth Middleware
        │                       │                   ├─ Validation
        │                       │                   ├─ Controller
        │                       │                   ├─ Database Query
        │                       │                   ├─ Audit Log
        │                       │                   └─ Response
        │                       │                         │
        │                       │  HTTPS Response         │
        │                       │<────────────────────────┤
        │  HTML/JSON/Data       │                         │
        │<──────────────────────┤                         │
        │                       │                         │
        ▼                       ▼                         ▼


┌──────────────────────────────────────────────────────────────────────┐
│                   DATABASE OPERATION FLOW                            │
└──────────────────────────────────────────────────────────────────────┘

API Server
    │
    ├─> Connection Pool
    │   └─> Get Available Connection
    │       └─> Execute SQL Query
    │           └─> Apply Tenant Filter (WHERE tenant_id = X)
    │               └─> PostgreSQL Primary
    │                   ├─> Check Locks
    │                   ├─> Execute Transaction
    │                   ├─ Validate Data
    │                   ├─ Write to Disk
    │                   └─> Commit/Rollback
    │                       │
    │                       ├─> Replicate to Replica #1
    │                       ├─> Replicate to Replica #2
    │                       └─> Replicate to Replica #3
    │
    ├─> Return Result
    │   └─> Map to Entity
    │       └─> Audit Log Entry
    │           └─> Send JSON Response
    │
    └─> Release Connection (back to pool)
```

---

This comprehensive documentation provides a complete visual representation of the multi-tenant SaaS platform architecture, database schema, and data flows.
