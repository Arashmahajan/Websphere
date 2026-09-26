import React, { createContext, useContext, useState, useEffect } from 'react';
import { Organization } from '../types/index.ts';
import { organizationApi, setupApi } from '../services/apiServices.ts';
import { sessionService } from '../services/sessionService.ts';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  setCurrentOrganization: (org: Organization | null) => void;
  loadOrganizations: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const setCurrentOrganization = (org: Organization | null) => {
    setCurrentOrganizationState(org);
    if (org) {
      sessionService.setActiveOrgId(org.id);
    } else {
      sessionService.clearActiveOrgId();
    }
  };

  const loadOrganizations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Check setup status first
      const statusRes = await setupApi.getStatus();
      setIsInitialized(Boolean(statusRes?.initialized));

      if (statusRes?.initialized) {
        const orgs = await organizationApi.getOrganizations();
        setOrganizations(orgs || []);

        // Restore active organization from session service or pick first
        const savedOrgId = sessionService.getActiveOrgId();
        const matched = orgs?.find((o) => o.id === savedOrgId) || orgs?.[0] || null;
        setCurrentOrganizationState(matched);
        if (matched) {
          sessionService.setActiveOrgId(matched.id);
        }
      } else {
        setOrganizations([]);
        setCurrentOrganizationState(null);
        sessionService.clearActiveOrgId();
      }
    } catch (err: any) {
      console.warn('Failed to load organization context:', err);
      setError(err?.message || 'Unable to connect to WorkSphere backend services.');
      setOrganizations([]);
      setCurrentOrganizationState(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOrganization = async () => {
    await loadOrganizations();
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        isLoading,
        error,
        isInitialized,
        setCurrentOrganization,
        loadOrganizations,
        refreshOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
