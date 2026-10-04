/**
 * AuthentiHire - Centralized API Service Client
 * ============================================
 * Interfaces with FastAPI backend, authentication service, and persistence layer.
 * Safe error handling with no stack trace leakage.
 */

import {
  JobPostingRequest,
  JobAnalysisResponse,
  HealthResponse,
  ModelInfoResponse,
  PaginatedAnalysisHistory,
  DeleteAnalysisResponse,
  DashboardSummaryResponse,
  HistoryQueryParams,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  LogoutResponse,
  User,
  ApiError,
} from '../types/api';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '');
const SESSION_STORAGE_KEY = 'authentihire_anonymous_session_id';
const AUTH_TOKEN_STORAGE_KEY = 'authentihire_auth_token';

/**
 * Returns stored JWT access token for cross-origin authorization headers.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

/**
 * Stores JWT access token in localStorage for cross-origin authenticated requests.
 */
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  }
}

/**
 * Clears stored JWT access token on logout.
 */
export function clearAuthToken(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}

/**
 * Constructs common request headers including Bearer authorization if token is present.
 */
function getRequestHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...extra,
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Returns or generates a persistent anonymous session ID for analysis ownership.
 */
export function getAnonymousSessionId(): string {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'default-session-id';
  }
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export class AuthentiHireApiError extends Error {
  public code: string;
  public status: number;
  public errorId?: string;
  public details?: Array<{ field: string; message: string; type: string }>;

  constructor(message: string, status: number, code: string = 'API_ERROR', errorId?: string, details?: Array<{ field: string; message: string; type: string }>) {
    super(message);
    this.name = 'AuthentiHireApiError';
    this.status = status;
    this.code = code;
    this.errorId = errorId;
    this.details = details;
  }
}

/**
 * Parses HTTP error response cleanly without exposing internal runtime details.
 */
async function handleResponseError(response: Response): Promise<never> {
  let errorData: { error?: ApiError } = {};
  try {
    errorData = await response.json();
  } catch {
    // Non-JSON response
  }

  const status = response.status;
  const errorObj = errorData.error;

  if (status === 400) {
    const message = errorObj?.message || 'Invalid request parameters.';
    throw new AuthentiHireApiError(message, status, 'BAD_REQUEST', errorObj?.error_id);
  }

  if (status === 401) {
    const message = errorObj?.message || 'Invalid email or password.';
    throw new AuthentiHireApiError(message, status, 'UNAUTHORIZED', errorObj?.error_id);
  }

  if (status === 403) {
    const message = errorObj?.message || 'Access denied.';
    throw new AuthentiHireApiError(message, status, 'FORBIDDEN', errorObj?.error_id);
  }

  if (status === 404) {
    throw new AuthentiHireApiError('The requested resource was not found on the server.', status, 'NOT_FOUND');
  }

  if (status === 422) {
    const message = errorObj?.message || 'The provided details contain invalid data format.';
    throw new AuthentiHireApiError(message, status, 'VALIDATION_ERROR', undefined, errorObj?.details);
  }

  if (status === 429) {
    const message = errorObj?.message || 'Too many requests. Please try again in a few moments.';
    throw new AuthentiHireApiError(message, status, 'RATE_LIMITED', errorObj?.error_id);
  }

  if (status === 500) {
    const message = errorObj?.message || 'The service encountered an unexpected error. Please try again.';
    throw new AuthentiHireApiError(message, status, 'INTERNAL_ERROR', errorObj?.error_id);
  }

  const genericMsg = errorObj?.message || `Request failed with status ${status}.`;
  throw new AuthentiHireApiError(genericMsg, status, errorObj?.code || 'UNKNOWN_ERROR', errorObj?.error_id);
}

// ==============================================================================
// AUTHENTICATION API
// ==============================================================================

/**
 * Registers a new user account.
 */
export async function registerUser(payload: RegisterRequest): Promise<AuthResponse> {
  const url = `${API_BASE_URL}/api/v1/auth/register`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return await handleResponseError(response);
    }

    const data = (await response.json()) as AuthResponse;
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  } catch (err: unknown) {
    if (err instanceof AuthentiHireApiError) throw err;
    throw new AuthentiHireApiError('Unable to connect to authentication service.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Authenticates user credentials and establishes a session.
 */
export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
  const url = `${API_BASE_URL}/api/v1/auth/login`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return await handleResponseError(response);
    }

    const data = (await response.json()) as AuthResponse;
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  } catch (err: unknown) {
    if (err instanceof AuthentiHireApiError) throw err;
    throw new AuthentiHireApiError('Unable to connect to authentication service.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Logs out and clears active session cookie and stored token.
 */
export async function logoutUser(): Promise<LogoutResponse> {
  const url = `${API_BASE_URL}/api/v1/auth/logout`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: getRequestHeaders(),
    });

    clearAuthToken();

    if (!response.ok) {
      return await handleResponseError(response);
    }

    return (await response.json()) as LogoutResponse;
  } catch (err: unknown) {
    clearAuthToken();
    if (err instanceof AuthentiHireApiError) throw err;
    throw new AuthentiHireApiError('Unable to complete logout request.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Fetches profile metadata for current authenticated user.
 */
export async function fetchCurrentUser(): Promise<User> {
  const url = `${API_BASE_URL}/api/v1/auth/me`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: getRequestHeaders(),
    });

    if (!response.ok) {
      return await handleResponseError(response);
    }

    return (await response.json()) as User;
  } catch (err: unknown) {
    if (err instanceof AuthentiHireApiError) throw err;
    throw new AuthentiHireApiError('Unable to fetch current user profile.', 0, 'NETWORK_ERROR');
  }
}

