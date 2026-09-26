/**
 * WorkSphere Enterprise HCM: Frontend Environment & Runtime Configuration
 *
 * Strictly decoupled from backend infrastructure (No database URLs, Redis, Kafka, or secrets).
 * Consumes local or remote Spring Boot REST API via VITE_API_BASE_URL.
 */

export const env = {
  /**
   * API Base URL:
   * Defaults to empty string (relative '/api/v1' paths in local dev / proxy mode).
   * Overridden via VITE_API_BASE_URL to point to a running Spring Boot instance.
   */
  apiBaseUrl: ((import.meta.env.VITE_API_BASE_URL as string) || '').replace(/\/+$/, ''),

  /**
   * Runtime mode flags
   */
  isDev: Boolean(import.meta.env.DEV),
  isProd: Boolean(import.meta.env.PROD),
  mode: (import.meta.env.MODE as string) || 'development',
} as const;
