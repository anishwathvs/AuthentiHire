import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeJobPosting, fetchHealth, fetchModelInfo, AuthentiHireApiError } from '../api/client';
import { JobPostingRequest, JobAnalysisResponse } from '../types/api';

describe('AuthentiHire API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully submits job posting and parses response', async () => {
    const mockResponse: JobAnalysisResponse = {
      request_id: 'test-req-123',
      prediction: {
        fraud_probability: 0.82,
        prediction: 'FRAUDULENT',
        threshold_used: 0.25,
        model_name: 'Calibrated Logistic Regression',
      },
      risk: {
        overall_score: 72,
        risk_band: 'HIGH RISK',
        status: 'HIGH_RISK',
      },
      company: {
        company_name: 'Test Corp',
        trust_score: 43,
        consistency_rating: 'MEDIUM',
        signals: [],
      },
      rules: {
        total_score: 26,
        triggered_rules_count: 1,
        triggered_rules: [],
        category_breakdown: {},
        suspicion_level: 'High',
      },
      reasons: ['High ML probability'],
      corroborations: [],
      recommendations: 'Verify employer carefully.',
      metadata: {
        model_version: 'v1',
        risk_config_version: '1.0.0',
        api_version: '1.0.0',
        timestamp: '2026-09-19T00:00:00Z',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const payload: JobPostingRequest = {
      title: 'Data Entry Clerk',
      description: 'Work from home data entry with high salary.',
    };

    const res = await analyzeJobPosting(payload);
    expect(res.request_id).toBe('test-req-123');
    expect(res.risk.overall_score).toBe(72);
    expect(res.prediction.fraud_probability).toBe(0.82);
  });

  it('handles 422 validation error cleanly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The request body failed schema validation.',
          details: [{ field: 'body -> description', message: 'Field required', type: 'missing' }],
        },
      }),
    });

    await expect(analyzeJobPosting({ description: '' })).rejects.toThrow(AuthentiHireApiError);
  });

  it('handles 500 server error cleanly with error_id', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected internal server error occurred.',
          error_id: 'err-456',
        },
      }),
    });

    try {
      await analyzeJobPosting({ description: 'sample' });
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(AuthentiHireApiError);
      const apiErr = err as AuthentiHireApiError;
      expect(apiErr.status).toBe(500);
      expect(apiErr.errorId).toBe('err-456');
    }
  });

  it('handles network failure gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    try {
      await analyzeJobPosting({ description: 'sample' });
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(AuthentiHireApiError);
      const apiErr = err as AuthentiHireApiError;
      expect(apiErr.code).toBe('NETWORK_ERROR');
      expect(apiErr.message).toContain('Unable to connect');
    }
  });

  it('fetches health status successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'healthy',
        version: '1.0.0',
        model_loaded: true,
        timestamp: '2026-09-19T00:00:00Z',
      }),
    });

    const health = await fetchHealth();
    expect(health.status).toBe('healthy');
    expect(health.model_loaded).toBe(true);
  });

  it('fetches model info successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        model_name: 'Calibrated Logistic Regression',
        model_type: 'LogisticRegression',
        calibration_method: 'isotonic',
        decision_threshold: 0.25,
        rule_count: 13,
        component_weights: { ml_weight: 0.5, rule_weight: 0.3, company_weight: 0.2 },
        risk_bands: {},
        status_categories: {},
      }),
    });

    const info = await fetchModelInfo();
    expect(info.model_name).toBe('Calibrated Logistic Regression');
    expect(info.decision_threshold).toBe(0.25);
  });

  it('manages auth tokens in localStorage and attaches Authorization header', async () => {
    const { setAuthToken, getAuthToken, clearAuthToken } = await import('../api/client');
    setAuthToken('test-jwt-token-xyz');
    expect(getAuthToken()).toBe('test-jwt-token-xyz');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'u1', email: 'test@example.com' }),
    });

    const { fetchCurrentUser } = await import('../api/client');
    await fetchCurrentUser();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/me'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt-token-xyz',
        }),
      })
    );

    clearAuthToken();
    expect(getAuthToken()).toBeNull();
  });
});

