import React, { useState } from 'react';
import { Employee, Department, Location } from '../../types/index.ts';
import { useDepartments, useLocations, useManagers } from '../../features/employees/useEmployeeQueries.ts';
import { z } from 'zod';

const createEmployeeSchema = z.object({
  employeeCode: z.string().optional(),
  firstName: z.string().min(1, 'First name is mandatory').max(100),
  lastName: z.string().min(1, 'Last name is mandatory').max(100),
  email: z.string().email('Please enter a valid corporate email address'),
  phone: z.string().min(6, 'Valid contact phone number required'),
  dateOfBirth: z.string().min(1, 'Date of birth is mandatory'),
  dateOfJoining: z.string().min(1, 'Date of joining is mandatory'),
  departmentId: z.string().min(1, 'Department selection is mandatory'),
  locationId: z.string().min(1, 'Location selection is mandatory'),
  jobTitle: z.string().min(2, 'Job title is mandatory'),
  level: z.string().min(1, 'Designation level is mandatory'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
  managerId: z.string().optional(),
  ctcAnnual: z.number().min(0, 'Annual CTC must be positive'),
  status: z.enum(['ACTIVE', 'PROBATION', 'ON_LEAVE', 'NOTICE']).default('ACTIVE'),
});

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employeeData: Partial<Employee>) => Promise<void>;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { data: departments = [] } = useDepartments();
  const { data: locations = [] } = useLocations();
  const { data: managers = [] } = useManagers();

  const [formData, setFormData] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '+91 98000 ',
    dateOfBirth: '1995-05-15',
    dateOfJoining: new Date().toISOString().split('T')[0],
    departmentId: '',
    jobTitle: '',
    level: 'Level IC-3',
    managerId: '',
    locationId: '',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    ctcAnnual: 2400000,
    bankAccountReference: 'HDFC-xxxx-7788',
    ifscCode: 'HDFC0001223',
    panNumber: 'ABCDE1234F',
    uanNumber: '100988776655',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const resolvedDeptId = formData.departmentId || departments[0]?.id || 'dept-1';
  const resolvedLocId = formData.locationId || locations[0]?.id || 'loc-blr';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setValidationErrors({});

    const parseResult = createEmployeeSchema.safeParse({
      employeeCode: formData.employeeCode.trim() || undefined,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      dateOfBirth: formData.dateOfBirth,
      dateOfJoining: formData.dateOfJoining,
      departmentId: resolvedDeptId,
      locationId: resolvedLocId,
      jobTitle: formData.jobTitle.trim(),
      level: formData.level,
      employmentType: formData.employmentType as any,
      managerId: formData.managerId || undefined,
      ctcAnnual: Number(formData.ctcAnnual),
      status: formData.status as any,
    });

    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      parseResult.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);

      const targetDept = departments.find((d) => d.id === resolvedDeptId);
      const targetLoc = locations.find((l) => l.id === resolvedLocId);
      const targetMgr = managers.find((m) => m.id === formData.managerId);

      await onSubmit({
        employeeCode: formData.employeeCode.trim() || undefined,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth,
        dateOfJoining: formData.dateOfJoining,
        departmentId: resolvedDeptId,
        departmentName: targetDept?.name || 'Engineering & Product',
        jobTitle: formData.jobTitle.trim(),
        level: formData.level,
        managerId: formData.managerId || undefined,
        managerName: targetMgr ? `${targetMgr.firstName} ${targetMgr.lastName}` : 'Ananya Roy',
        locationId: resolvedLocId,
        locationName: targetLoc?.name || 'Bengaluru (Campus 1)',
        employmentType: formData.employmentType as any,
        status: formData.status as any,
        ctcAnnual: Number(formData.ctcAnnual),
        baseMonthly: Math.round(Number(formData.ctcAnnual) / 20),
        bankAccountReference: formData.bankAccountReference || 'HDFC-xxxx-7788',
        ifscCode: formData.ifscCode || 'HDFC0001223',
        panNumber: formData.panNumber || 'AAAAA0000A',
        uanNumber: formData.uanNumber || '100999999999',
      });

      onClose();
    } catch (err: any) {
      if (err.status === 409 || err.code === 'DUPLICATE_EMAIL') {
        setErrorMsg('Duplicate corporate email: An employee with this email already exists.');
      } else if (err.code === 'DUPLICATE_EMPLOYEE_CODE') {
        setErrorMsg('Duplicate Employee Code: This employee ID code is already taken.');
      } else {
        setErrorMsg(err.message || 'Failed to onboard employee record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl shadow-2xl p-space-base flex flex-col gap-space-md border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">person_add</span>
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Onboard New Enterprise Personnel
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-secondary hover:text-on-surface hover:bg-surface-container cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-base">
          {/* Section 1: Identification & Names */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">
                Employee Code (Optional)
              </label>
              <input
                type="text"
                placeholder="Auto-generated if blank"
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {validationErrors.employeeCode && (
                <span className="text-rose-600 text-xs">{validationErrors.employeeCode}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">First Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul"
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
                placeholder="e.g. Verma"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {validationErrors.lastName && (
                <span className="text-rose-600 text-xs">{validationErrors.lastName}</span>
              )}
            </div>
          </div>

          {/* Section 2: Contact & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="font-label-xs text-secondary font-semibold uppercase">Corporate Email *</label>
              <input
                type="email"
                required
                placeholder="name@worksphere.local"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {validationErrors.email && (
                <span className="text-rose-600 text-xs">{validationErrors.email}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Date of Birth *</label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Section 3: Organization & Manager */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-2 border-t border-surface-container-low">
            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Department *</label>
              <select
                value={resolvedDeptId}
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
                value={resolvedLocId}
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
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ({m.jobTitle})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 4: Role, Level, Engagement */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md pt-2 border-t border-surface-container-low">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="font-label-xs text-secondary font-semibold uppercase">Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Lead Distributed Systems Engineer"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {validationErrors.jobTitle && (
                <span className="text-rose-600 text-xs">{validationErrors.jobTitle}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Level / Band *</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="Level IC-1">Level IC-1 (Junior)</option>
                <option value="Level IC-2">Level IC-2 (Mid)</option>
                <option value="Level IC-3">Level IC-3 (Senior)</option>
                <option value="Level IC-4">Level IC-4 (Lead)</option>
                <option value="Level IC-5">Level IC-5 (Staff)</option>
                <option value="Level IC-6">Level IC-6 (Principal)</option>
                <option value="Level M-1">Level M-1 (Manager)</option>
                <option value="Level E-1">Level E-1 (Executive)</option>
              </select>
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

          {/* Section 5: Date Joined, CTC, Statutory */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-2 border-t border-surface-container-low">
            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Joining Date *</label>
              <input
                type="date"
                required
                value={formData.dateOfJoining}
                onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Annual CTC (INR) *</label>
              <input
                type="number"
                required
                value={formData.ctcAnnual}
                onChange={(e) => setFormData({ ...formData, ctcAnnual: Number(e.target.value) })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase">Income Tax PAN</label>
              <input
                type="text"
                placeholder="ABCDE1234F"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                className="h-9 px-space-sm rounded bg-surface-container-low border border-slate-200 text-sm text-on-surface font-mono focus:outline-none"
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
              disabled={isSubmitting}
              className="px-space-lg py-2 rounded bg-primary text-on-primary font-label-sm text-sm font-semibold shadow-sm hover:bg-primary-container disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Onboarding Personnel...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">person_add</span>
                  <span>Confirm & Save Employee</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
