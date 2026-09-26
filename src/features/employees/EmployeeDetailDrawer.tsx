import React, { useState, useEffect } from 'react';
import { Employee, AuditLog } from '../../types/index.ts';
import { auditApi } from '../../services/apiServices.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface EmployeeDetailDrawerProps {
  employee: Employee | null;
  onClose: () => void;
  onEdit: (emp: Employee) => void;
  onChangeStatus: (emp: Employee) => void;
  onSelectEmployeeForPayslip?: (empCode: string) => void;
}

type DetailTab = 'overview' | 'employment' | 'organization' | 'contact' | 'activity';

export const EmployeeDetailDrawer: React.FC<EmployeeDetailDrawerProps> = ({
  employee,
  onClose,
  onEdit,
  onChangeStatus,
  onSelectEmployeeForPayslip,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  const canEdit =
    currentUser?.role === 'SYSTEM_ADMIN' ||
    currentUser?.role === 'HR_ADMIN' ||
    currentUser?.permissions.includes('EMPLOYEE_WRITE');

  const canChangeStatus =
    currentUser?.role === 'SYSTEM_ADMIN' ||
    currentUser?.role === 'HR_ADMIN' ||
    currentUser?.permissions.includes('EMPLOYEE_STATUS_CHANGE') ||
    currentUser?.permissions.includes('EMPLOYEE_WRITE');

  useEffect(() => {
    if (employee && activeTab === 'activity') {
      setIsLoadingActivity(true);
      auditApi
        .getLogs()
        .then((res: any) => {
          const matching = (res?.logs || []).filter(
            (log: any) =>
              log.resourceId === employee.employeeCode ||
              log.resourceId === employee.id ||
              log.details?.includes(employee.employeeCode) ||
              log.details?.includes(employee.firstName)
          );
          setActivityLogs(matching);
        })
        .catch((err: any) => console.error('Failed to load employee activity', err))
        .finally(() => setIsLoadingActivity(false));
    }
  }, [employee, activeTab]);

  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-inverse-surface/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl bg-surface-container-lowest h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto border-l border-slate-200">
        <div className="flex flex-col gap-4">
          {/* Drawer Top Header */}
          <div className="flex items-center justify-between pb-3 border-b border-surface-container-low">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">badge</span>
              <span className="font-headline-sm text-lg font-bold text-on-surface">
                Personnel Profile & Record
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-secondary hover:bg-surface-container hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Profile Card Header */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-slate-200">
            <div className="flex items-center gap-4">
              {employee.avatarUrl ? (
                <img
                  src={employee.avatarUrl}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover shadow-sm border border-white"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary text-on-primary font-bold text-xl flex items-center justify-center shadow-sm">
                  {employee.firstName[0]}
                  {employee.lastName[0]}
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-lg font-bold text-on-surface">
                    {employee.firstName} {employee.lastName}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-xs text-[10px] font-bold ${
                      employee.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : employee.status === 'ON_LEAVE'
                        ? 'bg-blue-100 text-blue-800'
                        : employee.status === 'SUSPENDED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {employee.status}
                  </span>
                </div>
                <span className="font-code-sm text-xs font-semibold text-primary">
                  {employee.employeeCode} · {employee.level}
                </span>
                <span className="font-body-xs text-xs text-secondary mt-0.5">
                  {employee.jobTitle} • {employee.departmentName}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col gap-1.5">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(employee)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-xs font-semibold text-on-surface border border-slate-200 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-secondary">edit</span>
                  <span>Edit</span>
                </button>
              )}
              {canChangeStatus && (
                <button
                  type="button"
                  onClick={() => onChangeStatus(employee)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-xs font-semibold text-secondary hover:text-on-surface border border-slate-200 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                  <span>Status</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-surface-container-low text-xs font-semibold text-secondary">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent hover:text-on-surface'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('employment')}
              className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'employment'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent hover:text-on-surface'
              }`}
            >
              Employment & Pay
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('organization')}
              className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'organization'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent hover:text-on-surface'
              }`}
            >
              Organization
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('contact')}
              className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'contact'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent hover:text-on-surface'
              }`}
            >
              Identity & Contact
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'activity'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent hover:text-on-surface'
              }`}
            >
              Activity & Audit
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                <span className="text-secondary font-semibold uppercase text-[10px]">Department</span>
                <span className="font-semibold text-on-surface text-sm mt-0.5">
                  {employee.departmentName}
                </span>
                <span className="text-[10px] text-secondary mt-0.5">Ref: {employee.departmentId}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                <span className="text-secondary font-semibold uppercase text-[10px]">Direct Manager</span>
                <span className="font-semibold text-on-surface text-sm mt-0.5">
                  {employee.managerName || 'None assigned'}
                </span>
                <span className="text-[10px] text-secondary mt-0.5">
                  {employee.managerId ? `ID: ${employee.managerId}` : 'Reports directly to Board/C-Suite'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                <span className="text-secondary font-semibold uppercase text-[10px]">Office Location Hub</span>
                <span className="font-semibold text-on-surface text-sm mt-0.5">
                  {employee.locationName}
                </span>
                <span className="text-[10px] text-secondary mt-0.5">Primary Tax Jurisdiction</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                <span className="text-secondary font-semibold uppercase text-[10px]">Date of Joining</span>
                <span className="font-mono font-semibold text-on-surface text-sm mt-0.5">
                  {employee.dateOfJoining}
                </span>
                <span className="text-[10px] text-secondary mt-0.5">Statutory Service Tenure Active</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                <span className="text-secondary font-semibold uppercase text-[10px]">Engagement Contract</span>
                <span className="font-semibold text-on-surface text-sm mt-0.5 capitalize">
                  {employee.employmentType.toLowerCase().replace('_', '-')}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                <span className="text-secondary font-semibold uppercase text-[10px]">Optimistic Version</span>
                <span className="font-mono font-semibold text-on-surface text-sm mt-0.5">
                  v{employee.version ?? 0}
                </span>
                <span className="text-[10px] text-secondary mt-0.5">ACID Concurrency Shield</span>
              </div>
            </div>
          )}

          {/* Tab 2: Employment & Compensation */}
          {activeTab === 'employment' && (
            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-2">
                <span className="text-secondary font-semibold uppercase text-[10px]">Compensation Structure</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="p-2 rounded bg-surface-container-lowest">
                    <span className="text-secondary text-[11px]">Annual Cost to Company (CTC)</span>
                    <div className="font-mono text-base font-bold text-on-surface mt-0.5">
                      ₹{employee.ctcAnnual.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-surface-container-lowest">
                    <span className="text-secondary text-[11px]">Computed Monthly Base</span>
                    <div className="font-mono text-base font-bold text-on-surface mt-0.5">
                      ₹{employee.baseMonthly.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-2">
                <span className="text-secondary font-semibold uppercase text-[10px]">Disbursement Routing</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-secondary text-[11px]">Bank Account Reference</span>
                    <div className="font-mono text-xs font-semibold text-on-surface mt-0.5">
                      {employee.bankAccountReference}
                    </div>
                  </div>
                  <div>
                    <span className="text-secondary text-[11px]">IFSC Code</span>
                    <div className="font-mono text-xs font-semibold text-on-surface mt-0.5">
                      {employee.ifscCode}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Organization */}
          {activeTab === 'organization' && (
            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
                <span className="text-secondary font-semibold uppercase text-[10px]">Hierarchy Structure</span>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container font-bold flex items-center justify-center text-xs">
                    {(employee.managerName || 'Mgr')[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-on-surface">{employee.managerName || 'Direct Executive'}</span>
                    <span className="text-[11px] text-secondary">Reporting Manager ({employee.departmentName})</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
                <span className="text-secondary font-semibold uppercase text-[10px]">Department Details</span>
                <span className="font-semibold text-on-surface text-sm mt-1">{employee.departmentName}</span>
                <span className="text-secondary text-xs">Assigned ID: {employee.departmentId}</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
                <span className="text-secondary font-semibold uppercase text-[10px]">Office Facility</span>
                <span className="font-semibold text-on-surface text-sm mt-1">{employee.locationName}</span>
                <span className="text-secondary text-xs">Assigned Hub ID: {employee.locationId}</span>
              </div>
            </div>
          )}

          {/* Tab 4: Contact & Identity */}
          {activeTab === 'contact' && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                <span className="text-secondary font-semibold uppercase text-[10px]">Official Email</span>
                <span className="font-semibold text-on-surface text-xs mt-1 truncate">{employee.email}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                <span className="text-secondary font-semibold uppercase text-[10px]">Contact Phone</span>
                <span className="font-semibold text-on-surface text-xs mt-1">{employee.phone || '--'}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                <span className="text-secondary font-semibold uppercase text-[10px]">Income Tax PAN</span>
                <span className="font-mono font-semibold text-on-surface text-xs mt-1">{employee.panNumber || '--'}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                <span className="text-secondary font-semibold uppercase text-[10px]">Provident Fund UAN</span>
                <span className="font-mono font-semibold text-on-surface text-xs mt-1">{employee.uanNumber || '--'}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                <span className="text-secondary font-semibold uppercase text-[10px]">Date of Birth</span>
                <span className="font-mono font-semibold text-on-surface text-xs mt-1">{employee.dateOfBirth || '--'}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                <span className="text-secondary font-semibold uppercase text-[10px]">Created Record Date</span>
                <span className="font-mono font-semibold text-on-surface text-xs mt-1">
                  {new Date(employee.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {/* Tab 5: Activity & Audit Logs */}
          {activeTab === 'activity' && (
            <div className="flex flex-col gap-2">
              <span className="text-secondary font-semibold uppercase text-[10px]">
                Immutable Audit Trail for {employee.employeeCode}
              </span>
              {isLoadingActivity ? (
                <div className="p-8 flex flex-col items-center justify-center gap-2 text-secondary text-xs">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading audit ledger...</span>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="p-6 rounded-lg bg-surface-container-low text-center text-xs text-secondary">
                  No explicit audit events recorded for this employee ID yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-surface-container-low border border-slate-200 text-xs flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-on-surface">{log.action}</span>
                        <span className="text-[10px] text-secondary font-mono">{log.timeAgo || log.timestamp}</span>
                      </div>
                      <span className="text-slate-600 text-xs">{log.details}</span>
                      <div className="flex items-center gap-2 text-[10px] text-secondary mt-0.5">
                        <span>Actor: {log.userEmail}</span>
                        <span>•</span>
                        <span>Source: {log.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="pt-4 border-t border-surface-container-low flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container-low text-secondary hover:text-on-surface font-label-sm text-xs cursor-pointer"
          >
            Close Profile
          </button>
          <button
            type="button"
            onClick={() => {
              const code = employee.employeeCode;
              onClose();
              onSelectEmployeeForPayslip?.(code);
            }}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-sm text-xs font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">receipt_long</span>
            <span>View Official Payslip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
