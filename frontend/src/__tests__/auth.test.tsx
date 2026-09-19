import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { AccountPage } from '../pages/app/AccountPage';
import * as client from '../api/client';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual('../api/client');
  return {
    ...actual,
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    logoutUser: vi.fn(),
    fetchCurrentUser: vi.fn(),
  };
});

describe('Dedicated Authentication Pages & Account Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(client.fetchCurrentUser).mockRejectedValue(new Error('Not logged in'));
  });

  it('renders LoginPage and submits valid credentials', async () => {
    vi.mocked(client.loginUser).mockResolvedValueOnce({
      user: {
        id: 'user-123',
        email: 'alice@example.com',
        created_at: '2026-09-19T20:00:00Z',
        is_active: true,
      },
      message: 'Login successful.',
      token: 'jwt-mock-token',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Sign in to AuthentiHire/i)).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /Sign in/i });

    fireEvent.change(emailInput, { target: { value: 'alice@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'SecretPassword123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(client.loginUser).toHaveBeenCalledWith({
        email: 'alice@example.com',
        password: 'SecretPassword123',
      });
    });
  });

  it('validates password mismatch on RegisterPage', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Create your account/i)).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter password');
    const submitBtn = screen.getByRole('button', { name: /Create account/i });

    fireEvent.change(emailInput, { target: { value: 'bob@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPassword456' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(client.registerUser).not.toHaveBeenCalled();
  });

  it('renders AccountPage with user email and executes logout', async () => {
    vi.mocked(client.fetchCurrentUser).mockResolvedValueOnce({
      id: 'usr_789',
      email: 'member@example.com',
      created_at: '2026-09-01T12:00:00Z',
      is_active: true,
    });
    vi.mocked(client.logoutUser).mockResolvedValueOnce({ message: 'Successfully logged out.' });

    render(
      <MemoryRouter>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('member@example.com')).toBeInTheDocument();
    expect(screen.getByText('Active & Verified')).toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: /Log out of AuthentiHire/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(client.logoutUser).toHaveBeenCalled();
    });
  });
});
