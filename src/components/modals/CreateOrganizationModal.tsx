import React, { useState } from 'react';
import { X, Building2, AlertCircle } from 'lucide-react';
import { organizationApi } from '../../services/apiServices.ts';
import { ApiClientError } from '../../services/apiClient.ts';
import { useOrganization } from '../../context/OrganizationContext.tsx';

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { refreshOrganization } = useOrganization();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    organizationCode: '',
    industry: 'Enterprise Software & Cloud',
    country: 'India',
    timezone: 'Asia/Kolkata',
    primaryEmail: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    website: '',
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'organizationCode' ? value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.legalName.trim() || !formData.organizationCode.trim()) {
      setError('Please fill out all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      await organizationApi.createOrganization(formData);
      await refreshOrganization();
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
        setError(err.message || 'Please correct the validation errors below.');
      } else {
        setError(err?.message || 'Failed to create organization.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant/60 rounded-3xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Create Organization</h2>
              <p className="text-xs text-on-surface-variant">Add a new legal corporate entity</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-error-container/30 border border-error/40 flex items-center gap-2 text-error text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Organization Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Acme Global"
                required
                className={`w-full px-3 py-2 bg-surface border rounded-xl text-sm ${
                  fieldErrors.name ? 'border-error focus:ring-error' : 'border-outline-variant/60'
                }`}
              />
              {fieldErrors.name && <p className="text-xs text-error mt-1">{fieldErrors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Legal Entity Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="legalName"
                value={formData.legalName}
                onChange={handleChange}
                placeholder="Acme Global Private Limited"
                required
                className={`w-full px-3 py-2 bg-surface border rounded-xl text-sm ${
                  fieldErrors.legalName ? 'border-error focus:ring-error' : 'border-outline-variant/60'
                }`}
              />
              {fieldErrors.legalName && <p className="text-xs text-error mt-1">{fieldErrors.legalName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Organization Code <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="organizationCode"
                value={formData.organizationCode}
                onChange={handleChange}
                placeholder="ACME01"
                required
                className={`w-full px-3 py-2 bg-surface border rounded-xl text-sm uppercase font-mono ${
                  fieldErrors.organizationCode ? 'border-error focus:ring-error' : 'border-outline-variant/60'
                }`}
              />
              {fieldErrors.organizationCode && (
                <p className="text-xs text-error mt-1">{fieldErrors.organizationCode}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Industry</label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="Software / IT Services"
                className="w-full px-3 py-2 bg-surface border border-outline-variant/60 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Country <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="India"
                required
                className={`w-full px-3 py-2 bg-surface border rounded-xl text-sm ${
                  fieldErrors.country ? 'border-error focus:ring-error' : 'border-outline-variant/60'
                }`}
              />
              {fieldErrors.country && <p className="text-xs text-error mt-1">{fieldErrors.country}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Timezone <span className="text-error">*</span>
              </label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-surface border border-outline-variant/60 rounded-xl text-sm"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Primary Email <span className="text-error">*</span>
              </label>
              <input
                type="email"
                name="primaryEmail"
                value={formData.primaryEmail}
                onChange={handleChange}
                placeholder="admin@acme.local"
                required
                className={`w-full px-3 py-2 bg-surface border rounded-xl text-sm ${
                  fieldErrors.primaryEmail ? 'border-error focus:ring-error' : 'border-outline-variant/60'
                }`}
              />
              {fieldErrors.primaryEmail && (
                <p className="text-xs text-error mt-1">{fieldErrors.primaryEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91-80-00000000"
                className={`w-full px-3 py-2 bg-surface border rounded-xl text-sm ${
                  fieldErrors.phone ? 'border-error focus:ring-error' : 'border-outline-variant/60'
                }`}
              />
              {fieldErrors.phone && <p className="text-xs text-error mt-1">{fieldErrors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Website</label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://acme.example.com"
                className={`w-full px-3 py-2 bg-surface border rounded-xl text-sm ${
                  fieldErrors.website ? 'border-error focus:ring-error' : 'border-outline-variant/60'
                }`}
              />
              {fieldErrors.website && <p className="text-xs text-error mt-1">{fieldErrors.website}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-on-surface mb-1">Address</label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                placeholder="Street address / campus"
                className="w-full px-3 py-2 bg-surface border border-outline-variant/60 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Bengaluru"
                className="w-full px-3 py-2 bg-surface border border-outline-variant/60 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Karnataka"
                className="w-full px-3 py-2 bg-surface border border-outline-variant/60 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-bold text-on-primary bg-primary hover:bg-primary/95 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
