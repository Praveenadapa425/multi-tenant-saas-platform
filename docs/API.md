# API Documentation

## Authentication

### Register Tenant

**Endpoint**: `POST /api/auth/register-tenant`

**Description**: Register a new tenant with admin user

**Authentication**: None (Public)

**Request Body**:
```json
{
  "tenantName": "string",
  "subdomain": "string",
  "adminEmail": "string",
  "adminPassword": "string",
  "adminFullName": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Tenant registered successfully",
  "data": {
    "tenantId": "uuid",
    "subdomain": "string",
    "adminUser": {
      "id": "uuid",
      "email": "string",
      "fullName": "string",
      "role": "tenant_admin"
    }
  }
}
```

**Error Responses**:
- 400: Validation errors
- 409: Subdomain or email already exists

### User Login

**Endpoint**: `POST /api/auth/login`

**Description**: User login with email, password, and tenant

**Authentication**: None (Public)

**Request Body**:
```json
{
  "email": "string",
  "password": "string",
  "tenantSubdomain": "string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "string",
      "fullName": "string",
      "role": "string",
      "isActive": true,
      "tenantId": "uuid"
    },
    "token": "jwt-token-string",
    "expiresIn": "24h"
  }
}
```

**Error Responses**:
- 401: Invalid credentials
- 404: Tenant not found
- 403: Account suspended/inactive

### Get Current User

**Endpoint**: `GET /api/auth/me`

**Description**: Get current user information

**Authentication**: Required (JWT token)

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "fullName": "string",
    "role": "string",
    "isActive": true,
    "tenant": {
      "id": "uuid",
      "name": "string",
      "subdomain": "string",
      "subscriptionPlan": "string",
      "maxUsers": 0,
      "maxProjects": 0
    }
  }
}
```

**Error Responses**:
- 401: Token invalid/expired/missing
- 404: User not found

### Logout

**Endpoint**: `POST /api/auth/logout`

**Description**: User logout

**Authentication**: Required

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Tenants

### Get Tenant Details

**Endpoint**: `GET /api/tenants/:tenantId`

**Description**: Get tenant details

**Authentication**: Required

**Authorization**: User must belong to this tenant OR be super_admin

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "subdomain": "string",
    "status": "string",
    "subscriptionPlan": "string",
    "maxUsers": 0,
    "maxProjects": 0,
    "createdAt": "timestamp",
    "stats": {
      "totalUsers": 0,
      "totalProjects": 0,
      "totalTasks": 0
    }
  }
}
```

**Error Responses**:
- 403: Unauthorized access
- 404: Tenant not found

### Update Tenant

**Endpoint**: `PUT /api/tenants/:tenantId`

**Description**: Update tenant information

**Authentication**: Required

**Authorization**: tenant_admin OR super_admin only

**Request Body**:
```json
{
  "name": "string",
  "status": "string",
  "subscriptionPlan": "string",
  "maxUsers": 0,
  "maxProjects": 0
}
```

**Response**:
```json
{
  "success": true,
  "message": "Tenant updated successfully",
  "data": {
    "id": "uuid",
    "name": "string",
    "updatedAt": "timestamp"
  }
}
```

**Error Responses**:
- 403: Not authorized

### List All Tenants

**Endpoint**: `GET /api/tenants`

**Description**: List all tenants (Super Admin only)

**Authentication**: Required

**Authorization**: super_admin ONLY

**Query Parameters**:
- `page`: integer, default: 1
- `limit`: integer, default: 10, max: 100
- `status`: enum, optional filter
- `subscriptionPlan`: enum, optional filter

**Response**:
```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "id": "uuid",
        "name": "string",
        "subdomain": "string",
        "status": "string",
        "subscriptionPlan": "string",
        "totalUsers": 0,
        "totalProjects": 0,
        "createdAt": "timestamp"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalTenants": 1,
      "limit": 10
    }
  }
}
```

**Error Responses**:
- 403: Not super_admin

## Users

### Add User to Tenant

**Endpoint**: `POST /api/tenants/:tenantId/users`

**Description**: Add user to tenant

**Authentication**: Required

**Authorization**: tenant_admin only

**Request Body**:
```json
{
  "email": "string",
  "password": "string",
  "fullName": "string",
  "role": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "email": "string",
    "fullName": "string",
    "role": "string",
    "tenantId": "uuid",
    "isActive": true,
    "createdAt": "timestamp"
  }
}
```

**Error Responses**:
- 403: Subscription limit reached OR not authorized
- 409: Email already exists in this tenant

### List Tenant Users

**Endpoint**: `GET /api/tenants/:tenantId/users`

**Description**: List tenant users

**Authentication**: Required

**Authorization**: User must belong to this tenant

**Query Parameters**:
- `search`: string, optional - Search by name or email
- `role`: enum, optional filter - Filter by role
- `page`: integer, optional, default: 1 - For pagination
- `limit`: integer, optional, default: 50, max: 100 - Items per page

**Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "string",
        "fullName": "string",
        "role": "string",
        "isActive": true,
        "createdAt": "timestamp"
      }
    ],
    "total": 1,
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "limit": 50
    }
  }
}
```

### Update User

**Endpoint**: `PUT /api/users/:userId`

**Description**: Update user information

**Authentication**: Required

**Authorization**: tenant_admin OR self (limited fields)

**Request Body**:
```json
{
  "fullName": "string",
  "role": "string",
  "isActive": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "uuid",
    "fullName": "string",
    "role": "string",
    "updatedAt": "timestamp"
  }
}
```

**Error Responses**:
- 403: Not authorized

### Delete User

**Endpoint**: `DELETE /api/users/:userId`

**Description**: Delete user

**Authentication**: Required

**Authorization**: tenant_admin only

**Response**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Responses**:
- 403: Cannot delete self OR not authorized
- 404: User not found

## Projects

### Create Project

**Endpoint**: `POST /api/projects`

**Description**: Create project

**Authentication**: Required

**Request Body**:
```json
{
  "name": "string",
  "description": "string",
  "status": "string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "string",
    "description": "string",
    "status": "string",
    "createdBy": "uuid",
    "createdAt": "timestamp"
  }
}
```

**Error Responses**:
- 403: Project limit reached

### List Projects

**Endpoint**: `GET /api/projects`

**Description**: List projects

**Authentication**: Required

**Query Parameters**:
- `status`: enum, optional filter - Filter by project status
- `search`: string, optional - Search by project name (case-insensitive)
- `page`: integer, optional, default: 1 - For pagination
- `limit`: integer, optional, default: 20, max: 100 - Items per page

**Response**:
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string",
        "status": "string",
        "createdBy": {
          "id": "uuid",
          "fullName": "string"
        },
        "taskCount": 0,
        "completedTaskCount": 0,
        "createdAt": "timestamp"
      }
    ],
    "total": 1,
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "limit": 20
    }
  }
}
```

### Get Project Details

**Endpoint**: `GET /api/projects/:projectId`

**Description**: Get project details

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "name": "string",
    "description": "string",
    "status": "string",
    "created_by": "uuid",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

**Error Responses**:
- 404: Project not found

### Update Project

**Endpoint**: `PUT /api/projects/:projectId`

**Description**: Update project

**Authentication**: Required

**Authorization**: tenant_admin OR project creator

**Request Body**:
```json
{
  "name": "string",
  "description": "string",
  "status": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "status": "string",
    "updatedAt": "timestamp"
  }
}
```

**Error Responses**:
- 403: Not authorized
- 404: Project not found OR belongs to different tenant

### Delete Project

**Endpoint**: `DELETE /api/projects/:projectId`

**Description**: Delete project

**Authentication**: Required

**Authorization**: tenant_admin OR project creator

**Response**:
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Error Responses**:
- 403: Not authorized
- 404: Project not found OR belongs to different tenant

## Tasks

### Create Task

**Endpoint**: `POST /api/projects/:projectId/tasks`

**Description**: Create task

**Authentication**: Required

**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "assignedTo": "uuid",
  "priority": "string",
  "dueDate": "date"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "tenantId": "uuid",
    "title": "string",
    "description": "string",
    "status": "string",
    "priority": "string",
    "assignedTo": "uuid",
    "dueDate": "date",
    "createdAt": "timestamp"
  }
}
```

**Error Responses**:
- 403: Project doesn't belong to user's tenant
- 400: assignedTo user doesn't belong to same tenant

### List Project Tasks

**Endpoint**: `GET /api/projects/:projectId/tasks`

**Description**: List project tasks

**Authentication**: Required

**Query Parameters**:
- `status`: enum, optional filter - Filter by task status
- `assignedTo`: uuid, optional filter - Filter by assigned user
- `priority`: enum, optional filter - Filter by priority
- `search`: string, optional - Search by task title (case-insensitive)
- `page`: integer, optional, default: 1 - For pagination
- `limit`: integer, optional, default: 50, max: 100 - Items per page

**Response**:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "status": "string",
        "priority": "string",
        "assignedTo": {
          "id": "uuid",
          "fullName": "string",
          "email": "string"
        },
        "dueDate": "date",
        "createdAt": "timestamp"
      }
    ],
    "total": 1,
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "limit": 50
    }
  }
}
```

### Update Task Status

**Endpoint**: `PATCH /api/tasks/:taskId/status`

**Description**: Update task status

**Authentication**: Required

**Request Body**:
```json
{
  "status": "string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "string",
    "updatedAt": "timestamp"
  }
}
```

### Update Task

**Endpoint**: `PUT /api/tasks/:taskId`

**Description**: Update task

**Authentication**: Required

**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "status": "string",
  "priority": "string",
  "assignedTo": "uuid",
  "dueDate": "date"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "status": "string",
    "priority": "string",
    "assignedTo": {
      "id": "uuid",
      "fullName": "string",
      "email": "string"
    },
    "dueDate": "date",
    "updatedAt": "timestamp"
  }
}
```

**Error Responses**:
- 403: Task doesn't belong to user's tenant
- 400: assignedTo user doesn't belong to same tenant
- 404: Task not found

### Delete Task

**Endpoint**: `DELETE /api/tasks/:taskId`

**Description**: Delete task

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

**Error Responses**:
- 403: Task doesn't belong to user's tenant
- 404: Task not found