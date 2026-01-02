import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Users from './pages/Users';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

// Import components
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';

// Import context provider
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navigation />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
                <Route path="/projects" element={<ProtectedRoute element={<Projects />} />} />
                <Route path="/projects/:projectId" element={<ProtectedRoute element={<ProjectDetails />} />} />
                <Route path="/users" element={<ProtectedRoute element={<Users />} />} />
                <Route path="/system-admin" element={<ProtectedRoute element={<SuperAdminDashboard />} />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;




