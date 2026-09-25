import React, { useState } from 'react';
import { ApprovalItem } from '../../types/index.ts';

interface ApprovalsViewProps {
  items: ApprovalItem[];
  onApprove: (id: string, comments?: string) => void;
  onReject: (id: string, comments?: string) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  items,
  onApprove,
  onReject,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(items[0] || null);
  const [actionComment, setActionComment] = useState('');

  const filteredItems = items.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    return true;
  });

  return (
    <div className="flex flex-col w-full gap-space-lg animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs text-secondary font-label-xs text-label-xs uppercase tracking-wider">
            <span>Governance</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-on-surface font-semibold">Executive Sign-offs</span>
          </div>
          <h1 className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight mt-1">
            My Approvals Queue
          </h1>
          <p className="font-body-md text-body-md text-secondary">
            Multi-stage audit workflows, SLA tracking, and immutable approval histories
          </p>
        </div>

        <div className="flex items-center gap-space-xs bg-surface-container-low p-0.5 rounded">
          {['all', 'EXPENSE', 'REGULARIZATION', 'LEAVE'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-space-sm py-1 rounded font-label-xs text-label-xs font-semibold cursor-pointer ${
                filterType === type
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              {type === 'all' ? 'All Queues' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Master-Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left List (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-space-sm">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`p-space-base rounded-xl border transition-all cursor-pointer ${
                selectedItem?.id === item.id
                  ? 'bg-surface-container-low/70 border-primary shadow-sm'
                  : 'bg-surface-container-lowest border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <img
                    src={item.requesterAvatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shadow-xs border border-surface-container"
                  />
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm font-bold text-on-surface">
                      {item.requesterName}
                    </span>
                    <span className="font-body-xs text-xs text-secondary">{item.requesterRole}</span>
                  </div>
                </div>

                <div className="flex items-center gap-space-xs">
                  <span className="px-space-xs py-0.5 rounded font-label-xs text-xs font-bold bg-error-container text-on-error-container">
                    {item.slaRiskText}
                  </span>
                  <span className="px-space-xs py-0.5 rounded font-label-xs text-xs bg-surface-container text-secondary font-semibold">
                    {item.type}
                  </span>
                </div>
              </div>

              <div className="mt-space-sm flex items-center justify-between pt-space-xs border-t border-surface-container-low">
                <span className="font-body-sm text-sm font-semibold text-on-surface">{item.title}</span>
                <span className="font-code-sm text-sm font-bold text-primary">
                  {item.amountFormatted || item.daysFormatted}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Detail & Timeline (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          {selectedItem ? (
            <div className="bg-surface-container-lowest p-space-base rounded-xl shadow-sm border border-slate-200 flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Approval Timeline & Rationale
                </span>
                <span className="font-code-sm text-xs font-semibold text-primary">
                  {selectedItem.amountFormatted || selectedItem.daysFormatted}
                </span>
              </div>

              <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1">
                <span className="font-label-xs text-label-xs uppercase font-bold text-secondary">
                  Operational Context
                </span>
                <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                  {selectedItem.description}
                </p>
              </div>

              {/* Multi-step Timeline */}
              <div className="flex flex-col gap-3">
                <span className="font-label-xs text-label-xs uppercase font-bold text-secondary">
                  Workflow Routing History
                </span>
                <div className="flex flex-col gap-2 relative pl-4 border-l-2 border-primary/30">
                  {selectedItem.steps.map((st, i) => (
                    <div key={i} className="flex flex-col text-xs relative">
                      <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white"></div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-on-surface">{st.approverRole}</span>
                        <span className="font-code-sm text-[10px] text-secondary">{st.timestamp || 'Underway'}</span>
                      </div>
                      <span className="text-secondary">{st.approverName}</span>
                      {st.comments && (
                        <p className="mt-1 p-2 rounded bg-surface-container-low text-[11px] text-on-surface italic">
                          "{st.comments}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Box */}
              <div className="flex flex-col gap-2 pt-2 border-t border-surface-container-low">
                <input
                  className="w-full h-9 px-space-sm rounded bg-surface-container-low font-body-xs text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                  placeholder="Optional review note or audit remarks..."
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onReject(selectedItem.id, actionComment);
                      setActionComment('');
                    }}
                    className="px-3 py-1.5 rounded font-label-xs text-xs font-semibold text-error hover:bg-error-container transition-colors cursor-pointer"
                  >
                    Reject Request
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onApprove(selectedItem.id, actionComment);
                      setActionComment('');
                    }}
                    className="px-4 py-1.5 rounded font-label-xs text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
                  >
                    Authorize & Sign
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-slate-200 text-secondary">
              Select an approval request to inspect timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
