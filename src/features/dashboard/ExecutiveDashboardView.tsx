import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { DashboardMetrics, ApprovalItem } from '../../types/index.ts';

interface ExecutiveDashboardViewProps {
  metrics: DashboardMetrics;
  approvalItems: ApprovalItem[];
  onNavigateTab: (tab: any) => void;
  onApproveItem: (id: string) => void;
  onRejectItem: (id: string) => void;
  onOpenDiagnostics?: () => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  metrics,
  approvalItems,
  onNavigateTab,
  onApproveItem,
  onRejectItem,
  onOpenDiagnostics,
}) => {
  const { currentUser } = useAuth();
  const [shiftFilter, setShiftFilter] = useState<'24h' | 'morning' | 'afternoon' | 'graveyard'>('24h');
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRunDiagnostics = () => {
    if (onOpenDiagnostics) {
      onOpenDiagnostics();
      return;
    }
    setDiagnosticsRunning(true);
    setTimeout(() => {
      setDiagnosticsRunning(false);
      setToastMessage('System Diagnostics Clean: 42 Turnstile nodes healthy, Database latency 2.4ms, Kafka broker cluster synchronized.');
      setTimeout(() => setToastMessage(null), 5000);
    }, 1200);
  };

  const urgentApprovals = approvalItems.slice(0, 3);

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-200">
      {/* Diagnostics Toast */}
      {toastMessage && (
        <div className="mb-4 p-3 bg-tertiary text-on-tertiary rounded-lg shadow-md flex items-center justify-between font-body-sm text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">verified</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="cursor-pointer">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Page Header */}
      <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md mb-space-lg">
        <div className="flex flex-col gap-space-2xs">
          <div className="flex items-center gap-space-sm">
            <span className="px-space-xs py-0.5 rounded font-label-xs text-label-xs bg-primary text-on-primary font-semibold uppercase tracking-wider">
              Enterprise Mission Control
            </span>
            <span className="flex items-center gap-space-2xs font-code-sm text-code-sm text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse"></span>
              SYS-NODE: US-EAST-01 · CLUSTER ONLINE
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight">
            Executive Operations & HR Dashboard
          </h1>
          <p className="font-body-md text-body-md text-secondary max-w-3xl">
            Real-time workforce metrics, payroll cycle tracking, and compliance monitoring across 10,248 active personnel.
          </p>
        </div>

        {/* Actions / Filters */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-1.5 rounded shadow-sm text-on-surface border border-slate-200 cursor-pointer">
            <span className="material-symbols-outlined text-secondary text-sm">calendar_month</span>
            <span className="font-label-sm text-label-sm font-semibold text-on-surface">
              Sep 01 - Sep 30, 2026
            </span>
            <span className="material-symbols-outlined text-secondary text-sm">arrow_drop_down</span>
          </div>
          <button
            onClick={() => alert('Workforce Summary Export generated (CSV/PDF packet ready).')}
            className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-1.5 rounded shadow-sm text-secondary hover:text-on-surface transition-colors border border-slate-200 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">file_download</span>
            <span className="font-label-sm text-label-sm font-medium">Export Summary</span>
          </button>
          <button
            onClick={handleRunDiagnostics}
            disabled={diagnosticsRunning}
            className="flex items-center gap-space-xs bg-primary text-on-primary px-space-md py-1.5 rounded shadow-sm hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-50"
            type="button"
          >
            <span className={`material-symbols-outlined text-sm ${diagnosticsRunning ? 'animate-spin' : ''}`}>
              {diagnosticsRunning ? 'sync' : 'terminal'}
            </span>
            <span className="font-label-sm text-label-sm font-semibold">
              {diagnosticsRunning ? 'Running Cluster Probe...' : 'Run Diagnostics'}
            </span>
          </button>
        </div>
      </section>

      {/* KPI Summary Cards Row (6 dense, high-hierarchy cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-sm mb-space-lg">
        {/* Card 1: Total Employees */}
        <div
          onClick={() => onNavigateTab('employees')}
          className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden cursor-pointer border border-slate-200"
        >
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-secondary">
              Total Workforce
            </span>
            <span className="material-symbols-outlined text-base text-primary">groups</span>
          </div>
          <div className="flex items-baseline justify-between gap-space-xs">
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface">10,248</span>
            <span className="font-label-xs text-label-xs font-bold text-tertiary-container bg-surface-container-low px-1.5 py-0.5 rounded flex items-center">
              <span className="material-symbols-outlined text-xs">arrow_upward</span>142
            </span>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between">
            <span className="font-body-xs text-body-xs text-secondary">98.4% retention</span>
            <svg className="w-16 h-5 text-primary" fill="none" viewBox="0 0 64 20">
              <path
                d="M1 15 L12 12 L24 14 L36 9 L48 11 L63 3"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer border border-slate-200"
        >
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-secondary">
              Present Today
            </span>
            <span className="material-symbols-outlined text-base text-tertiary-container">how_to_reg</span>
          </div>
          <div className="flex items-baseline justify-between gap-space-xs">
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface">9,412</span>
            <span className="font-label-xs text-label-xs font-bold text-tertiary-container bg-surface-container-low px-1.5 py-0.5 rounded">
              91.8%
            </span>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between font-body-xs text-body-xs text-secondary">
            <span>450 Late / Half</span>
            <span className="font-code-sm text-code-sm text-on-surface-variant font-medium">386 Leave</span>
          </div>
        </div>

        {/* Card 3: Pending Approvals */}
        <div
          onClick={() => onNavigateTab('my-approvals')}
          className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative cursor-pointer border border-slate-200"
        >
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-secondary">
              Pending Action
            </span>
            <span className="material-symbols-outlined text-base text-error">assignment_late</span>
          </div>
          <div className="flex items-baseline justify-between gap-space-xs">
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface">127</span>
            <span className="font-label-xs text-label-xs font-bold text-error bg-error-container/60 px-1.5 py-0.5 rounded animate-pulse">
              14 SLA Risk
            </span>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between font-body-xs text-body-xs text-secondary">
            <span>64 Leaves · 38 Expenses</span>
            <span className="material-symbols-outlined text-xs text-secondary">arrow_forward</span>
          </div>
        </div>

        {/* Card 4: Current Payroll Net */}
        <div
          onClick={() => onNavigateTab('payroll-runs')}
          className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer border border-slate-200"
        >
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-secondary">
              Payroll (Sep '26)
            </span>
            <span className="material-symbols-outlined text-base text-primary-container">account_balance_wallet</span>
          </div>
          <div className="flex items-baseline justify-between gap-space-xs">
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface">₹8.42 Cr</span>
            <span className="font-label-xs text-label-xs font-semibold text-secondary bg-surface-container px-1.5 py-0.5 rounded">
              Net Vol
            </span>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between font-body-xs text-body-xs text-secondary">
            <span className="text-tertiary-container font-medium">Cycle locks in 4d</span>
            <div className="w-14 bg-surface-container h-2 rounded-full overflow-hidden flex">
              <div className="bg-primary h-full w-[78%]"></div>
            </div>
          </div>
        </div>

        {/* Card 5: Payroll Exceptions */}
        <div
          onClick={() => onNavigateTab('payroll-runs')}
          className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer border border-slate-200"
        >
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-secondary">
              Exceptions
            </span>
            <span className="material-symbols-outlined text-base text-error">notification_important</span>
          </div>
          <div className="flex items-baseline justify-between gap-space-xs">
            <span className="font-headline-lg text-headline-lg font-bold text-error">23</span>
            <span className="font-label-xs text-label-xs font-bold text-error bg-error-container px-1.5 py-0.5 rounded">
              4 Critical
            </span>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between font-body-xs text-body-xs text-secondary">
            <span>CFO sign-off req.</span>
            <span className="font-code-sm text-code-sm text-secondary font-semibold">19 Minor</span>
          </div>
        </div>

        {/* Card 6: Shift Efficiency */}
        <div
          onClick={() => onNavigateTab('shifts')}
          className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer border border-slate-200"
        >
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-secondary">
              Shift Efficiency
            </span>
            <span className="material-symbols-outlined text-base text-tertiary">pace</span>
          </div>
          <div className="flex items-baseline justify-between gap-space-xs">
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface">94.6%</span>
            <span className="font-label-xs text-label-xs font-bold text-tertiary-container bg-surface-container-low px-1.5 py-0.5 rounded flex items-center">
              <span className="material-symbols-outlined text-xs">arrow_upward</span>1.8%
            </span>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between font-body-xs text-body-xs text-secondary">
            <span>Optimal range (90-95%)</span>
            <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
          </div>
        </div>
      </section>

      {/* Two-Column Main Analytics Grid (8 cols left, 4 cols right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
        {/* LEFT COLUMN (8 Columns) */}
        <div className="xl:col-span-8 flex flex-col gap-space-lg min-w-0">
          {/* Shift Attendance Pulse & Hourly Check-in Volume */}
          <div className="bg-surface-container-lowest p-space-base rounded shadow-sm flex flex-col gap-space-md border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs">
              <div>
                <div className="flex items-center gap-space-xs">
                  <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Shift Attendance Pulse & Hourly Check-in Volume
                  </h2>
                  <span className="px-space-xs py-0.5 rounded bg-surface-container text-secondary font-code-sm text-code-sm">
                    REAL-TIME
                  </span>
                </div>
                <p className="font-body-xs text-body-xs text-secondary">
                  Aggregated timestamp arrivals across biometric access points and geo-fenced mobile gates
                </p>
              </div>
              <div className="flex items-center gap-space-xs bg-surface-container-low p-0.5 rounded">
                <button
                  type="button"
                  onClick={() => setShiftFilter('24h')}
                  className={`px-space-xs py-1 rounded font-label-xs text-label-xs cursor-pointer ${
                    shiftFilter === '24h'
                      ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-sm'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  24h Pulse
                </button>
                <button
                  type="button"
                  onClick={() => setShiftFilter('morning')}
                  className={`px-space-xs py-1 rounded font-label-xs text-label-xs cursor-pointer ${
                    shiftFilter === 'morning'
                      ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-sm'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  Morning Shift
                </button>
                <button
                  type="button"
                  onClick={() => setShiftFilter('afternoon')}
                  className={`px-space-xs py-1 rounded font-label-xs text-label-xs cursor-pointer ${
                    shiftFilter === 'afternoon'
                      ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-sm'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  Afternoon
                </button>
                <button
                  type="button"
                  onClick={() => setShiftFilter('graveyard')}
                  className={`px-space-xs py-1 rounded font-label-xs text-label-xs cursor-pointer ${
                    shiftFilter === 'graveyard'
                      ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-sm'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  Graveyard
                </button>
              </div>
            </div>

            {/* Legend & Shift Distribution Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm p-space-sm bg-surface-container-low rounded">
              <div className="flex items-center gap-space-sm">
                <span className="w-3 h-3 rounded bg-primary"></span>
                <div className="flex flex-col">
                  <span className="font-label-xs text-label-xs text-secondary uppercase font-semibold">
                    Morning Shift (A)
                  </span>
                  <span className="font-label-md text-label-md font-bold text-on-surface">
                    6,840 check-ins{' '}
                    <span className="font-body-xs text-body-xs text-tertiary-container font-normal">(95.2%)</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className="w-3 h-3 rounded bg-surface-tint"></span>
                <div className="flex flex-col">
                  <span className="font-label-xs text-label-xs text-secondary uppercase font-semibold">
                    Afternoon Shift (B)
                  </span>
                  <span className="font-label-md text-label-md font-bold text-on-surface">
                    2,110 check-ins{' '}
                    <span className="font-body-xs text-body-xs text-tertiary-container font-normal">(90.1%)</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className="w-3 h-3 rounded bg-secondary"></span>
                <div className="flex flex-col">
                  <span className="font-label-xs text-label-xs text-secondary uppercase font-semibold">
                    Night Guard (C)
                  </span>
                  <span className="font-label-md text-label-md font-bold text-on-surface">
                    462 check-ins{' '}
                    <span className="font-body-xs text-body-xs text-tertiary-container font-normal">(89.4%)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* SVG Multi-Curve Chart */}
            <div className="w-full h-56 relative pt-4 flex flex-col justify-end">
              <svg className="w-full h-44 overflow-visible" preserveAspectRatio="none" viewBox="0 0 760 160">
                <line stroke="#eff4ff" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="760" y1="20" y2="20"></line>
                <line stroke="#eff4ff" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="760" y1="65" y2="65"></line>
                <line stroke="#eff4ff" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="760" y1="110" y2="110"></line>
                <line stroke="#dce9ff" strokeWidth="1" x1="0" x2="760" y1="155" y2="155"></line>

                <defs>
                  <linearGradient id="primaryAreaGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.25"></stop>
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.0"></stop>
                  </linearGradient>
                </defs>

                <path
                  d="M 0,155 L 40,150 L 90,140 L 140,120 L 190,40 L 230,15 L 280,30 L 330,85 L 380,105 L 430,70 L 480,55 L 530,95 L 580,120 L 630,135 L 680,140 L 760,150 L 760,155 Z"
                  fill="url(#primaryAreaGrad)"
                ></path>

                <rect fill="#eff4ff" height="100" rx="2" width="20" x="180" y="55"></rect>
                <rect fill="#d3e4fe" height="133" rx="2" width="20" x="220" y="22"></rect>
                <rect fill="#d3e4fe" height="113" rx="2" width="20" x="260" y="42"></rect>
                <rect fill="#eff4ff" height="75" rx="2" width="20" x="420" y="80"></rect>
                <rect fill="#d3e4fe" height="87" rx="2" width="20" x="470" y="68"></rect>

                <path
                  d="M 0,155 C 80,145 150,110 190,40 C 210,10 240,15 280,30 C 330,55 350,105 390,105 C 430,105 440,65 480,55 C 520,45 550,110 620,135 C 670,145 710,150 760,150"
                  fill="none"
                  stroke="#0037b0"
                  strokeLinecap="round"
                  strokeWidth="3"
                ></path>

                <path
                  d="M 0,155 C 80,152 140,145 200,135 C 260,125 320,120 380,100 C 440,78 490,85 540,105 C 600,125 680,148 760,153"
                  fill="none"
                  stroke="#565e74"
                  strokeDasharray="3 3"
                  strokeWidth="2"
                ></path>

                <circle cx="230" cy="15" fill="#0037b0" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
                <circle cx="480" cy="55" fill="#2151da" r="3.5" stroke="#ffffff" strokeWidth="1.5"></circle>
              </svg>

              <div className="flex justify-between font-code-sm text-code-sm text-secondary pt-2 px-1">
                <span>06:00 AM</span>
                <span>08:00 AM (Peak 4.8k)</span>
                <span>10:00 AM</span>
                <span>12:00 PM</span>
                <span>02:00 PM (Shift B)</span>
                <span>04:00 PM</span>
                <span>08:00 PM</span>
                <span>11:00 PM (Shift C)</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-space-xs text-secondary font-body-xs text-body-xs">
              <span className="flex items-center gap-space-2xs">
                <span className="material-symbols-outlined text-xs text-tertiary-container">verified</span>
                Biometric sync latency: 180ms across 42 enterprise turnstiles
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('attendance')}
                className="text-primary font-label-xs text-label-xs font-semibold hover:underline flex items-center gap-space-2xs cursor-pointer"
              >
                Open Attendance Log Explorer
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </button>
            </div>
          </div>

          {/* Payroll Run Lifecycle Progress Tracker */}
          <div className="bg-surface-container-lowest p-space-base rounded shadow-sm flex flex-col gap-space-md border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
              <div className="flex items-center gap-space-sm">
                <div className="p-space-xs bg-surface-container-low rounded text-primary">
                  <span className="material-symbols-outlined text-xl">payments</span>
                </div>
                <div>
                  <div className="flex items-center gap-space-xs">
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Payroll Cycle Lifecycle
                    </h3>
                    <span className="px-space-xs py-0.5 rounded font-code-sm text-code-sm bg-surface-container font-semibold text-on-surface">
                      #PR-2026-09
                    </span>
                    <span className="px-space-xs py-0.5 rounded font-label-xs text-label-xs font-bold bg-secondary-container text-on-secondary-fixed-variant uppercase">
                      Phase 4 / 6 Active
                    </span>
                  </div>
                  <p className="font-body-xs text-body-xs text-secondary">
                    Target disbursement: September 30, 2026 · Auto-settlement direct to 12 scheduled banking partners
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-space-xs">
                <button
                  type="button"
                  onClick={() => onNavigateTab('payroll-runs')}
                  className="px-space-sm py-1 bg-surface-container-low text-on-surface rounded font-label-sm text-label-sm hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Audit Breakdown
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('payroll-runs')}
                  className="px-space-sm py-1 bg-primary text-on-primary rounded font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
                >
                  Open Exception Resolver
                </button>
              </div>
            </div>

            {/* Stepper */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-space-xs pt-space-xs">
              <div className="flex flex-col gap-1 p-space-xs rounded bg-surface-container-low">
                <div className="flex items-center justify-between">
                  <span className="font-label-xs text-label-xs font-bold text-secondary">01 DRAFT</span>
                  <span className="material-symbols-outlined text-sm text-tertiary-container">check_circle</span>
                </div>
                <span className="font-body-xs text-body-xs text-on-surface font-medium truncate">Timesheets Locked</span>
                <span className="font-code-sm text-code-sm text-secondary">Sep 24 · 18:00</span>
              </div>
              <div className="flex flex-col gap-1 p-space-xs rounded bg-surface-container-low">
                <div className="flex items-center justify-between">
                  <span className="font-label-xs text-label-xs font-bold text-secondary">02 VALIDATE</span>
                  <span className="material-symbols-outlined text-sm text-tertiary-container">check_circle</span>
                </div>
                <span className="font-body-xs text-body-xs text-on-surface font-medium truncate">Tax Regimes & TDS</span>
                <span className="font-code-sm text-code-sm text-secondary">Sep 25 · 09:30</span>
              </div>
              <div className="flex flex-col gap-1 p-space-xs rounded bg-surface-container-low">
                <div className="flex items-center justify-between">
                  <span className="font-label-xs text-label-xs font-bold text-secondary">03 COMPUTE</span>
                  <span className="material-symbols-outlined text-sm text-tertiary-container">check_circle</span>
                </div>
                <span className="font-body-xs text-body-xs text-on-surface font-medium truncate">Overtime & LOP</span>
                <span className="font-code-sm text-code-sm text-secondary">Sep 26 · 04:12</span>
              </div>
              <div className="flex flex-col gap-1 p-space-xs rounded bg-primary text-on-primary shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-xs text-label-xs font-bold text-on-primary uppercase tracking-wide">
                    04 REVIEW
                  </span>
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                </div>
                <span className="font-body-xs text-body-xs font-bold truncate">Executive Sign-off</span>
                <span className="font-code-sm text-code-sm text-on-primary-container">Underway (CFO)</span>
              </div>
              <div className="flex flex-col gap-1 p-space-xs rounded bg-surface-container">
                <div className="flex items-center justify-between">
                  <span className="font-label-xs text-label-xs font-bold text-secondary">05 APPROVAL</span>
                  <span className="material-symbols-outlined text-sm text-secondary">lock</span>
                </div>
                <span className="font-body-xs text-body-xs text-secondary font-medium truncate">Treasury Release</span>
                <span className="font-code-sm text-code-sm text-secondary">Queue Ready</span>
              </div>
              <div className="flex flex-col gap-1 p-space-xs rounded bg-surface-container">
                <div className="flex items-center justify-between">
                  <span className="font-label-xs text-label-xs font-bold text-secondary">06 DISBURSED</span>
                  <span className="material-symbols-outlined text-sm text-secondary">hourglass_empty</span>
                </div>
                <span className="font-body-xs text-body-xs text-secondary font-medium truncate">Direct Deposit</span>
                <span className="font-code-sm text-code-sm text-secondary">ETA Sep 30</span>
              </div>
            </div>

            {/* Financial Breakdown strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm p-space-md bg-surface rounded">
              <div className="flex flex-col">
                <span className="font-label-xs text-label-xs uppercase font-semibold text-secondary">
                  Gross Earnings Commitment
                </span>
                <span className="font-headline-md text-headline-md font-bold text-on-surface">₹10,48,22,400</span>
                <span className="font-body-xs text-body-xs text-secondary">Base salaries, allowances & bonuses</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-xs text-label-xs uppercase font-semibold text-secondary">
                  Statutory Deductions & TDS
                </span>
                <span className="font-headline-md text-headline-md font-bold text-error">₹2,06,18,000</span>
                <span className="font-body-xs text-body-xs text-secondary">PF, ESI, Professional Tax & TDS</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-xs text-label-xs uppercase font-semibold text-secondary">
                  Net Disbursable Payout
                </span>
                <span className="font-headline-md text-headline-md font-bold text-tertiary-container">
                  ₹8,42,04,400
                </span>
                <span className="font-body-xs text-body-xs text-secondary">Scheduled for 10,248 active accounts</span>
              </div>
            </div>

            {/* Notice Alert for blockers */}
            <div className="flex items-center justify-between p-space-sm bg-error-container/40 rounded text-on-surface">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-base text-error">warning</span>
                <span className="font-body-sm text-body-sm font-medium">
                  Stage 04 requires resolving <strong>4 Critical blocking items</strong> (tax bracket mismatch & dual-bank routing failure) before treasury unlock.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('payroll-runs')}
                className="font-label-sm text-label-sm font-semibold text-primary hover:underline whitespace-nowrap cursor-pointer"
              >
                View Blockers
              </button>
            </div>
          </div>

          {/* Department Headcount & Attendance Breakdown Table */}
          <div className="bg-surface-container-lowest p-space-base rounded shadow-sm flex flex-col gap-space-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Department Headcount & Attendance Breakdown
                </h3>
                <p className="font-body-xs text-body-xs text-secondary">
                  Live workforce distribution across 5 core enterprise divisions
                </p>
              </div>
              <div className="flex items-center gap-space-xs">
                <button
                  type="button"
                  onClick={() => onNavigateTab('departments')}
                  className="p-1 rounded text-secondary hover:bg-surface-container hover:text-on-surface cursor-pointer"
                  title="Filter Departments"
                >
                  <span className="material-symbols-outlined text-sm">filter_list</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('reports-workforce')}
                  className="p-1 rounded text-secondary hover:bg-surface-container hover:text-on-surface cursor-pointer"
                  title="Expand Full Analytics"
                >
                  <span className="material-symbols-outlined text-sm">fullscreen</span>
                </button>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low text-secondary font-label-xs text-label-xs uppercase tracking-wider">
                    <th className="py-2.5 px-space-sm">Department</th>
                    <th className="py-2.5 px-space-sm">Headcount</th>
                    <th className="py-2.5 px-space-sm">Present Today</th>
                    <th className="py-2.5 px-space-sm">Attendance Rate</th>
                    <th className="py-2.5 px-space-sm">On Leave / WFH</th>
                    <th className="py-2.5 px-space-sm text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-surface-container-low">
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-space-sm px-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-primary font-bold font-code-sm text-code-sm">
                          ENG
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm font-semibold">Engineering & Product</span>
                          <span className="font-body-xs text-body-xs text-secondary">VP: Siddharth Rao</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-space-sm px-space-sm font-code-sm text-code-sm font-semibold">3,410</td>
                    <td className="py-space-sm px-space-sm font-code-sm text-code-sm">3,205</td>
                    <td className="py-space-sm px-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-24 bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '94%' }}></div>
                        </div>
                        <span className="font-code-sm text-code-sm font-medium">94.0%</span>
                      </div>
                    </td>
                    <td className="py-space-sm px-space-sm font-code-sm text-code-sm text-secondary">112 Leave · 93 WFH</td>
                    <td className="py-space-sm px-space-sm text-right">
                      <span className="px-space-xs py-0.5 rounded font-label-xs text-label-xs font-semibold bg-surface-container-low text-tertiary-container">
                        Optimal
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-space-sm px-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-primary font-bold font-code-sm text-code-sm">
                          OPS
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm font-semibold">Global Operations & Supply</span>
                          <span className="font-body-xs text-body-xs text-secondary">Director: Marcus Vance</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-space-sm px-space-sm font-code-sm text-code-sm font-semibold">2,180</td>
                    <td className="py-space-sm px-space-sm font-code-sm text-code-sm">2,027</td>
                    <td className="py-space-sm px-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-24 bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div className="bg-tertiary-container h-full rounded-full" style={{ width: '93%' }}></div>
                        </div>
                        <span className="font-code-sm text-code-sm font-medium">93.0%</span>
                      </div>
                    </td>
                    <td className="py-space-sm px-space-sm font-code-sm text-code-sm text-secondary">86 Leave · 67 Remote</td>
                    <td className="py-space-sm px-space-sm text-right">
                      <span className="px-space-xs py-0.5 rounded font-label-xs text-label-xs font-semibold bg-surface-container-low text-tertiary-container">
                        Optimal
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-space-sm px-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-primary font-bold font-code-sm text-code-sm">
                          SLS
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm font-semibold">Sales, Growth & Marketing</span>
                          <span className="font-body-xs text-body-xs text-secondary">VP: Elena Rostova</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-space-sm px-space-sm font-code-sm text-code-sm font-semibold">1,840</td>
                    <td className="py-space-sm px-space-sm font-code-sm text-code-sm">1,634</td>
                    <td className="py-space-sm px-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-24 bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary-container h-full rounded-full" style={{ width: '88.8%' }}></div>
                        </div>
                        <span className="font-code-sm text-code-sm font-medium">88.8%</span>
                      </div>
                    </td>
                    <td className="py-space-sm px-space-sm font-code-sm text-code-sm text-secondary">94 Leave · 112 Field</td>
                    <td className="py-space-sm px-space-sm text-right">
                      <span className="px-space-xs py-0.5 rounded font-label-xs text-label-xs font-semibold bg-secondary-container text-on-secondary-container">
                        Field Heavy
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-space-sm px-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-primary font-bold font-code-sm text-code-sm">
                          FIN
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm font-semibold">Finance, Tax & Legal</span>
                          <span className="font-body-xs text-body-xs text-secondary">CFO Office: Ananya Sen</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-space-sm px-space-sm font-code-sm text-code-sm font-semibold">680</td>
                    <td className="py-space-sm px-space-sm font-code-sm text-code-sm">646</td>
                    <td className="py-space-sm px-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-24 bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div className="bg-tertiary-container h-full rounded-full" style={{ width: '95%' }}></div>
                        </div>
                        <span className="font-code-sm text-code-sm font-medium">95.0%</span>
                      </div>
                    </td>
                    <td className="py-space-sm px-space-sm font-code-sm text-code-sm text-secondary">22 Leave · 12 WFH</td>
                    <td className="py-space-sm px-space-sm text-right">
                      <span className="px-space-xs py-0.5 rounded font-label-xs text-label-xs font-semibold bg-surface-container-low text-tertiary-container">
                        High Stability
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-space-sm px-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-primary font-bold font-code-sm text-code-sm">
                          HCM
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm font-semibold">People Operations & HR</span>
                          <span className="font-body-xs text-body-xs text-secondary">CHRO: Vikram Malhotra</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-space-sm px-space-sm font-code-sm text-code-sm font-semibold">290</td>
                    <td className="py-space-sm px-space-sm font-code-sm text-code-sm">282</td>
                    <td className="py-space-sm px-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-24 bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div className="bg-tertiary-container h-full rounded-full" style={{ width: '97.2%' }}></div>
                        </div>
                        <span className="font-code-sm text-code-sm font-medium">97.2%</span>
                      </div>
                    </td>
                    <td className="py-space-sm px-space-sm font-code-sm text-code-sm text-secondary">6 Leave · 2 Remote</td>
                    <td className="py-space-sm px-space-sm text-right">
                      <span className="px-space-xs py-0.5 rounded font-label-xs text-label-xs font-semibold bg-surface-container-low text-tertiary-container">
                        Peak Present
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 Columns) */}
        <div className="xl:col-span-4 flex flex-col gap-space-lg min-w-0">
          {/* Urgent Approvals Queue */}
          <div className="bg-surface-container-lowest p-space-base rounded shadow-sm flex flex-col gap-space-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-base text-error">assignment_late</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Urgent Approvals</h3>
              </div>
              <span className="px-space-xs py-0.5 rounded font-code-sm text-code-sm font-bold bg-error-container text-on-error-container">
                14 SLA Due
              </span>
            </div>
            <p className="font-body-xs text-body-xs text-secondary">
              High-priority executive sign-offs scheduled for automated escalation in &lt; 2 hours
            </p>

            <div className="flex flex-col gap-space-xs">
              {urgentApprovals.map((app) => (
                <div
                  key={app.id}
                  className="p-space-sm bg-surface-container-low rounded flex flex-col gap-space-xs hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <img
                        className="w-7 h-7 rounded-full object-cover"
                        src={app.requesterAvatar}
                        alt={app.requesterName}
                      />
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                          {app.requesterName}
                        </span>
                        <span className="font-body-xs text-body-xs text-secondary">{app.requesterRole}</span>
                      </div>
                    </div>
                    <span className="px-space-xs py-0.5 rounded font-code-sm text-code-sm text-error bg-error-container font-bold">
                      {app.slaRiskText}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-surface-container-lowest px-space-xs py-1 rounded">
                    <span className="font-body-xs text-body-xs text-on-surface font-medium">{app.title}</span>
                    <span className="font-code-sm text-code-sm font-bold text-on-surface">
                      {app.amountFormatted || app.daysFormatted}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-space-xs pt-1">
                    <button
                      type="button"
                      onClick={() => onRejectItem(app.id)}
                      className="px-space-xs py-1 rounded font-label-xs text-label-xs font-semibold text-secondary hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => onApproveItem(app.id)}
                      className="px-space-sm py-1 rounded font-label-xs text-label-xs font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('my-approvals')}
              className="w-full text-center py-1.5 rounded font-label-xs text-label-xs font-semibold text-primary bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer"
            >
              View All 127 Pending Requests
            </button>
          </div>

          {/* Compliance & Blockers Radar */}
          <div className="bg-surface-container-lowest p-space-base rounded shadow-sm flex flex-col gap-space-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-base text-error">gavel</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Compliance & Blockers</h3>
              </div>
              <span className="px-space-xs py-0.5 rounded font-label-xs text-label-xs font-bold text-error bg-error-container">
                4 Critical
              </span>
            </div>

            <div className="p-space-sm rounded bg-error-container/30 flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-xs text-label-xs font-bold text-error uppercase tracking-wider">
                  Payroll Cycle Critical
                </span>
                <span className="font-code-sm text-code-sm text-error font-bold">BLOCKING DISBURSEMENT</span>
              </div>
              <p className="font-body-xs text-body-xs text-on-surface leading-snug">
                4 employee records hold unmapped banking IFSC roots or missing Form 12BB investment proof validations.
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="font-code-sm text-code-sm text-secondary">Affected Volume: ₹4,18,200</span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('payroll-runs')}
                  className="px-space-sm py-1 rounded font-label-xs text-label-xs font-semibold bg-error text-on-error hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Resolve in Hub
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-space-xs pt-space-xs">
              <div className="flex items-center justify-between py-1 font-body-xs text-body-xs">
                <span className="text-on-surface font-medium flex items-center gap-space-xs">
                  <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
                  Statutory PF E-Challan Generation
                </span>
                <span className="font-label-xs text-label-xs font-semibold text-tertiary-container">Compliant</span>
              </div>
              <div className="flex items-center justify-between py-1 font-body-xs text-body-xs">
                <span className="text-on-surface font-medium flex items-center gap-space-xs">
                  <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
                  ESI Form 5 Compliance Filing
                </span>
                <span className="font-label-xs text-label-xs font-semibold text-tertiary-container">Compliant</span>
              </div>
              <div className="flex items-center justify-between py-1 font-body-xs text-body-xs">
                <span className="text-on-surface font-medium flex items-center gap-space-xs">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Labor Welfare Fund (State Audit)
                </span>
                <span className="font-label-xs text-label-xs font-semibold text-secondary">Due in 12d</span>
              </div>
            </div>
          </div>

          {/* Real-Time Audit Stream */}
          <div className="bg-surface-container-lowest p-space-base rounded shadow-sm flex flex-col gap-space-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-base text-secondary">receipt_long</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Live Ledger Audit Stream
                </h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-tertiary-container animate-ping"></span>
            </div>

            <div className="flex flex-col divide-y divide-surface-container-low gap-space-xs">
              <div className="flex items-start gap-space-xs py-1">
                <span className="material-symbols-outlined text-sm text-primary mt-0.5">fingerprint</span>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-body-xs text-body-xs font-semibold text-on-surface truncate">
                    Batch Biometric Clock-in Sync #882
                  </span>
                  <span className="font-code-sm text-code-sm text-secondary">Zone 4 (Bengaluru Campus) · 1,412 rec</span>
                </div>
                <span className="font-code-sm text-code-sm text-secondary whitespace-nowrap">12s ago</span>
              </div>
              <div className="flex items-start gap-space-xs py-1">
                <span className="material-symbols-outlined text-sm text-tertiary-container mt-0.5">price_check</span>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-body-xs text-body-xs font-semibold text-on-surface truncate">
                    Salary Revision Committal
                  </span>
                  <span className="font-code-sm text-code-sm text-secondary">EMP-9021 · Band L6 promo applied</span>
                </div>
                <span className="font-code-sm text-code-sm text-secondary whitespace-nowrap">2m ago</span>
              </div>
              <div className="flex items-start gap-space-xs py-1">
                <span className="material-symbols-outlined text-sm text-primary-container mt-0.5">verified_user</span>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-body-xs text-body-xs font-semibold text-on-surface truncate">
                    Admin Token Role Escalation
                  </span>
                  <span className="font-code-sm text-code-sm text-secondary">v.malhotra@acme.com · Session 2FA ok</span>
                </div>
                <span className="font-code-sm text-code-sm text-secondary whitespace-nowrap">7m ago</span>
              </div>
              <div className="flex items-start gap-space-xs py-1">
                <span className="material-symbols-outlined text-sm text-secondary mt-0.5">event_available</span>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-body-xs text-body-xs font-semibold text-on-surface truncate">
                    Maternity Leave Granted
                  </span>
                  <span className="font-code-sm text-code-sm text-secondary">EMP-4418 · Legal policy auto-approved</span>
                </div>
                <span className="font-code-sm text-code-sm text-secondary whitespace-nowrap">14m ago</span>
              </div>
            </div>

            <div className="pt-space-xs flex items-center justify-between text-secondary font-label-xs text-label-xs border-t border-surface-container-low">
              <span>Encrypted SHA-256 Ledger</span>
              <button
                type="button"
                onClick={() => onNavigateTab('audit-logs')}
                className="text-primary hover:underline font-semibold flex items-center gap-space-2xs cursor-pointer"
              >
                Export Audit Trail
                <span className="material-symbols-outlined text-xs">download</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
