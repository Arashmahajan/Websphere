import React, { useState, useEffect } from 'react';
import {
  Building2,
  ArrowLeft,
  Edit3,
  Save,
  X,
  Globe,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Organization, OrganizationStatus } from '../../types/index.ts';
import { organizationApi } from '../../services/apiServices.ts';
import { useOrganization } from '../../context/OrganizationContext.tsx';
import { InfrastructureError } from '../../components/common/InfrastructureError.tsx';

interface OrganizationDetailViewProps {
  organizationId: string;
  onBack: () => void;
}

export const OrganizationDetailView: React.FC<OrganizationDetailViewProps> = ({
  organizationId,
  onBack,
}) => {
  const { refreshOrganization } = useOrganization();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    industry: '',
    country: '',
    timezone: '',
    primaryEmail: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    website: '',
    status: 'ACTIVE' as OrganizationStatus,
  });

  const fetchOrganization = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationApi.getOrganizationById(organizationId);
      setOrganization(data);
      setFormData({
        name: data.name || '',
        legalName: data.legalName || '',
        industry: data.industry || '',
        country: data.country || '',
        timezone: data.timezone || '',
        primaryEmail: data.primaryEmail || '',
        phone: data.phone || '',
        addressLine1: data.addressLine1 || '',
        addressLine2: data.addressLine2 || '',
        city: data.city || '',
        state: data.state || '',
        postalCode: data.postalCode || '',
        website: data.website || '',
        status: data.status || 'ACTIVE',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load organization details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [organizationId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await organizationApi.updateOrganization(organizationId, formData);
      setOrganization(updated);
      setIsEditing(false);
      setSaveSuccess(true);
      await refreshOrganization();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update organization details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-on-surface-variant flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span>Loading organization details...</span>
      </div>
    );
  }

  if (error && !organization) {
    return <InfrastructureError message={error} onRetry={fetchOrganization} />;
  }

  if (!organization) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Organizations</span>
        </button>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-on-primary bg-primary hover:bg-primary/95 rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Information</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface bg-surface-container-high rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              form="org-edit-form"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-on-primary bg-primary hover:bg-primary/95 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Organization changes saved successfully to PostgreSQL.</span>
        </div>
      )}

      {/* Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl font-mono tracking-wider">
            {organization.organizationCode.substring(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">
                {organization.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  organization.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {organization.status}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mt-0.5">{organization.legalName}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-[11px] font-mono text-on-surface-variant uppercase font-semibold">
                CODE: {organization.organizationCode}
              </span>
              <span className="text-xs text-on-surface-variant">
                Registered in {organization.country}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Form / View */}
      {isEditing ? (
        <form id="org-edit-form" onSubmit={handleSave} className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 space-y-6">
          <h2 className="text-lg font-bold text-on-surface border-b border-outline-variant/40 pb-3">
            Edit Organization Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Organization Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Legal Name</label>
              <input
                type="text"
                name="legalName"
                value={formData.legalName}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Industry</label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Primary Email</label>
              <input
                type="email"
                name="primaryEmail"
                value={formData.primaryEmail}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Website</label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-on-surface mb-1">Address Line 1</label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">State / Province</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: General Information */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 space-y-4">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/40 pb-3">
              <Building2 className="w-4 h-4 text-primary" />
              <span>General Information</span>
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <dt className="text-on-surface-variant font-medium">Organization Name</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{organization.name}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant font-medium">Organization Code</dt>
                <dd className="font-mono font-semibold text-primary mt-0.5">{organization.organizationCode}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant font-medium">Legal Name</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{organization.legalName}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant font-medium">Industry</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{organization.industry || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant font-medium">Website</dt>
                <dd className="font-semibold text-primary mt-0.5 truncate">{organization.website || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant font-medium">Lifecycle Status</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{organization.status}</dd>
              </div>
            </dl>
          </div>

          {/* Section 2: Contact Information */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 space-y-4">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/40 pb-3">
              <Mail className="w-4 h-4 text-primary" />
              <span>Contact Information</span>
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div className="col-span-2">
                <dt className="text-on-surface-variant font-medium">Primary Email</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{organization.primaryEmail}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant font-medium">Phone Number</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{organization.phone || 'Not specified'}</dd>
              </div>
            </dl>
          </div>

          {/* Section 3: Regional Settings */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 space-y-4">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/40 pb-3">
              <Globe className="w-4 h-4 text-primary" />
              <span>Regional Settings</span>
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <dt className="text-on-surface-variant font-medium">Country</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{organization.country}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant font-medium">Timezone</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{organization.timezone}</dd>
              </div>
            </dl>
          </div>

          {/* Section 4: Registered Address */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 space-y-4">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/40 pb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Registered Address</span>
            </h3>
            <div className="text-xs text-on-surface space-y-1">
              <p className="font-semibold">{organization.addressLine1 || 'No address line configured'}</p>
              {organization.addressLine2 && <p>{organization.addressLine2}</p>}
              <p className="text-on-surface-variant">
                {[organization.city, organization.state, organization.postalCode].filter(Boolean).join(', ') || 'No city/state'}
              </p>
            </div>
          </div>

          {/* Section 5: Metadata & Timestamps */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 space-y-4 md:col-span-2">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/40 pb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <span>System Metadata</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-on-surface-variant font-medium">Created On</span>
                <p className="font-semibold text-on-surface mt-0.5">
                  {new Date(organization.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Last Updated</span>
                <p className="font-semibold text-on-surface mt-0.5">
                  {new Date(organization.updatedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Entity Version</span>
                <p className="font-mono font-semibold text-on-surface mt-0.5">
                  v{organization.version || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
