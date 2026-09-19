import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { HistoryPage } from '../pages/app/HistoryPage';
import * as client from '../api/client';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual('../api/client');
  return {
    ...actual,
    fetchCurrentUser: vi.fn(),
    fetchAnalysesHistory: vi.fn(),
    deleteAnalysis: vi.fn(),
  };
});

describe('HistoryPage Component', () => {
  const mockUser = {
    id: 'usr_200',
    email: 'auditor@example.com',
    created_at: '2026-09-01T10:00:00Z',
    is_active: true,
  };

  const mockHistoryData = {
    items: [
      {
        id: 'hist_01',
        title: 'Lead Python Architect',
        company_name: 'Canonical Ltd',
        overall_risk_score: 12,
        risk_band: 'LOW',
        created_at: '2026-09-19T09:00:00Z',
      },
      {
        id: 'hist_02',
        title: 'Work from Home Data Entry',
        company_name: 'Quick Cash Corp',
        overall_risk_score: 88,
        risk_band: 'CRITICAL',
        created_at: '2026-09-18T14:00:00Z',
      },
    ],
    total: 2,
    limit: 10,
    offset: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(client.fetchCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(client.fetchAnalysesHistory).mockResolvedValue(mockHistoryData);
  });

  it('renders analysis history list and metadata badges', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HistoryPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Lead Python Architect')).toBeInTheDocument();
    expect(screen.getByText('Canonical Ltd')).toBeInTheDocument();
    expect(screen.getByText('Work from Home Data Entry')).toBeInTheDocument();
    expect(screen.getByText('Quick Cash Corp')).toBeInTheDocument();
  });

  it('triggers search query filtering when user submits search box', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HistoryPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const searchInput = await screen.findByPlaceholderText(/search by job title/i);
    fireEvent.change(searchInput, { target: { value: 'Python' } });

    const searchBtn = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(client.fetchAnalysesHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Python',
        })
      );
    });
  });
});
