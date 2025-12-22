import { render, screen } from '@testing-library/react';
import App from '../src/App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

test('renders home page header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Multi-Tenant SaaS Platform/i);
  expect(headerElement).toBeInTheDocument();
});