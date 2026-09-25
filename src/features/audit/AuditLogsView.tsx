import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../types/index.ts';
import { auditApi } from '../../services/apiServices.ts';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    auditApi
      .getLogs()
      .then((res) => setLogs(res.logs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterType !== 'all' && log.resourceType !== filterType) return false;
    return true;
  });

  return (
    <div className="flex flex-col w-full gap-space-lg animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs text-secondary font-label-xs text-label-xs uppercase tracking-wider">
            <span>Governance & Security</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-on-surface font-semibold">Immutable Ledger</span>
          </div>
          <h1 className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight mt-1">
            Enterprise Audit & Compliance Trail
          </h1>
          <p className="font-body-md text-body-md text-secondary">
            Append-only cryptographically chained event stream across administrative, compensation, and access operations
          </p>
        </div>

        <div className="flex items-center gap-space-xs">
          <button
            onClick={() => alert('Full SHA-256 encrypted ledger stream exported.')}
            className="flex items-center gap-space-xs h-9 px-space-md bg-surface-container-lowest text-on-surface hover:bg-surface-container-high rounded font-label-sm text-sm border border-slate-200 shadow-sm cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-lg self-start">
        {['all', 'ATTENDANCE', 'COMPENSATION', 'SECURITY', 'LEAVE', 'PAYROLL', 'EMPLOYEE'].map((rt) => (
          <button
            key={rt}
            onClick={() => setFilterType(rt)}
            className={`px-3 py-1 rounded font-label-xs text-xs font-semibold cursor-pointer uppercase ${
              filterType === rt
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            {rt === 'all' ? 'All Resources' : rt}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-secondary font-label-xs text-xs uppercase tracking-wider">
                <th className="py-2.5 px-4">Event Timestamp</th>
                <th className="py-2.5 px-4">Origin / User</th>
                <th className="py-2.5 px-4">Action Token</th>
                <th className="py-2.5 px-4">Resource Scope</th>
                <th className="py-2.5 px-4">Audit Payload / Rationale</th>
                <th className="py-2.5 px-4 text-right">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low font-body-sm text-xs text-on-surface">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3 px-4 font-code-sm text-secondary whitespace-nowrap">
                    <div>{log.timestamp.split('T')[1].replace('Z', '')} UTC</div>
                    <div className="text-[10px] text-slate-400">{log.timeAgo}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-on-surface block">{log.userEmail}</span>
                    <span className="font-code-sm text-[10px] text-secondary">{log.source}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-surface-container font-code-sm text-[11px] font-bold text-primary">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold">{log.resourceType}</span>
                    <span className="font-code-sm text-secondary block">{log.resourceId}</span>
                  </td>
                  <td className="py-3 px-4 max-w-md">
                    <p className="text-secondary leading-relaxed">{log.details}</p>
                    {log.oldValue && (
                      <div className="mt-1 font-code-sm text-[10px] bg-slate-100 p-1 rounded text-slate-600">
                        Diff: {log.oldValue} → {log.newValue}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-code-sm text-[10px] font-bold ${
                        log.result === 'SUCCESS'
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                          : 'bg-error-container text-on-error-container'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {log.result}
                    </span>
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
