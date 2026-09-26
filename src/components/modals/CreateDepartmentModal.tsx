import React, { useState } from 'react';
import { X, Network, AlertCircle } from 'lucide-react';
import { departmentApi } from '../../services/apiServices.ts';
import { ApiClientError } from '../../services/apiClient.ts';
import { useOrganization } from '../../context/OrganizationContext.tsx';

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateDepartmentModal: React.FC<CreateDepartmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentOrganization } = useOrganization();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    headcountTarget: 10,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setError('Please provide department name and code');
      return;
    }

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      await departmentApi.createDepartment({
        ...formData,
        code: formData.code.toUpperCase(),
        organizationId: currentOrganization?.id,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
        setError(err.message || 'Please correct the validation errors below.');
      } else {
        setError(err?.message || 'Failed to create department');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/60 rounded-3xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Create Department</h2>
              <p className="text-xs text-on-surface-variant">Add operational department to organization</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer"
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Department Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFieldErrors((prev) => {
                  const n = { ...prev };
                  delete n.name;
                  return n;
                });
                setFormData((p) => ({ ...p, name: e.target.value }));
              }}
              placeholder="e.g. Engineering & Product"
              required
              className={`w-full px-3 py-2 bg-surface border rounded-xl text-sm ${
                fieldErrors.name ? 'border-error focus:ring-error' : 'border-outline-variant/60'
              }`}
            />
            {fieldErrors.name && <p className="text-xs text-error mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Department Code <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setFieldErrors((prev) => {
                  const n = { ...prev };
                  delete n.code;
                  return n;
                });
                setFormData((p) => ({ ...p, code: val }));
              }}
              placeholder="e.g. ENG"
              required
              className={`w-full px-3 py-2 bg-surface border rounded-xl text-sm uppercase font-mono ${
                fieldErrors.code ? 'border-error focus:ring-error' : 'border-outline-variant/60'
              }`}
            />
            {fieldErrors.code && <p className="text-xs text-error mt-1">{fieldErrors.code}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Headcount Target
            </label>
            <input
              type="number"
              value={formData.headcountTarget}
              onChange={(e) => setFormData((p) => ({ ...p, headcountTarget: parseInt(e.target.value) || 0 }))}
              min={0}
              className="w-full px-3 py-2 bg-surface border border-outline-variant/60 rounded-xl text-sm"
            />
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
              {submitting ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
