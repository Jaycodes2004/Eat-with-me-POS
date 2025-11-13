// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoginScreen } from '../components/LoginScreen';
import { AuthProvider } from '../contexts/AuthContext';
import api from '../lib/api';
import { MemoryRouter } from 'react-router-dom';

// Mock the api module
jest.mock('../lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('LoginScreen', () => {
  it('renders the login form', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginScreen onLogin={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Enter your restaurant ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByText('Sign In with AI')).toBeInTheDocument();
  });

  it('allows a user to log in successfully', async () => {
    const onLogin = jest.fn();
    mockedApi.post.mockResolvedValue({
      data: {
        accessToken: 'fake-token',
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'manager',
          permissions: ['dashboard'],
          dashboardModules: ['dashboard'],
        },
        restaurant: {
          id: 'res123',
        },
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginScreen onLogin={onLogin} />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter your restaurant ID'), { target: { value: 'res123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Sign In with AI'));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/auth/login',
        {
          email: 'test@example.com',
          password: 'password123',
          restaurantId: 'res123',
        },
        {
          headers: { 'X-Restaurant-Id': 'res123' },
        }
      );
      expect(onLogin).toHaveBeenCalled();
    });
  });

  it('shows an error message on failed login', async () => {
    mockedApi.post.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginScreen onLogin={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter your restaurant ID'), { target: { value: 'res123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByText('Sign In with AI'));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });
});
