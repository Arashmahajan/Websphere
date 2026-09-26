import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Globe,
  Clock,
  Mail,
  Phone,
  Eye,
  CheckCircle2,
  XCircle,
  Search,
} from 'lucide-react';
import { useOrganizations } from './useOrganizationQueries.ts';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { InfrastructureError } from '../../components/common/InfrastructureError.tsx';
import { useOrganization as useActiveOrgContext } from '../../context/OrganizationContext.tsx';

interface OrganizationListViewProps {
  onSelectOrganization: (orgId: string) => void;
  onCreateOrganization: () => void;
}

export const OrganizationListView: React.FC<OrganizationListViewProps> = ({
  onSelectOrganization,
  onCreateOrganization,
}) => {
  const { currentOrganization, setCurrentOrganization } = useActiveOrgContext();
  const { data: organizations = [], isLoading, isError, error, refetch } = useOrganizations();
  const [search, setSearch] = useState('');

  const filtered = organizations.filter((org) => {
    const q = search.toLowerCase();
    return (
      org.name?.toLowerCase().includes(q) ||
      org.organizationCode?.toLowerCase().includes(q) ||
      org.legalName?.toLowerCase().includes(q) ||
      org.country?.toLowerCase().includes(q)
    );
  });

  if (isError) {
    return (
      <InfrastructureError
        title="Unable to load organizations."
        message="The WorkSphere service is currently unavailable."
        retryText="Retry"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Organizations</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Enterprise legal entities, subsidiaries, and root workforce employers
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateOrganization}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-on-primary bg-primary hover:bg-primary/95 rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Organization</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-sm text-on-surface-variant flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium text-slate-600">Loading organizations...</span>
        </div>
      ) : organizations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet."
          description="Create your first organization to get started."
          primaryAction={{
            label: 'Create Organization',
            onClick: onCreateOrganization,
            icon: Plus,
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, legal name, or country..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
            />
          </div>

          {/* Organizations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((org) => {
              const isActiveTenant = currentOrganization?.id === org.id;

              return (
                <div
                  key={org.id}
                  className={`group relative p-6 bg-surface-container-lowest border rounded-2xl shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
                    isActiveTenant ? 'border-primary ring-2 ring-primary/10' : 'border-outline-variant/60'
                  }`}
                >
                  <div>
                    {/* Header badge & status */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-surface-container-high font-mono text-xs font-bold text-on-surface tracking-wider">
                          {org.organizationCode}
                        </span>
                        {isActiveTenant && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-[10px] tracking-wide uppercase">
                            Active Tenant
                          </span>
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          org.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {org.status === 'ACTIVE' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        )}
                        <span>{org.status}</span>
                      </span>
                    </div>

                    {/* Org Names */}
                    <h3 className="font-bold text-lg text-on-surface tracking-tight group-hover:text-primary transition-colors">
                      {org.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant/80 mt-0.5 line-clamp-1">
                      {org.legalName}
                    </p>

                    {/* Metadata lines */}
                    <div className="mt-4 pt-4 border-t border-outline-variant/30 space-y-2 text-xs text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span>{org.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span>{org.timezone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span className="truncate">{org.primaryEmail}</span>
                      </div>
                      {org.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-secondary shrink-0" />
                          <span>{org.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-6 pt-4 border-t border-outline-variant/40 flex items-center justify-between gap-2">
                    {!isActiveTenant ? (
                      <button
                        type="button"
                        onClick={() => setCurrentOrganization(org)}
                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      >
                        Switch Context
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-medium">Selected</span>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectOrganization(org.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high/80 hover:bg-surface-container-highest text-xs font-semibold text-on-surface transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View & Edit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
