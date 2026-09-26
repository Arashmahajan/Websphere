import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { attendanceApi } from '../../services/apiServices.ts';

interface RegularizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmpName?: string;
  defaultEmpCode?: string;
  onSuccess?: () => void;
}

export const RegularizationModal: React.FC<RegularizationModalProps> = ({
  isOpen,
  onClose,
  defaultEmpName,
  defaultEmpCode,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [incidentDate, setIncidentDate] = useState('2026-09-18');
  const [category, setCategory] = useState('Gate Scanner Discrepancy');
  const [proposedTime, setProposedTime] = useState('09:00 AM');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const empName = defaultEmpName || currentUser?.fullName || 'Personnel';
  const empCode = defaultEmpCode || currentUser?.employeeId || 'EMP-001';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setIsSubmitting(true);
      await attendanceApi.createRegularization({
        employeeName: empName,
        employeeCode: empCode,
        incidentDate,
        category,
        proposedTime,
        reason: reason || `${category} reported at biometric gate entrance.`,
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to file regularization request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-xl shadow-2xl p-space-base flex flex-col gap-space-md border border-surface-container-high">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">fact_check</span>
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Attendance Regularization Filing
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
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-sm font-body-sm text-body-sm">
          <div>
            <label className="block font-label-xs text-label-xs uppercase tracking-wider text-secondary mb-1">
              Target Employee
            </label>
            <input
              className="w-full h-9 px-space-sm rounded bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              readOnly
              value={`${empName} (${empCode})`}
            />
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <div>
              <label className="block font-label-xs text-label-xs uppercase tracking-wider text-secondary mb-1">
                Incident Date
              </label>
              <input
                type="date"
                required
                className="w-full h-9 px-space-sm rounded bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-label-xs text-label-xs uppercase tracking-wider text-secondary mb-1">
                Category
              </label>
              <select
                className="w-full h-9 px-space-sm rounded bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none cursor-pointer"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Gate Scanner Discrepancy">Gate Scanner Discrepancy</option>
                <option value="Client Visit / On-duty OD">Client Visit / On-duty OD</option>
                <option value="Biometric Failure / Card Damaged">Biometric Failure / Card Damaged</option>
                <option value="Transit Commute Delay">Transit Commute Delay</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-label-xs text-label-xs uppercase tracking-wider text-secondary mb-1">
              Proposed Actual Punch Time
            </label>
            <input
              className="w-full h-9 px-space-sm rounded bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              value={proposedTime}
              onChange={(e) => setProposedTime(e.target.value)}
              placeholder="e.g. 09:00 AM"
            />
          </div>

          <div>
            <label className="block font-label-xs text-label-xs uppercase tracking-wider text-secondary mb-1">
              Detailed Operational Rationale
            </label>
            <textarea
              className="w-full p-space-sm rounded bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
              placeholder="Provide biometric booth context or supervisory authorization notes..."
              rows={3}
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
              {isSubmitting ? 'Filing...' : 'Submit to Operations Approver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
