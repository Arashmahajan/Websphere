import React, { useState } from 'react';
import { leaveApi } from '../../services/apiServices.ts';
import { LeaveBalance } from '../../types/index.ts';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: LeaveBalance[];
  onSuccess: () => void;
}

export const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({
  isOpen,
  onClose,
  balances,
  onSuccess,
}) => {
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentBal = balances.find((b) => b.leaveType === leaveType);

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (end < start) return -1;
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const daysCount = calculateDays();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (daysCount <= 0) {
      setErrorMsg('Leave end date cannot be before start date.');
      return;
    }

    if (currentBal && currentBal.available < daysCount && leaveType !== 'UNPAID') {
      setErrorMsg(`Insufficient leave balance. You have ${currentBal.available} days available for ${leaveType}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await leaveApi.applyLeave({
        leaveType,
        startDate,
        endDate,
        duration: daysCount,
        durationDays: daysCount,
        reason,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit leave application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-xl shadow-2xl p-space-base flex flex-col gap-space-md border border-surface-container-high">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">event_busy</span>
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
              File Enterprise Leave Request
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
          <div className="p-2.5 rounded bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Balance Preview Card */}
        <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-xs text-label-xs uppercase font-bold text-secondary">
              Selected Leave Balance
            </span>
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface mt-0.5">
              {currentBal ? currentBal.available : 0} Days Available
            </span>
          </div>
          <div className="flex items-center gap-space-xs text-xs font-code-sm text-secondary">
            <span>Used: {currentBal?.used || 0}</span>
            <span>•</span>
            <span>Pending: {currentBal?.pending || 0}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-sm font-body-sm text-body-sm">
          <div>
            <label className="block font-label-xs text-label-xs uppercase text-secondary mb-1">
              Leave Category
            </label>
            <select
              className="w-full h-9 px-space-sm rounded bg-surface-container-low text-on-surface focus:outline-none cursor-pointer"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
            >
              <option value="ANNUAL">Annual Leave (Earned)</option>
              <option value="SICK">Sick / Medical Leave</option>
              <option value="CASUAL">Casual Leave</option>
              <option value="UNPAID">Leave Without Pay (Unpaid LOP)</option>
              <option value="MATERNITY">Maternity Leave (Statutory)</option>
              <option value="PATERNITY">Paternity Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <div>
              <label className="block font-label-xs text-label-xs uppercase text-secondary mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                className="w-full h-9 px-space-sm rounded bg-surface-container-low text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-label-xs text-label-xs uppercase text-secondary mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                className="w-full h-9 px-space-sm rounded bg-surface-container-low text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {daysCount > 0 && (
            <div className="px-space-sm py-1.5 rounded bg-primary-container/10 text-primary font-label-xs text-xs font-semibold flex items-center justify-between">
              <span>Total Working Duration:</span>
              <span className="font-bold font-code-sm">{daysCount} calendar days</span>
            </div>
          )}

          <div>
            <label className="block font-label-xs text-label-xs uppercase text-secondary mb-1">
              Business Reason / Handover Context
            </label>
            <textarea
              required
              className="w-full p-space-sm rounded bg-surface-container-low text-on-surface placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
              rows={3}
              placeholder="State coverage arrangements or reason for absence..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-space-xs pt-space-xs border-t border-surface-container-low">
            <button
              onClick={onClose}
              type="button"
              className="px-space-base h-9 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="px-space-base h-9 rounded bg-primary hover:bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Routing to Manager...' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
