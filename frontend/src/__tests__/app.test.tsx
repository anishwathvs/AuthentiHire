import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from '../App';
import * as client from '../api/client';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual('../api/client');
  return {
    ...actual,
    fetchCurrentUser: vi.fn(),
    analyzeJobPosting: vi.fn(),
    fetchDashboardSummary: vi.fn(),
    fetchAnalysisHistory: vi.fn(),
    fetchAnalysisById: vi.fn(),
  };
});

describe('AuthentiHire Multi-Page Router & Public Experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(client.fetchCurrentUser).mockRejectedValue(new Error('Unauthenticated'));
    window.history.pushState({}, '', '/');
  });

  it('renders landing page with headline, CTAs, and 3D product mockup hero', () => {
    render(<App />);

    expect(screen.getByText(/Know the risk/i)).toBeInTheDocument();
    expect(screen.getByText(/before you apply\./i)).toBeInTheDocument();
    expect(screen.getByText(/Analyze a posting/i)).toBeInTheDocument();
    expect(screen.getByText(/See how it works/i)).toBeInTheDocument();

    // 3 Layers section
    expect(screen.getByText(/One prediction isn't enough\./i)).toBeInTheDocument();
    expect(screen.getAllByText(/Calibrated Machine Learning/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Deterministic Scam Rules/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Company & Website Intelligence/i).length).toBeGreaterThan(0);

    // Safety message
    expect(screen.getByText(/AuthentiHire is a screening tool, not a legal guarantee\./i)).toBeInTheDocument();
  });

  it('navigates to How It Works page from navigation link', async () => {
    const user = userEvent.setup();
    render(<App />);

    const howItWorksLink = screen.getAllByRole('link', { name: /how it works/i })[0];
    await user.click(howItWorksLink);

    expect(await screen.findByText(/How the Detection Engine Works/i)).toBeInTheDocument();
    expect(screen.getByText(/Understanding the Three Core Measurements/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Fraud Probability/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Company Trust Score/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Overall Risk Score/i).length).toBeGreaterThan(0);
  });

  it('navigates to About page and displays transparent limitations', async () => {
    const user = userEvent.setup();
    render(<App />);

    const aboutLink = screen.getAllByRole('link', { name: /about/i })[0];
    await user.click(aboutLink);

    expect(await screen.findByText(/Protecting job seekers through transparent, evidence-based intelligence\./i)).toBeInTheDocument();
    expect(screen.getByText(/Transparent Limitations & Operational Boundaries/i)).toBeInTheDocument();
  });

  it('navigates to Resources page and displays safety knowledge center', async () => {
    const user = userEvent.setup();
    render(<App />);

    const resourcesLink = screen.getAllByRole('link', { name: /resources/i })[0];
    await user.click(resourcesLink);

    expect(await screen.findByText(/Job Scam Indicators & Safety Guide/i)).toBeInTheDocument();
    expect(screen.getByText(/Why legitimate employers NEVER demand upfront payments or cashier checks/i)).toBeInTheDocument();
  });

  it('navigates to Login page and displays sign-in form', async () => {
    const user = userEvent.setup();
    render(<App />);

    const loginLink = screen.getAllByRole('link', { name: /log in/i })[0];
    await user.click(loginLink);

    expect(await screen.findByText(/Sign in to AuthentiHire/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('navigates to Register page and displays create account form', async () => {
    const user = userEvent.setup();
    render(<App />);

    const registerLink = screen.getAllByRole('link', { name: /create account/i })[0];
    await user.click(registerLink);

    expect(await screen.findByText(/Create your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
  });
});
