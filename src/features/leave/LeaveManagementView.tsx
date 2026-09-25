import React, { useState } from 'react';
import { LeaveRequest, LeaveBalance } from '../../types/index.ts';

interface LeaveManagementViewProps {
  balances: LeaveBalance[];
  requests: LeaveRequest[];
  onOpenApplyModal: () => void;
}

export const LeaveManagementView: React.FC<LeaveManagementViewProps> = ({
  balances,
  requests,
  onOpenApplyModal,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'APPROVED' | 'SUBMITTED' | 'REJECTED'>('ALL');

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="flex flex-col w-full gap-space-lg animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs text-secondary font-label-xs text-label-xs uppercase tracking-wider">
            <span>Enterprise Leave</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-on-surface font-semibold">Balances & Requests</span>
          </div>
          <h1 className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight mt-1">
            Leave & Absence Management
          </h1>
          <p className="font-body-md text-body-md text-secondary">
            Statutory leave quotas, accrued balance tracking, and immutable approval timelines
          </p>
        </div>

        <button
          onClick={onOpenApplyModal}
          className="flex items-center gap-space-xs h-9 px-space-md bg-primary text-on-primary hover:bg-primary-container rounded font-label-sm text-label-sm font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          type="button"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Balances Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-space-sm">
        {balances.map((b) => (
          <div
            key={b.leaveType}
            className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="font-label-xs text-label-xs uppercase font-bold text-secondary">
                {b.leaveType}
              </span>
              <span className="material-symbols-outlined text-base text-primary">event_available</span>
            </div>
            <div className="my-2">
              <span className="font-headline-lg text-2xl font-bold text-on-surface">{b.available}</span>
              <span className="font-body-xs text-xs text-secondary ml-1">days left</span>
            </div>
            <div className="flex items-center justify-between font-code-sm text-[10px] text-secondary border-t border-surface-container-low pt-1.5">
              <span>Used: {b.used}</span>
              <span>Pending: {b.pending}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Requests Table & Approval Timeline */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-slate-200">
        <div className="p-space-base flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border-b border-surface-container-low">
          <div className="flex items-center gap-space-xs">
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Leave Request History
            </span>
            <span className="px-space-xs py-0.5 rounded font-code-sm text-xs bg-surface-container text-secondary font-semibold">
              {requests.length} Total
            </span>
          </div>

          <div className="flex items-center gap-space-xs bg-surface-container-low p-0.5 rounded">
            {(['ALL', 'SUBMITTED', 'APPROVED', 'REJECTED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-space-sm py-1 rounded font-label-xs text-label-xs font-semibold cursor-pointer ${
                  filterStatus === st
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                {st === 'ALL' ? 'All Requests' : st === 'SUBMITTED' ? 'Under Review' : st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-secondary font-label-xs text-label-xs uppercase tracking-wider">
                <th className="py-2.5 px-space-base">Request ID</th>
                <th className="py-2.5 px-space-sm">Employee</th>
                <th className="py-2.5 px-space-sm">Type</th>
                <th className="py-2.5 px-space-sm">Date Span</th>
                <th className="py-2.5 px-space-sm">Duration</th>
                <th className="py-2.5 px-space-sm">Reason</th>
                <th className="py-2.5 px-space-sm">Status</th>
                <th className="py-2.5 px-space-base text-right">Approver Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low font-body-sm text-body-sm text-on-surface">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-space-sm px-space-base font-code-sm text-code-sm font-semibold text-primary">
                    {req.id}
                  </td>
                  <td className="py-space-sm px-space-sm">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                        {req.employeeName}
                      </span>
                      <span className="font-code-sm text-xs text-secondary">{req.employeeCode}</span>
                    </div>
                  </td>
                  <td className="py-space-sm px-space-sm">
                    <span className="px-space-xs py-0.5 rounded font-label-xs text-label-xs bg-surface-container font-semibold">
                      {req.leaveType}
                    </span>
                  </td>
                  <td className="py-space-sm px-space-sm font-code-sm text-xs">
                    {req.startDate} → {req.endDate}
                  </td>
                  <td className="py-space-sm px-space-sm font-code-sm text-xs font-bold">
                    {req.durationDays} Days
                  </td>
                  <td className="py-space-sm px-space-sm max-w-xs truncate text-xs text-secondary">
                    {req.reason}
                  </td>
                  <td className="py-space-sm px-space-sm">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-xs text-label-xs font-semibold ${
                        req.status === 'APPROVED'
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                          : req.status === 'SUBMITTED'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-error-container text-on-error-container'
                      }`}
                    >
                      {req.status === 'SUBMITTED' ? 'Under Review' : req.status}
                    </span>
                  </td>
                  <td className="py-space-sm px-space-base text-right text-xs text-secondary">
                    {req.approvedBy ? `Approved by ${req.approvedBy}` : 'Pending HOD Sign-off'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
