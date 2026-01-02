# Multi-Tenant SaaS Platform - Frontend

This is the frontend application for the Multi-Tenant SaaS Platform built with React.

## Features

- User authentication (login/register)
- Tenant management
- Project and task management
- Role-based access control
- Responsive design

## Tech Stack

- React.js
- React Router
- Axios
- CSS3

## Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at http://localhost:3000

## Environment Variables

- `REACT_APP_API_URL`: The URL of the backend API (default: http://localhost:5000/api)

## Folder Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── services/       # API service functions
├── utils/          # Utility functions
├── hooks/          # Custom React hooks
├── context/        # React context providers
├── assets/         # Images, styles, etc.
├── App.js          # Main application component
└── index.js        # Application entry point
```

## Available Scripts

In the project directory, you can run:

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Run tests with coverage report
- `npm run build`: Builds the app for production
- `npm run eject`: Removes the single build dependency

## Testing

The frontend uses Jest and React Testing Library for component and integration testing. To run the tests:

```bash
npm test                    # Run all frontend tests once
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
```

### Test Results

All frontend tests are currently passing:
- All component rendering tests passing
- All user interaction tests passing
- All API service integration tests passing
- All route protection tests passing

## Production Deployment

When deploying to production:

1. Ensure the `REACT_APP_API_URL` environment variable points to your production backend
2. The Dockerfile is configured for production with multi-stage builds
3. Nginx is configured with security headers and gzip compression
4. Static assets are cached for better performance

## Learn More

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).