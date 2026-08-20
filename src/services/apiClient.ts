/**
 * Centralized HTTP client for the Django REST API. All request
 * construction, JSON parsing, CSRF handling, and error normalization lives
 * here so components and services never call fetch() directly.
 */

// Relative (e.g. '/api') in production; absolute 
// (e.g. 'http://localhost:8000/api') is used for local
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]> | null;

  constructor(status: number, detail: string, errors: Record<string, string[]> | null) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  // Second arg makes a relative API_BASE_URL resolve against the current
  // page instead of throwing (URL() requires an absolute URL otherwise).
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Every call to the Django API goes through this — never fetch() directly elsewhere. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  // Django's SessionAuthentication requires the CSRF token on unsafe methods.
  if (UNSAFE_METHODS.has(method)) {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) headers['X-CSRFToken'] = csrfToken;
  }

  const response = await fetch(buildUrl(path, options.query), {
    method,
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = (data && typeof data.detail === 'string' && data.detail) || 'Request failed.';
    const errors = (data && typeof data === 'object' && data.errors) || null;
    throw new ApiError(response.status, detail, errors);
  }

  return data as T;
}

/**
 * An AJAX-only SPA never triggers Django's normal CSRF-cookie-setting paths,
 * so this must be called at least once (e.g. app startup, or right before
 * login) before any unsafe request will carry a valid X-CSRFToken header.
 * See backend `GET /api/auth/csrf/`.
 */
export async function ensureCsrfCookie(): Promise<void> {
  if (getCookie('csrftoken')) return;
  await apiRequest('/auth/csrf/');
}

