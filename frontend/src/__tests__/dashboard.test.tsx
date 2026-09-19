import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { DashboardPage } from '../pages/app/DashboardPage';
import * as client from '../api/client';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual('../api/client');
  return {
    ...actual,
    fetchCurrentUser: vi.fn(),
    fetchDashboardSummary: vi.fn(),
  };
});

describe('DashboardPage Component', () => {
  const mockUser = {
    id: 'usr_100',
    email: 'sarah.engineer@example.com',
    created_at: '2026-09-01T10:00:00Z',
    is_active: true,
  };

  const mockSummary = {
    total_analyses: 24,
    risk_distribution: {
      low: 15,
      moderate: 5,
      high: 4,
      critical: 0,
    },
    average_risk_score: 28.4,
    recent_analyses: [
      {
        id: 'rec_01',
        title: 'Senior Software Engineer',
        company_name: 'Stripe',
        overall_risk_score: 18,
        risk_band: 'LOW',
        created_at: '2026-09-19T10:00:00Z',
      },
      {
        id: 'rec_02',
        title: 'Marketing Remote Intern',
        company_name: 'Global Ventures LLC',
        overall_risk_score: 68,
        risk_band: 'HIGH',
        created_at: '2026-09-18T15:30:00Z',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders summary metrics, risk distribution, and recent analyses for authenticated user', async () => {
    vi.mocked(client.fetchCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(client.fetchDashboardSummary).mockResolvedValue(mockSummary);

    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Header greeting
    expect(await screen.findByText(/Welcome back, sarah\.engineer/i)).toBeInTheDocument();

    // Summary cards
    expect(await screen.findByText('Total Postings Analyzed')).toBeInTheDocument();
    expect(screen.getAllByText('24').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1); // High risk
    expect(screen.getAllByText('15').length).toBeGreaterThanOrEqual(1); // Low risk
    expect(screen.getByText('28.4')).toBeInTheDocument(); // Avg risk score

    // Risk distribution bars
    expect(screen.getByText('Risk Distribution')).toBeInTheDocument();
    expect(screen.getByText('Low Risk (0–24)')).toBeInTheDocument();
    expect(screen.getByText('Moderate Risk (25–49)')).toBeInTheDocument();

    // Recent analyses
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Marketing Remote Intern')).toBeInTheDocument();
  });
});
