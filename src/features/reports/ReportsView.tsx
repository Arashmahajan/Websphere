import React, { useState, useEffect } from 'react';
import { reportApi } from '../../services/apiServices.ts';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<'workforce' | 'attendance' | 'payroll' | 'leave'>('workforce');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportApi
      .getReport(reportType)
      .then((res) => {
        setData(res);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [reportType]);

  const handleExportCsv = () => {
    if (!data) return;
    const headers = ['Department', 'Headcount', 'Present Today', 'Attendance Rate', 'On Leave', 'Remote', 'Status'];
    const rows = data.departmentBreakdown.map((d: any) => [
      d.name,
      d.headcount,
      d.present,
      d.rate,
      d.leave,
      d.remote,
      d.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WorkSphere_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-full gap-space-lg animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs text-secondary font-label-xs text-label-xs uppercase tracking-wider">
            <span>Analytics & Intelligence</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-on-surface font-semibold">Enterprise Reporting</span>
          </div>
          <h1 className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight mt-1">
            Enterprise Audit & Operational Reports
          </h1>
          <p className="font-body-md text-body-md text-secondary">
            Cross-departmental workforce analytics, compliance filings, and SLA reconciliation
          </p>
        </div>

        <div className="flex items-center gap-space-xs">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-space-xs h-9 px-space-md bg-primary text-on-primary hover:bg-primary-container rounded font-label-sm text-label-sm font-semibold shadow-sm transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export CSV Dataset</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-space-sm border-b border-surface-container-low pb-2">
        {(['workforce', 'attendance', 'payroll', 'leave'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setReportType(t)}
            className={`px-4 py-2 rounded-lg font-label-sm text-sm font-semibold transition-all cursor-pointer capitalize ${
              reportType === t
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-secondary hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            {t} Report
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-3xl text-primary animate-spin">sync</span>
          <span className="text-sm text-secondary font-medium">Aggregating relational report data...</span>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-space-md">
          {/* Summary Banner */}
          <div className="p-space-base rounded-xl bg-surface-container-lowest border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary-container text-on-primary">
                <span className="material-symbols-outlined text-2xl">monitoring</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-sm font-bold text-on-surface">
                  {reportType.toUpperCase()} CONSOLIDATED AUDIT PACKET
                </span>
                <span className="text-xs text-secondary mt-0.5">
                  Generated {new Date(data.generatedAt).toLocaleString()} · Node: ap-south-1
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs font-code-sm">
              <div>
                <span className="text-secondary block">Scope</span>
                <span className="font-bold text-on-surface">10,248 Accounts</span>
              </div>
              <div>
                <span className="text-secondary block">Status</span>
                <span className="font-bold text-tertiary">Verified Compliant</span>
              </div>
            </div>
          </div>

          {/* Department Breakdown Table */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-surface-container-low font-bold text-sm text-on-surface">
              Division & Department Breakdown
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low text-secondary font-label-xs text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Division Name</th>
                    <th className="py-2.5 px-4">Headcount</th>
                    <th className="py-2.5 px-4">Present Today</th>
                    <th className="py-2.5 px-4">Attendance Rate</th>
                    <th className="py-2.5 px-4">On Leave</th>
                    <th className="py-2.5 px-4">Remote WFH</th>
                    <th className="py-2.5 px-4 text-right">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low font-body-sm text-sm text-on-surface">
                  {data.departmentBreakdown.map((dept: any, i: number) => (
                    <tr key={i} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-primary">{dept.name}</td>
                      <td className="py-3 px-4 font-code-sm">{dept.headcount.toLocaleString()}</td>
                      <td className="py-3 px-4 font-code-sm">{dept.present.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-surface-container h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full" style={{ width: dept.rate }}></div>
                          </div>
                          <span className="font-code-sm text-xs font-bold">{dept.rate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-code-sm text-secondary">{dept.leave}</td>
                      <td className="py-3 px-4 font-code-sm text-secondary">{dept.remote}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded font-label-xs text-xs font-semibold bg-surface-container text-tertiary">
                          {dept.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
