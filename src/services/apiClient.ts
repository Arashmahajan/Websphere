import { env } from '../config/env.ts';
import { sessionService } from './sessionService.ts';

export { sessionService, sessionService as authSession, sessionService as tokenStorage } from './sessionService.ts';

export interface ApiErrorPayload {
  timestamp?: string;
  status?: number;
  error?: string;
  code?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  errors?: Array<{ field?: string; property?: string; defaultMessage?: string; message?: string }>;
  violations?: Array<{ propertyPath?: string; message?: string }>;
  path?: string;
}

export class ApiClientError extends Error {
  status: number;
  code: string;
  fieldErrors: Record<string, string>;
  timestamp?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    fieldErrors: Record<string, string> = {},
    timestamp?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.timestamp = timestamp || new Date().toISOString();
  }

  getFieldError(field: string): string | undefined {
    return this.fieldErrors[field];
  }
}

/**
 * Extracts and standardizes field-level errors from Spring Boot responses.
 * Supports both Map<String, String> fieldErrors, MethodArgumentNotValidException BindingResult lists,
 * and Hibernate Validator ConstraintViolation violations.
 */
export function extractFieldErrors(data: any): Record<string, string> {
  const result: Record<string, string> = {};
  if (!data || typeof data !== 'object') return result;

  // Direct map: { fieldErrors: { organizationCode: "Organization code already exists" } }
  if (data.fieldErrors && typeof data.fieldErrors === 'object' && !Array.isArray(data.fieldErrors)) {
    for (const [key, val] of Object.entries(data.fieldErrors)) {
      if (typeof val === 'string') {
        result[key] = val;
      }
    }
  }

  // Spring MethodArgumentNotValidException: { errors: [{ field: "email", defaultMessage: "invalid" }] }
  if (Array.isArray(data.errors)) {
    for (const err of data.errors) {
      const field = err.field || err.property;
      const message = err.defaultMessage || err.message;
      if (field && message && !result[field]) {
        result[field] = message;
      }
    }
  }

  // Hibernate Validator violations: { violations: [{ propertyPath: "code", message: "invalid" }] }
  if (Array.isArray(data.violations)) {
    for (const v of data.violations) {
      const field = v.propertyPath;
      const message = v.message;
      if (field && message && !result[field]) {
        result[field] = message;
      }
    }
  }

  return result;
}

/**
 * Sanitizes backend error messages to prevent exposing stack traces or raw class names.
 */
function isSafeMessage(msg?: string): boolean {
  if (!msg || typeof msg !== 'string') return false;
  // If it contains Java exception class signatures or stack traces, filter it out
  if (/Exception|Error:|at [a-zA-Z0-9_.]+\([a-zA-Z0-9_.]+\.java:\d+\)|org\.springframework|java\.lang/i.test(msg)) {
    return false;
  }
  return true;
}

/**
 * Resolves API URL with VITE_API_BASE_URL prefix if defined.
 * Handles both relative and absolute endpoints without repeating /api/v1 prefixes.
 */
export function resolveUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  const base = env.apiBaseUrl;
  if (!base) {
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }

  const cleanBase = base.replace(/\/+$/, '');
  const baseHasApiV1 = /\/api\/v1$/.test(cleanBase);

  let normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (baseHasApiV1 && normalizedEndpoint.startsWith('/api/v1')) {
    normalizedEndpoint = normalizedEndpoint.substring(7) || '/';
  }

  const cleanPath = normalizedEndpoint.startsWith('/') ? normalizedEndpoint : `/${normalizedEndpoint}`;
  return `${cleanBase}${cleanPath}`;
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Centralized HTTP request pipeline with timeout, error translation, authorization,
 * and multi-tenant organization context headers.
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = sessionService.getToken();
  const orgId = sessionService.getActiveOrgId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Attach Bearer token when an authenticated session exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Attach organization context if available and not explicitly overridden
  if (orgId && !headers['X-Organization-Id']) {
    headers['X-Organization-Id'] = orgId;
  }

  const targetUrl = resolveUrl(endpoint);
  const timeoutMs = options.timeoutMs || 15000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetUrl, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: ApiErrorPayload = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      const status = response.status;
      const fieldErrors = extractFieldErrors(errorData);

      // Handle specific HTTP statuses per Requirements 7, 8, 13
      let clientMessage = '';
      let errorCode = errorData.code || 'API_ERROR';

      if (status === 400) {
        errorCode = 'BAD_REQUEST';
        clientMessage = isSafeMessage(errorData.message)
          ? errorData.message!
          : 'Bad request. Please check the entered data.';
      } else if (status === 401) {
        sessionService.clearToken();
        errorCode = 'UNAUTHORIZED';
        clientMessage = 'Your session has expired. Please sign in again.';
      } else if (status === 403) {
        errorCode = 'FORBIDDEN';
        clientMessage = 'You do not have permission to perform this action.';
      } else if (status === 404) {
        errorCode = 'NOT_FOUND';
        clientMessage = 'The requested resource could not be found.';
      } else if (status === 409) {
        errorCode = 'CONFLICT';
        clientMessage = isSafeMessage(errorData.message)
          ? errorData.message!
          : 'A resource with this identifier already exists.';
      } else if (status === 422) {
        errorCode = 'VALIDATION_ERROR';
        clientMessage = isSafeMessage(errorData.message)
          ? errorData.message!
          : 'Validation error. Please verify the highlighted fields.';
      } else if (status === 429) {
        errorCode = 'TOO_MANY_REQUESTS';
        clientMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (status === 500 || status === 503) {
        errorCode = status === 503 ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_SERVER_ERROR';
        clientMessage = 'Something went wrong while connecting to WorkSphere. Please try again.';
      } else {
        clientMessage = isSafeMessage(errorData.message)
          ? errorData.message!
          : 'Something went wrong while connecting to WorkSphere. Please try again.';
      }

      throw new ApiClientError(
        status,
        errorCode,
        clientMessage,
        fieldErrors,
        errorData.timestamp
      );
    }

    // Parse JSON safely or return empty object for 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err instanceof ApiClientError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw new ApiClientError(
        504,
        'TIMEOUT',
        'WorkSphere request timed out. Please verify network connectivity.'
      );
    }

    // Genuine infrastructure or network error (Never expose raw exceptions)
    throw new ApiClientError(
      503,
      'INFRASTRUCTURE_UNAVAILABLE',
      'Something went wrong while connecting to WorkSphere. Please try again.'
    );
  }
}

export const apiClient = {
  get: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'GET' }),

  post: <T>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'DELETE' }),
};