// ==============================================================================
// ANALYSIS API
// ==============================================================================

/**
 * Submits job posting for multi-layer ML and rule-based fraud risk analysis, persisting results.
 */
export async function analyzeJobPosting(
  payload: JobPostingRequest,
  liveChecks: boolean = false
): Promise<JobAnalysisResponse> {
  const url = `${API_BASE_URL}/api/v1/analyze?live_checks=${liveChecks}`;
  const sessionId = getAnonymousSessionId();

  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: getRequestHeaders({
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
      }),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return await handleResponseError(response);
    }

    return (await response.json()) as JobAnalysisResponse;
  } catch (err: unknown) {
    if (err instanceof AuthentiHireApiError) {
      throw err;
    }
    // Network or connection offline error
    throw new AuthentiHireApiError(
      `Unable to connect to the AuthentiHire analysis backend. Please check that the server is reachable at ${API_BASE_URL}.`,
      0,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Retrieves a stored analysis snapshot by ID for the active user or session.
 */
export async function fetchAnalysisById(analysisId: string): Promise<JobAnalysisResponse> {
  const url = `${API_BASE_URL}/api/v1/analyses/${analysisId}`;
  const sessionId = getAnonymousSessionId();

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: getRequestHeaders({
        'X-Session-ID': sessionId,
      }),
    });

    if (!response.ok) {
      return await handleResponseError(response);
    }

    return (await response.json()) as JobAnalysisResponse;
  } catch (err: unknown) {
    if (err instanceof AuthentiHireApiError) throw err;
    throw new AuthentiHireApiError('Unable to retrieve stored analysis snapshot.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Fetches aggregate verification statistics and recent activity for the authenticated dashboard.
 */
export async function fetchDashboardSummary(): Promise<DashboardSummaryResponse> {
  const url = `${API_BASE_URL}/api/v1/dashboard/summary`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: getRequestHeaders(),
    });

    if (!response.ok) {
      return await handleResponseError(response);
    }

    return (await response.json()) as DashboardSummaryResponse;
  } catch (err: unknown) {
    if (err instanceof AuthentiHireApiError) throw err;
    throw new AuthentiHireApiError('Unable to load dashboard summary.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Retrieves paginated, filtered, and sorted analysis history for active user or session.
 */
export async function fetchAnalysesHistory(
  paramsOrLimit: HistoryQueryParams | number = 20,
  offsetArg: number = 0
): Promise<PaginatedAnalysisHistory> {
  let params: HistoryQueryParams;
  if (typeof paramsOrLimit === 'number') {
    params = { limit: paramsOrLimit, offset: offsetArg };
  } else {
    params = paramsOrLimit || {};
  }

  const queryParts: string[] = [];
  if (params.limit !== undefined) queryParts.push(`limit=${encodeURIComponent(params.limit)}`);
  if (params.offset !== undefined) queryParts.push(`offset=${encodeURIComponent(params.offset)}`);
  if (params.search && params.search.trim()) queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
  if (params.risk_band && params.risk_band.trim()) queryParts.push(`risk_band=${encodeURIComponent(params.risk_band.trim())}`);
  if (params.sort && params.sort.trim()) queryParts.push(`sort=${encodeURIComponent(params.sort.trim())}`);
  if (params.order && params.order.trim()) queryParts.push(`order=${encodeURIComponent(params.order.trim())}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const url = `${API_BASE_URL}/api/v1/analyses${queryString}`;
  const sessionId = getAnonymousSessionId();

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: getRequestHeaders({
        'X-Session-ID': sessionId,
      }),
    });

    if (!response.ok) {
      return await handleResponseError(response);
    }

    return (await response.json()) as PaginatedAnalysisHistory;
  } catch (err: unknown) {
    if (err instanceof AuthentiHireApiError) throw err;
    throw new AuthentiHireApiError('Unable to retrieve analysis history.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Deletes an analysis record owned by the current user or session.
 */
export async function deleteAnalysis(analysisId: string): Promise<DeleteAnalysisResponse> {
  const url = `${API_BASE_URL}/api/v1/analyses/${analysisId}`;
  const sessionId = getAnonymousSessionId();

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: getRequestHeaders({
        'X-Session-ID': sessionId,
      }),
    });

    if (!response.ok) {
      return await handleResponseError(response);
    }

    return (await response.json()) as DeleteAnalysisResponse;
  } catch (err: unknown) {
    if (err instanceof AuthentiHireApiError) throw err;
    throw new AuthentiHireApiError('Unable to delete analysis record.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Checks backend service and ML model readiness.
 */
export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return await handleResponseError(response);
    }

    return (await response.json()) as HealthResponse;
  } catch (err: unknown) {
    if (err instanceof AuthentiHireApiError) throw err;
    throw new AuthentiHireApiError('Backend health service unavailable.', 0, 'NETWORK_ERROR');
  }
}

/**
 * Retrieves active model info, weights, and threshold configuration.
 */
export async function fetchModelInfo(): Promise<ModelInfoResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/model-info`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return await handleResponseError(response);
    }

    return (await response.json()) as ModelInfoResponse;
  } catch (err: unknown) {
    if (err instanceof AuthentiHireApiError) throw err;
    throw new AuthentiHireApiError('Backend model info unavailable.', 0, 'NETWORK_ERROR');
  }
}
