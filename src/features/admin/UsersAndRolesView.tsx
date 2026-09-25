import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';

export const UsersAndRolesView: React.FC = () => {
  const { availableUsers, currentUser, switchUser } = useAuth();

  const permissionsList = [
    { name: 'EMPLOYEE_READ', desc: 'View global census and individual employment records' },
    { name: 'EMPLOYEE_WRITE', desc: 'Create, modify, and assign organizational reporting chains' },
    { name: 'EMPLOYEE_DELETE', desc: 'Terminate and archive personnel accounts' },
    { name: 'ATTENDANCE_READ', desc: 'Access real-time biometric and gate timestamps' },
    { name: 'ATTENDANCE_PUNCH', desc: 'Record active shift check-in and check-out' },
    { name: 'ATTENDANCE_REGULARIZE', desc: 'Submit gate discrepancy regularization filings' },
    { name: 'ATTENDANCE_APPROVE', desc: 'Approve or reject team attendance corrections' },
    { name: 'LEAVE_READ', desc: 'Review leave requests and balance allocations' },
    { name: 'LEAVE_APPLY', desc: 'File paid, sick, or statutory absence requests' },
    { name: 'LEAVE_APPROVE', desc: 'Executive and managerial leave sign-off' },
    { name: 'PAYROLL_READ', desc: 'Inspect monthly payroll runs and compensation ledgers' },
    { name: 'PAYROLL_PROCESS', desc: 'Initiate automated gross and statutory calculation batches' },
    { name: 'PAYROLL_APPROVE', desc: 'CFO cryptographic authorization for treasury RTGS release' },
    { name: 'PAYROLL_EXCEPTION_RESOLVE', desc: 'Override or adjust flagged payroll anomalies' },
    { name: 'REPORT_READ', desc: 'Generate enterprise workforce and compliance reports' },
    { name: 'AUDIT_READ', desc: 'Access append-only immutable security ledger' },
    { name: 'USER_MANAGE', desc: 'Configure system roles and RBAC permission matrices' },
  ];

  return (
    <div className="flex flex-col w-full gap-space-lg animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col">
        <div className="flex items-center gap-space-xs text-secondary font-label-xs text-label-xs uppercase tracking-wider">
          <span>Security & Administration</span>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-on-surface font-semibold">RBAC Governance</span>
        </div>
        <h1 className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight mt-1">
          Role-Based Access Control (RBAC) & Users
        </h1>
        <p className="font-body-md text-body-md text-secondary">
          Centralized permission model enforcing least-privilege security across WorkSphere domains
        </p>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {availableUsers.map((user) => {
          const isActive = currentUser?.email === user.email;

          return (
            <div
              key={user.id}
              className={`p-space-base rounded-xl border flex flex-col justify-between transition-all ${
                isActive
                  ? 'bg-surface-container-low border-primary shadow-sm'
                  : 'bg-surface-container-lowest border-slate-200'
              }`}
            >
              <div className="flex items-start gap-space-sm">
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover shadow-xs border border-surface-container"
                />
                <div className="flex flex-col">
                  <span className="font-label-sm text-sm font-bold text-on-surface">{user.fullName}</span>
                  <span className="font-body-xs text-xs text-secondary">{user.title}</span>
                  <span className="font-code-sm text-[10px] text-primary font-bold mt-1">
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-container-low flex flex-col gap-2">
                <span className="font-label-xs text-[11px] text-secondary font-semibold">
                  Granted: {user.permissions.length} Permissions
                </span>
                <button
                  type="button"
                  onClick={() => switchUser(user.email)}
                  disabled={isActive}
                  className={`w-full py-1.5 rounded font-label-xs text-xs font-semibold cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-primary text-on-primary font-bold cursor-default'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  {isActive ? 'Current Active Persona' : 'Simulate This Persona'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-200 p-space-base flex flex-col gap-space-md">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">shield_lock</span>
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
              System Permissions Catalog
            </span>
          </div>
          <span className="font-code-sm text-xs text-secondary">WorkSphere Enterprise Matrix v4.2</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-sm">
          {permissionsList.map((perm) => {
            const hasIt = currentUser?.permissions.includes(perm.name as any) || currentUser?.role === 'SYSTEM_ADMIN';

            return (
              <div
                key={perm.name}
                className="p-space-sm rounded-lg bg-surface-container-low/60 border border-surface-container flex items-start gap-2.5"
              >
                <span
                  className={`material-symbols-outlined text-base mt-0.5 ${
                    hasIt ? 'text-tertiary' : 'text-slate-400'
                  }`}
                >
                  {hasIt ? 'check_circle' : 'remove_circle_outline'}
                </span>
                <div className="flex flex-col">
                  <span className="font-code-sm text-xs font-bold text-on-surface">{perm.name}</span>
                  <span className="font-body-xs text-xs text-secondary mt-0.5">{perm.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
