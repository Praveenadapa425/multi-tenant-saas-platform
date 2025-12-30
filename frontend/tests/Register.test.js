import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from '../src/pages/Register';
import { useAuth } from '../src/context/AuthContext';

// Mock the AuthContext
jest.mock('../src/context/AuthContext');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({
      user: null,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    });
  });

  test('renders registration form with all fields', () => {
    renderWithRouter(<Register />);
    
    expect(screen.getByLabelText(/tenant name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subdomain/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    renderWithRouter(<Register />);
    
    const registerButton = screen.getByRole('button', { name: /register/i });
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(screen.getByText(/tenant name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/subdomain is required/i)).toBeInTheDocument();
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  test('shows validation error for invalid email format', async () => {
    renderWithRouter(<Register />);
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const registerButton = screen.getByRole('button', { name: /register/i });
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  test('shows validation error for weak password', async () => {
    renderWithRouter(<Register />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    
    const registerButton = screen.getByRole('button', { name: /register/i });
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  test('submits registration form with valid credentials', async () => {
    const mockRegister = jest.fn().mockResolvedValue({ 
      success: true, 
      data: { 
        tenant: { id: 'tenant-id', name: 'Test Tenant' }, 
        user: { id: 'user-id', email: 'test@example.com' }, 
        token: 'test-token' 
      } 
    });
    
    // Mock the API service
    jest.mock('../src/services/authService', () => ({
      registerTenant: mockRegister
    }));
    
    const { registerTenant } = require('../src/services/authService');
    
    renderWithRouter(<Register />);
    
    const tenantNameInput = screen.getByLabelText(/tenant name/i);
    const subdomainInput = screen.getByLabelText(/subdomain/i);
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const registerButton = screen.getByRole('button', { name: /register/i });
    
    fireEvent.change(tenantNameInput, { target: { value: 'Test Tenant' } });
    fireEvent.change(subdomainInput, { target: { value: 'test' } });
    fireEvent.change(firstNameInput, { target: { value: 'Test' } });
    fireEvent.change(lastNameInput, { target: { value: 'User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(registerTenant).toHaveBeenCalledWith({
        tenantName: 'Test Tenant',
        subdomain: 'test',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Password123!'
      });
    });
  });

  test('shows error message for registration failure', async () => {
    const mockRegister = jest.fn().mockResolvedValue({ 
      success: false, 
      message: 'Registration failed' 
    });
    
    // Mock the API service
    jest.mock('../src/services/authService', () => ({
      registerTenant: mockRegister
    }));
    
    const { registerTenant } = require('../src/services/authService');
    
    renderWithRouter(<Register />);
    
    const tenantNameInput = screen.getByLabelText(/tenant name/i);
    const subdomainInput = screen.getByLabelText(/subdomain/i);
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const registerButton = screen.getByRole('button', { name: /register/i });
    
    fireEvent.change(tenantNameInput, { target: { value: 'Test Tenant' } });
    fireEvent.change(subdomainInput, { target: { value: 'test' } });
    fireEvent.change(firstNameInput, { target: { value: 'Test' } });
    fireEvent.change(lastNameInput, { target: { value: 'User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
  });

  test('shows success message after successful registration', async () => {
    const mockRegister = jest.fn().mockResolvedValue({ 
      success: true, 
      data: { 
        tenant: { id: 'tenant-id', name: 'Test Tenant' }, 
        user: { id: 'user-id', email: 'test@example.com' }, 
        token: 'test-token' 
      } 
    });
    
    // Mock the API service
    jest.mock('../src/services/authService', () => ({
      registerTenant: mockRegister
    }));
    
    const { registerTenant } = require('../src/services/authService');
    
    renderWithRouter(<Register />);
    
    const tenantNameInput = screen.getByLabelText(/tenant name/i);
    const subdomainInput = screen.getByLabelText(/subdomain/i);
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const registerButton = screen.getByRole('button', { name: /register/i });
    
    fireEvent.change(tenantNameInput, { target: { value: 'Test Tenant' } });
    fireEvent.change(subdomainInput, { target: { value: 'test' } });
    fireEvent.change(firstNameInput, { target: { value: 'Test' } });
    fireEvent.change(lastNameInput, { target: { value: 'User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(screen.getByText(/registration successful!/i)).toBeInTheDocument();
    });
  });
});