/**
 * WorkSphere Enterprise HCM: Centralized Session and Storage Abstraction
 *
 * Encapsulates client-side token storage and tenant/organization context.
 * Prevents scattering direct localStorage operations across components.
 */

const TOKEN_KEY = 'worksphere_auth_token';
const ORG_STORAGE_KEY = 'worksphere_active_organization_id';

export const sessionService = {
  // --- Auth Token Management ---
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // In private browsing or storage quota exceeded, fail safely
    }
  },

  clearToken: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // safe ignore
    }
  },

  isAuthenticated: (): boolean => {
    return Boolean(sessionService.getToken());
  },

  // --- Multi-tenant / Organization Context Management ---
  getActiveOrgId: (): string | null => {
    try {
      return localStorage.getItem(ORG_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  setActiveOrgId: (orgId: string): void => {
    try {
      localStorage.setItem(ORG_STORAGE_KEY, orgId);
    } catch {
      // safe ignore
    }
  },

  clearActiveOrgId: (): void => {
    try {
      localStorage.removeItem(ORG_STORAGE_KEY);
    } catch {
      // safe ignore
    }
  },

  // --- Complete Session Reset (e.g. on 401 or logout) ---
  clearSession: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ORG_STORAGE_KEY);
    } catch {
      // safe ignore
    }
  },
};

// Aliases for compatibility
export const authSession = sessionService;
export const tokenStorage = sessionService;
