import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../src/pages/Dashboard';
import { useAuth } from '../src/context/AuthContext';

// Mock the AuthContext
jest.mock('../src/context/AuthContext');

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({
      user: { 
        id: 'user-id', 
        email: 'test@example.com', 
        first_name: 'Test', 
        last_name: 'User', 
        role: 'user' 
      },
      token: 'test-token',
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    });
  });

  test('renders dashboard with welcome message', () => {
    renderWithRouter(<Dashboard />);
    
    expect(screen.getByText(/welcome, test user!/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    renderWithRouter(<Dashboard />);
    
    expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  test('shows user role information', () => {
    renderWithRouter(<Dashboard />);
    
    expect(screen.getByText(/role: user/i)).toBeInTheDocument();
  });

  test('renders dashboard content based on user role', () => {
    // Test as regular user
    useAuth.mockReturnValue({
      user: { 
        id: 'user-id', 
        email: 'test@example.com', 
        first_name: 'Test', 
        last_name: 'User', 
        role: 'user' 
      },
      token: 'test-token',
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    });
    
    renderWithRouter(<Dashboard />);
    
    expect(screen.getByText(/welcome, test user!/i)).toBeInTheDocument();
    
    // Test as tenant admin
    useAuth.mockReturnValue({
      user: { 
        id: 'admin-id', 
        email: 'admin@example.com', 
        first_name: 'Admin', 
        last_name: 'User', 
        role: 'tenant_admin' 
      },
      token: 'test-token',
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    });
    
    renderWithRouter(<Dashboard />);
    
    expect(screen.getByText(/welcome, admin user!/i)).toBeInTheDocument();
  });

  test('shows loading state', () => {
    useAuth.mockReturnValue({
      user: null,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: true
    });
    
    renderWithRouter(<Dashboard />);
    
    expect(screen.getByText(/loading.../i)).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    });
    
    renderWithRouter(<Dashboard />);
    
    // The component should show unauthorized message or redirect
    expect(screen.getByText(/not authenticated/i)).toBeInTheDocument();
  });
});