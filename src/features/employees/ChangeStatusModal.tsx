import React, { useState } from 'react';
import { Employee, EmployeeStatus } from '../../types/index.ts';
import { useChangeEmployeeStatus } from './useEmployeeQueries.ts';

interface ChangeStatusModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSuccess: (updated: Employee) => void;
}

export const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  isOpen,
  employee,
  onClose,
  onSuccess,
}) => {
  const statusMutation = useChangeEmployeeStatus();
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus>('ACTIVE');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !employee) return null;

  // Calculate permissible target statuses based on lifecycle rules
  const getAllowedTargets = (current: EmployeeStatus): EmployeeStatus[] => {
    switch (current) {
      case 'ACTIVE':
        return ['ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'NOTICE'];
      case 'ON_LEAVE':
        return ['ACTIVE'];
      case 'SUSPENDED':
        return ['ACTIVE', 'TERMINATED'];
      case 'PROBATION':
        return ['ACTIVE', 'TERMINATED'];
      case 'NOTICE':
        return ['ACTIVE', 'TERMINATED'];
      case 'TERMINATED':
        return []; // Terminal state
      default:
        return ['ACTIVE'];
    }
  };

  const allowedTargets = getAllowedTargets(employee.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (employee.status === 'TERMINATED') {
      setErrorMsg('TERMINATED is a terminal state. An employee cannot be transitioned out of TERMINATED.');
      return;
    }

    if (!selectedStatus) {
      setErrorMsg('Please select a target lifecycle status.');
      return;
    }

    try {
      const res: any = await statusMutation.mutateAsync({
        id: employee.id,
        status: selectedStatus,
        version: employee.version,
        reason: reason.trim() || undefined,
      });

      onSuccess(res.employee || res.data || res);
      onClose();
    } catch (err: any) {
      if (err.code === 'EMPLOYEE_MODIFIED_BY_ANOTHER_USER' || err.status === 409) {
        setErrorMsg('This employee record was modified by another user. Please refresh and try again.');
      } else {
        setErrorMsg(err.message || 'Status transition rejected by server.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-2xl p-space-base flex flex-col gap-space-md border border-slate-200">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">swap_horiz</span>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Change Personnel Status
              </span>
              <span className="text-secondary font-code-sm text-xs">
                {employee.employeeCode} · {employee.firstName} {employee.lastName}
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

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
            <span className="text-xs text-secondary font-medium">Current Status:</span>
            <span className="font-label-xs text-xs font-bold uppercase px-2 py-0.5 rounded bg-surface-container-high text-on-surface">
              {employee.status}
            </span>
          </div>

          {employee.status === 'TERMINATED' ? (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              This employee record is in terminal <strong>TERMINATED</strong> status and cannot be changed.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-xs text-secondary font-semibold uppercase text-xs">
                  Permitted Target Status *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {allowedTargets.map((target) => (
                    <button
                      key={target}
                      type="button"
                      onClick={() => setSelectedStatus(target)}
                      className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedStatus === target
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-slate-200 bg-surface-container-low text-secondary hover:bg-surface-container'
                      }`}
                    >
                      <span className="text-xs">{target.replace('_', ' ')}</span>
                      {selectedStatus === target && (
                        <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-xs text-secondary font-semibold uppercase text-xs">
                  Reason / Regulatory Justification
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter business rationale, governance review note, or statutory ticket ID..."
                  className="p-2 rounded bg-surface-container-low border border-slate-200 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-2 border-t border-surface-container-low">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-space-md py-2 rounded bg-surface-container-low text-secondary hover:text-on-surface font-label-sm text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusMutation.isPending || !selectedStatus}
                  className="px-space-lg py-2 rounded bg-primary text-on-primary font-label-sm text-xs font-semibold shadow-sm hover:bg-primary-container disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {statusMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">check</span>
                      <span>Apply Lifecycle Transition</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
