import React, { useState, useEffect } from 'react';
import { Employee, Department, Location } from '../../types/index.ts';
import { useUpdateEmployee } from './useEmployeeQueries.ts';
import { z } from 'zod';

const employeeUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Valid corporate email address required'),
  phone: z.string().min(6, 'Valid contact phone number required'),
  departmentId: z.string().min(1, 'Department selection is mandatory'),
  locationId: z.string().min(1, 'Location selection is mandatory'),
  jobTitle: z.string().min(2, 'Job title is required'),
  level: z.string().min(1, 'Designation level is required'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
  managerId: z.string().optional(),
  ctcAnnual: z.number().min(0, 'Annual CTC must be positive'),
});

interface EditEmployeeModalProps {
  isOpen: boolean;
  employee: Employee | null;
  departments: Department[];
  locations: Location[];
  managers: Employee[];
  onClose: () => void;
  onSuccess: (updated: Employee) => void;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  employee,
  departments,
  locations,
  managers,
  onClose,
  onSuccess,
}) => {
  const updateMutation = useUpdateEmployee();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    jobTitle: '',
    level: 'Level IC-4',
    managerId: '',
    locationId: '',
    employmentType: 'FULL_TIME',
    ctcAnnual: 2400000,
    bankAccountReference: '',
    ifscCode: '',
    panNumber: '',
    uanNumber: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        departmentId: employee.departmentId || (departments[0]?.id ?? ''),
        jobTitle: employee.jobTitle || '',
        level: employee.level || 'Level IC-4',
        managerId: employee.managerId || '',
        locationId: employee.locationId || (locations[0]?.id ?? ''),
        employmentType: employee.employmentType || 'FULL_TIME',
        ctcAnnual: employee.ctcAnnual || 2400000,
        bankAccountReference: employee.bankAccountReference || '',
        ifscCode: employee.ifscCode || '',
        panNumber: employee.panNumber || '',
        uanNumber: employee.uanNumber || '',
      });
      setValidationErrors({});
      setServerError(null);
    }
  }, [employee, departments, locations]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setValidationErrors({});

    // Prevent assigning self as manager
    if (formData.managerId && (formData.managerId === employee.id || formData.managerId === employee.employeeCode)) {
      setValidationErrors({ managerId: 'An employee cannot be assigned as their own manager.' });
      return;
    }

    const validationResult = employeeUpdateSchema.safeParse({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      departmentId: formData.departmentId,
      locationId: formData.locationId,
      jobTitle: formData.jobTitle,
      level: formData.level,
      employmentType: formData.employmentType,
      managerId: formData.managerId || undefined,
      ctcAnnual: Number(formData.ctcAnnual),
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setValidationErrors(fieldErrors);
      return;
    }

    try {
      const res = await updateMutation.mutateAsync({
        id: employee.id,
        data: {
          ...formData,
          employmentType: formData.employmentType as any,
          version: employee.version, // Pass version for optimistic locking
          ctcAnnual: Number(formData.ctcAnnual),
          baseMonthly: Math.round(Number(formData.ctcAnnual) / 20),
        },
      });

      onSuccess(res.employee || res.data || (res as any));
      onClose();
    } catch (err: any) {
      if (err.code === 'EMPLOYEE_MODIFIED_BY_ANOTHER_USER' || err.status === 409) {
        setServerError('This employee record was modified by another user. Please refresh and try again.');
      } else {
        setServerError(err.message || 'Failed to update employee record. Check network or server status.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl shadow-2xl p-space-base flex flex-col gap-space-md border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">edit_document</span>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Edit Personnel Record
              </span>
              <span className="text-secondary font-code-sm text-xs">
                {employee.employeeCode} · Version {employee.version ?? 0}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-secondary hover:text-on-surface hover:bg-surface-container cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {serverError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-base">warning</span>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-base">
          {/* Section 1: Core Bio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {validationErrors.firstName && (
                <span className="text-rose-600 text-xs">{validationErrors.firstName}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {validationErrors.lastName && (
                <span className="text-rose-600 text-xs">{validationErrors.lastName}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Corporate Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {validationErrors.email && (
                <span className="text-rose-600 text-xs">{validationErrors.email}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Section 2: Department, Manager, Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-2 border-t border-surface-container-low">
            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Department *</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none cursor-pointer"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Work Location *</label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none cursor-pointer"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Reporting Manager</label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="">No Direct Manager</option>
                {managers
                  .filter((m) => m.id !== employee.id && m.employeeCode !== employee.employeeCode)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.jobTitle})
                    </option>
                  ))}
              </select>
              {validationErrors.managerId && (
                <span className="text-rose-600 text-xs">{validationErrors.managerId}</span>
              )}
            </div>
          </div>

          {/* Section 3: Role & Engagement */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-2 border-t border-surface-container-low">
            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Job Title *</label>
              <input
                type="text"
                required
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {validationErrors.jobTitle && (
                <span className="text-rose-600 text-xs">{validationErrors.jobTitle}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Level / Band</label>
              <input
                type="text"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Contract Type *</label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="FULL_TIME">Full-time Regular</option>
                <option value="PART_TIME">Part-time</option>
                <option value="CONTRACT">Contractor</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>
          </div>

          {/* Section 4: Compensation & Statutory */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-2 border-t border-surface-container-low">
            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Annual CTC (INR) *</label>
              <input
                type="number"
                value={formData.ctcAnnual}
                onChange={(e) => setFormData({ ...formData, ctcAnnual: Number(e.target.value) })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">PAN Number</label>
              <input
                type="text"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Bank Account Reference</label>
              <input
                type="text"
                value={formData.bankAccountReference}
                onChange={(e) => setFormData({ ...formData, bankAccountReference: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-space-sm pt-4 border-t border-surface-container-low">
            <button
              type="button"
              onClick={onClose}
              className="px-space-md py-2 rounded bg-surface-container-low text-secondary hover:text-on-surface font-label-sm text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-space-lg py-2 rounded bg-primary text-on-primary font-label-sm text-sm font-semibold shadow-sm hover:bg-primary-container disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">check</span>
                  <span>Commit Record Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
