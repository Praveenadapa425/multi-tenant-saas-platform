import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';

// Mock the AuthContext
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false
  })
}));

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('App Component', () => {
  test('renders main layout and navigation', () => {
    renderWithRouter(<App />);
    
    // Check for main header
    expect(screen.getByText(/Multi-Tenant SaaS Platform/i)).toBeInTheDocument();
    
    // Check for navigation elements
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Register/i })).toBeInTheDocument();
  });

  test('renders home page by default', () => {
    renderWithRouter(<App />);
    
    expect(screen.getByText(/Multi-Tenant SaaS Platform/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome to our SaaS platform/i)).toBeInTheDocument();
  });

  test('has proper routing for different pages', () => {
    renderWithRouter(<App />);
    
    // Check if login and register links are present
    const loginLink = screen.getByRole('link', { name: /Login/i });
    const registerLink = screen.getByRole('link', { name: /Register/i });
    
    expect(loginLink).toBeInTheDocument();
    expect(registerLink).toBeInTheDocument();
  });
});