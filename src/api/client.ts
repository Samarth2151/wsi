import { getApiBaseUrl } from '../config/api';
import type { AuthUser, LoginResponse } from '../types/wms';

export const ACCESS_TOKEN_STORAGE_KEY = 'wms_access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'wms_refresh_token';

export type ApiErrorFields = Record<string, string[]>;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly fields: ApiErrorFields;

  constructor(
    status: number,
    message: string,
    code: string | null = null,
    fields: ApiErrorFields = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeAuthTokens(access: string, refresh: string): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, access);
  window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refresh);
}

export function clearStoredAuthTokens(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    // A blocked storage API should not prevent the user from being redirected.
  }
}

function parseFieldErrors(value: unknown): ApiErrorFields {
  if (!isRecord(value)) return {};

  const fields: ApiErrorFields = {};
  for (const [name, messages] of Object.entries(value)) {
    if (['code', 'detail', 'fields', 'message'].includes(name)) continue;

    if (typeof messages === 'string') {
      fields[name] = [messages];
    } else if (Array.isArray(messages)) {
      fields[name] = messages.filter(
        (message): message is string => typeof message === 'string',
      );
    }
  }
  return fields;
}

async function readApiError(response: Response): Promise<ApiError> {
  let payload: unknown = null;
  const contentType = response.headers.get('content-type') ?? '';

  try {
    payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
  } catch {
    payload = null;
  }

  const root = isRecord(payload) ? payload : null;
  const envelope = root && isRecord(root.error) ? root.error : root;
  const rawMessage = envelope?.message ?? envelope?.detail;
  const fields = parseFieldErrors(envelope?.fields ?? envelope);
  const firstFieldMessage = Object.values(fields).flat()[0];
  const fallbackMessage =
    typeof payload === 'string' && payload.length > 0
      ? payload
      : response.statusText || `Request failed with status ${response.status}.`;
  const message =
    typeof rawMessage === 'string'
      ? rawMessage
      : firstFieldMessage ?? fallbackMessage;
  const code = typeof envelope?.code === 'string' ? envelope.code : null;

  return new ApiError(response.status, message, code, fields);
}

function redirectToLogin(): void {
  clearStoredAuthTokens();
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
}

async function request<TResponse>(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<TResponse> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  const accessToken = authenticated ? getStoredAccessToken() : null;
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${getApiBaseUrl()}${normalizedPath}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const error = await readApiError(response);
    if (authenticated && response.status === 401) {
      redirectToLogin();
    }
    throw error;
  }

  if (response.status === 204) return undefined as TResponse;
  return (await response.json()) as TResponse;
}

export function apiGet<TResponse>(path: string): Promise<TResponse> {
  return request<TResponse>(path, { method: 'GET' });
}

export function apiPost<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
): Promise<TResponse> {
  return request<TResponse>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiPatch<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
): Promise<TResponse> {
  return request<TResponse>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function apiDelete<TResponse = void>(path: string): Promise<TResponse> {
  return request<TResponse>(path, { method: 'DELETE' });
}

export function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>(
    '/api/auth/login/',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
    false,
  );
}

export function fetchMe(): Promise<AuthUser> {
  return apiGet<AuthUser>('/api/auth/me/');
}
