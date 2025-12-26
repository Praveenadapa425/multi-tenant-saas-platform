# Multi-Tenant SaaS Platform - Frontend

A modern React-based frontend for a multi-tenant SaaS project management platform with comprehensive UI components and user-friendly design.

## Features

✅ **Authentication System**
- User registration and login
- JWT-based token authentication
- Protected routes with role-based access control
- Session management

✅ **Navigation**
- Sticky navigation bar with user info
- Quick navigation to main sections
- Logout functionality

✅ **Pages Implemented**
1. **Home Page** - Landing page with features, pricing, and CTA
2. **Login Page** - User authentication with email/password
3. **Register Page** - Tenant organization registration
4. **Dashboard** - Overview with stats and recent items
5. **Projects** - Project management with creation and viewing
6. **Project Details** - Task management within projects
7. **Users** - Team member management

✅ **Styling & Components**
- Responsive design (mobile-first approach)
- Gradient UI with modern colors (#667eea, #764ba2)
- Consistent button styles and form elements
- Status badges and priority indicators
- Empty states with helpful CTAs

✅ **Services**
- API integration with backend
- Axios interceptors for authentication
- Error handling and loading states
- Service modules for projects, tasks, users, and auth

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Navigation.js          # Main navigation bar
│   │   └── ProtectedRoute.js      # Route protection wrapper
│   ├── context/
│   │   └── AuthContext.js         # Authentication state management
│   ├── pages/
│   │   ├── Home.js                # Landing page
│   │   ├── Login.js               # User login
│   │   ├── Register.js            # Tenant registration
│   │   ├── Dashboard.js           # Main dashboard
│   │   ├── Projects.js            # Projects list & creation
│   │   ├── ProjectDetails.js      # Project tasks
│   │   └── Users.js               # Team members
│   ├── services/
│   │   ├── api.js                 # Axios configuration
│   │   ├── authService.js         # Auth API calls
│   │   ├── projectService.js      # Project API calls
│   │   ├── taskService.js         # Task API calls
│   │   └── userService.js         # User API calls
│   ├── styles/
│   │   ├── Navigation.css         # Navigation styling
│   │   ├── Auth.css               # Auth pages styling
│   │   ├── Home.css               # Home page styling
│   │   ├── Dashboard.css          # Dashboard styling
│   │   ├── Projects.css           # Projects page styling
│   │   ├── Users.css              # Users page styling
│   │   └── ProjectDetails.css     # Project details styling
│   ├── App.js                     # Main app with routing
│   ├── App.css                    # Global styles
│   ├── index.js                   # React entry point
│   └── index.css                  # Base styles
├── public/
│   └── index.html                 # HTML template
└── package.json                   # Dependencies
```

## Installation & Setup

### Prerequisites
- Node.js 14+ and npm
- Backend server running on localhost:5000

### Installation

```bash
# Install dependencies
npm install

# Set environment variables (create .env file)
REACT_APP_API_URL=http://localhost:5000/api

# Start development server
npm start
```

The app will open at `http://localhost:3000`

## Key Technologies

- **React** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **CSS3** - Styling with Flexbox and Grid

## Available Scripts

### Development
```bash
npm start
```
Runs the app in development mode with hot reload.

### Build
```bash
npm run build
```
Creates an optimized production build.

### Testing
```bash
npm test
```
Runs the test suite.

### Eject
```bash
npm run eject
```
Exposes build configuration (one-way operation).

## Design System

### Color Palette
- **Primary**: #667eea (Indigo)
- **Secondary**: #764ba2 (Purple)
- **Background**: #f5f6f7 (Light Gray)
- **Text**: #333 (Dark Gray)
- **Success**: #00b894 (Green)
- **Error**: #c33 (Red)
- **Warning**: #d63031 (Orange)

### Typography
- **Font**: System fonts (-apple-system, BlinkMacSystemFont, etc.)
- **Headings**: Bold (600-700 weight)
- **Body**: Regular (400 weight)
- **Small**: 0.9rem
- **Medium**: 1rem
- **Large**: 1.3rem+

### Components
- Buttons with hover effects and loading states
- Form inputs with focus states
- Status badges with color coding
- Card layouts with shadows
- Tables with alternating rows
- Empty states with encouraging messaging

## Authentication Flow

1. User registers organization on `/register`
2. Tenant and admin user created in backend
3. User logs in on `/login` with email/password
4. JWT token received and stored in localStorage
5. Token automatically added to all API requests
6. Protected routes redirect to login if no token
7. Dashboard shows user info and organization stats
8. Logout clears token and redirects to home

## API Integration

All API calls go through the `api.js` service which:
- Adds authentication headers automatically
- Handles 401 responses by redirecting to login
- Supports error handling in service methods
- Uses consistent response format

## Future Enhancements

- [ ] User profile and settings page
- [ ] Project collaboration features (comments, mentions)
- [ ] Real-time updates with WebSockets
- [ ] Activity feed and notifications
- [ ] Advanced filtering and search
- [ ] Data export functionality
- [ ] Dark mode toggle
- [ ] Multi-language support
- [ ] PWA capabilities

## Troubleshooting

**CORS Errors**: Ensure backend is running and REACT_APP_API_URL is correct.

**Token Expiration**: Token is automatically removed on 401 response, user directed to login.

**Missing Styles**: Import CSS files in components that need them.

**API Errors**: Check browser console for detailed error messages.

## Contributing

See the main repository CONTRIBUTING.md for guidelines.

## License

MIT License - See LICENSE file for details
