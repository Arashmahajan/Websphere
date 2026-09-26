import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionKey: string) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const { hasPermission } = useAuth();
  if (!isOpen) return null;

  const actions = [
    {
      id: 'create-org',
      title: 'Create Organization',
      desc: 'Provision a new corporate entity, subsidiary, or regional tenant',
      icon: 'corporate_fare',
      color: 'bg-primary text-on-primary',
      permission: 'EMPLOYEE_WRITE' as const,
    },
    {
      id: 'punch',
      title: 'Clock In / Clock Out',
      desc: 'Log shift timestamp across enterprise turnstiles or mobile',
      icon: 'schedule',
      color: 'bg-primary text-on-primary',
      permission: 'ATTENDANCE_PUNCH' as const,
    },
    {
      id: 'regularize',
      title: 'Request Regularization',
      desc: 'Submit attendance discrepancy filing to HR Desk',
      icon: 'edit_calendar',
      color: 'bg-tertiary text-on-tertiary',
      permission: 'ATTENDANCE_REGULARIZE' as const,
    },
    {
      id: 'leave',
      title: 'Apply for Leave',
      desc: 'Request annual, sick, or casual leave with balance deduction',
      icon: 'event_busy',
      color: 'bg-secondary text-on-secondary',
      permission: 'LEAVE_APPLY' as const,
    },
    {
      id: 'add-employee',
      title: 'Add New Employee',
      desc: 'Onboard personnel with department and compensation profile',
      icon: 'person_add',
      color: 'bg-primary-container text-on-primary',
      permission: 'EMPLOYEE_WRITE' as const,
    },
    {
      id: 'payroll-run',
      title: 'Review Payroll Cycle',
      desc: 'Inspect #PR-2026-09 exceptions and statutory audit checklist',
      icon: 'payments',
      color: 'bg-tertiary-container text-on-tertiary',
      permission: 'PAYROLL_READ' as const,
    },
    {
      id: 'view-payslip',
      title: 'Download Latest Payslip',
      desc: 'Generate printable official CTC statement and tax deductions',
      icon: 'receipt_long',
      color: 'bg-secondary-container text-on-secondary-container',
      permission: 'EMPLOYEE_READ' as const,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-xl shadow-2xl p-space-base flex flex-col gap-space-md border border-surface-container-high">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">bolt</span>
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Enterprise Quick Action Hub
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

        <p className="font-body-xs text-body-xs text-secondary">
          Select an enterprise operation to navigate directly. Permissions are dynamically verified against your active role.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
          {actions.map((act) => {
            const allowed = hasPermission(act.permission);
            return (
              <button
                key={act.id}
                disabled={!allowed}
                onClick={() => {
                  onSelectAction(act.id);
                  onClose();
                }}
                className={`p-space-sm rounded-lg border text-left transition-all flex items-start gap-space-sm cursor-pointer ${
                  allowed
                    ? 'border-surface-container hover:border-primary hover:bg-surface-container-low/60 shadow-xs'
                    : 'opacity-40 border-dashed border-outline-variant cursor-not-allowed bg-surface-container-low/20'
                }`}
              >
                <div className={`p-2 rounded-lg ${act.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="material-symbols-outlined text-xl">{act.icon}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                    {act.title}
                  </span>
                  <span className="font-body-xs text-body-xs text-secondary mt-0.5 line-clamp-2">
                    {act.desc}
                  </span>
                  {!allowed && (
                    <span className="font-code-sm text-[10px] text-error font-bold mt-1">
                      Requires {act.permission}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
