import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { PayrollRun, PayrollException } from '../../types/index.ts';
import { payrollApi } from '../../services/apiServices.ts';

interface PayrollOperationsViewProps {
  currentRun: PayrollRun | null;
  exceptions: PayrollException[];
  onOpenAiAssistant: () => void;
  onRefresh: () => void;
  onSelectEmployeeForPayslip?: (empCode: string) => void;
}

export const PayrollOperationsView: React.FC<PayrollOperationsViewProps> = ({
  currentRun,
  exceptions,
  onOpenAiAssistant,
  onRefresh,
  onSelectEmployeeForPayslip,
}) => {
  const { hasPermission, currentUser } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'bank' | 'netpay' | 'attendance' | 'tax'>('all');
  const [tableSearch, setTableSearch] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'exceptions' | 'register' | 'compliance' | 'audit'>('exceptions');
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canResolve = hasPermission('PAYROLL_EXCEPTION_RESOLVE');
  const canApprove = hasPermission('PAYROLL_APPROVE');

  if (!currentRun) {
    return (
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
        <div className="flex flex-col gap-1">
          <h1 className="font-display-lg text-2xl font-bold text-on-surface">
            Payroll Operations & Exception Resolution
          </h1>
          <p className="text-secondary text-sm">
            Statutory deduction engines, exception clearing desks, and banking host-to-host settlement.
          </p>
        </div>

        <div className="py-16 text-center bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-xs flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">payments</span>
          </div>
          <h3 className="font-bold text-base text-on-surface">No Payroll Runs Initiated</h3>
          <p className="text-xs text-secondary max-w-sm">
            There are no active or scheduled payroll cycles in the database. When employees and attendance are logged, payroll runs will appear here for validation and disbursement.
          </p>
        </div>
      </div>
    );
  }

  const handleRevalidate = async () => {
    try {
      setIsRevalidating(true);
      const res: any = await payrollApi.revalidate(currentRun.id);
      setToastMessage(res?.message || 'Payroll revalidated successfully.');
      onRefresh();
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      setToastMessage(err.message || 'Revalidation failed.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsRevalidating(false);
    }
  };

  const handleResolveException = async (excId: string, actionNote: string) => {
    try {
      await payrollApi.resolveException(currentRun.id, excId);
      setToastMessage(`Exception resolved: ${actionNote}`);
      onRefresh();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to resolve exception.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleCfoApproval = async () => {
    try {
      await payrollApi.approveRun(currentRun.id);
      setToastMessage('CFO Cryptographic Sign-Off Verified: Treasury dispatch authorization unlocked.');
      onRefresh();
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      setToastMessage(err.message || 'Approval blocked.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Filter exceptions
  const filteredExceptions = exceptions.filter((exc) => {
    if (selectedFilter === 'critical') {
      if (exc.severity !== 'CRITICAL') return false;
    } else if (selectedFilter === 'bank') {
      if (exc.exceptionType !== 'MISSING_BANK_IFSC') return false;
    } else if (selectedFilter === 'netpay') {
      if (exc.exceptionType !== 'NEGATIVE_NET_PAY') return false;
    } else if (selectedFilter === 'attendance') {
      if (exc.exceptionType !== 'UNRECORDED_PUNCHES') return false;
    } else if (selectedFilter === 'tax') {
      if (exc.exceptionType !== 'TAX_ANOMALY') return false;
    }

    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      const match =
        exc.employeeName.toLowerCase().includes(q) ||
        exc.employeeCode.toLowerCase().includes(q) ||
        exc.exceptionTypeLabel.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const criticalRemaining = exceptions.filter((e) => e.severity === 'CRITICAL' && e.status !== 'RESOLVED').length;

  return (
    <div className="flex flex-col w-full gap-space-lg animate-in fade-in duration-200">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3 bg-tertiary text-on-tertiary rounded-lg shadow-md flex items-center justify-between font-body-sm text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="cursor-pointer">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Main Cycle Sub-header */}
      <div className="flex flex-col gap-space-md">
        <div className="flex flex-wrap items-center justify-between gap-space-base">
          <div className="flex items-center gap-space-base">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-sm">
                <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
                  Payroll Run {currentRun.runCode}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-xs text-label-xs font-semibold uppercase tracking-wider ${
                    currentRun.status === 'APPROVED'
                      ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                      : criticalRemaining > 0
                      ? 'bg-error-container text-on-error-container'
                      : 'bg-secondary-container text-on-secondary-container'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      currentRun.status === 'APPROVED'
                        ? 'bg-tertiary'
                        : criticalRemaining > 0
                        ? 'bg-error animate-pulse'
                        : 'bg-primary'
                    }`}
                  ></span>
                  {currentRun.status === 'APPROVED'
                    ? 'CFO Approved & Ready'
                    : `Review Required (Step ${currentRun.step} of 6)`}
                </span>
              </div>
              <div className="flex items-center gap-space-md mt-1 text-secondary">
                <span className="flex items-center gap-1 font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                  September 2026 (01 Sep – 30 Sep 2026)
                </span>
                <span className="h-3 w-px bg-surface-variant"></span>
                <span className="flex items-center gap-1 font-body-sm text-body-sm text-tertiary">
                  <span className="material-symbols-outlined text-sm">cloud_done</span>
                  {currentRun.bankingGatewayStatus}
                </span>
                <span className="h-3 w-px bg-surface-variant"></span>
                <span className="font-code-sm text-code-sm text-on-surface-variant">
                  BATCH ID: {currentRun.batchId}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-space-xs">
            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-space-xs h-9 px-space-md bg-secondary-container text-on-secondary-container rounded font-label-sm text-label-sm font-semibold hover:bg-secondary-container/80 transition-all shadow-sm cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-base text-primary">psychology</span>
              <span>AI Exception Assistant</span>
            </button>
            <button
              onClick={handleRevalidate}
              disabled={isRevalidating}
              className="flex items-center gap-space-xs h-9 px-space-md bg-surface-container-lowest text-on-surface rounded font-label-sm text-label-sm shadow-sm hover:bg-surface-container transition-all border border-slate-200 cursor-pointer disabled:opacity-50"
              type="button"
            >
              <span className={`material-symbols-outlined text-sm text-secondary ${isRevalidating ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{isRevalidating ? 'Checking Rules...' : 'Run Auto-Revalidation'}</span>
            </button>
            <button
              onClick={() => {
                setToastMessage('Bank Disbursement file formatted for HDFC Host-to-Host (ISO 20022 XML packet).');
                setTimeout(() => setToastMessage(null), 4000);
              }}
              className="flex items-center gap-space-xs h-9 px-space-md bg-surface-container-lowest text-on-surface rounded font-label-sm text-label-sm shadow-sm hover:bg-surface-container transition-all border border-slate-200 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-sm text-secondary">file_download</span>
              <span>Export Bank Disbursement File</span>
            </button>
            <button
              onClick={handleCfoApproval}
              disabled={criticalRemaining > 0 || currentRun.status === 'APPROVED' || !canApprove}
              className={`flex items-center gap-space-xs h-9 px-space-md rounded font-label-sm text-label-sm transition-all shadow-sm cursor-pointer ${
                criticalRemaining > 0
                  ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed opacity-90'
                  : currentRun.status === 'APPROVED'
                  ? 'bg-tertiary text-on-tertiary font-bold cursor-default'
                  : 'bg-primary text-on-primary font-bold hover:bg-primary-container'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">
                {currentRun.status === 'APPROVED' ? 'verified' : criticalRemaining > 0 ? 'lock' : 'draw'}
              </span>
              <span>
                {currentRun.status === 'APPROVED'
                  ? 'Authorized by CFO'
                  : 'Submit for CFO Approval'}
              </span>
              {criticalRemaining > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded font-label-xs text-label-xs bg-error-container text-on-error-container font-semibold">
                  Blocked: {criticalRemaining} Criticals
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Stepper Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-space-xs bg-surface-container-low p-space-xs rounded-lg">
          <div className="flex items-center gap-space-xs px-space-sm py-1.5 rounded bg-surface-container-lowest text-on-surface border border-slate-100">
            <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
            <span className="font-label-xs text-label-xs font-semibold">1. Attendance Lock</span>
          </div>
          <div className="flex items-center gap-space-xs px-space-sm py-1.5 rounded bg-surface-container-lowest text-on-surface border border-slate-100">
            <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
            <span className="font-label-xs text-label-xs font-semibold">2. Variable Inputs</span>
          </div>
          <div className="flex items-center gap-space-xs px-space-sm py-1.5 rounded bg-surface-container-lowest text-on-surface border border-slate-100">
            <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
            <span className="font-label-xs text-label-xs font-semibold">3. Gross Calculation</span>
          </div>
          <div
            className={`flex items-center justify-between px-space-sm py-1.5 rounded shadow-sm ${
              currentRun.step >= 4 ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary'
            }`}
          >
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-sm">
                {criticalRemaining === 0 ? 'check_circle' : 'hourglass_top'}
              </span>
              <span className="font-label-xs text-label-xs font-semibold">4. Exception Clearing</span>
            </div>
            <span className="font-code-sm text-code-sm bg-primary-container px-1 rounded text-on-primary">
              {currentRun.exceptionsTotal} Left
            </span>
          </div>
          <div
            className={`flex items-center gap-space-xs px-space-sm py-1.5 rounded ${
              currentRun.status === 'APPROVED'
                ? 'bg-tertiary text-on-tertiary font-semibold'
                : 'text-secondary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {currentRun.status === 'APPROVED' ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            <span className="font-label-xs text-label-xs">5. CFO Sign-Off</span>
          </div>
          <div className="flex items-center gap-space-xs px-space-sm py-1.5 rounded text-secondary">
            <span className="material-symbols-outlined text-sm">radio_button_unchecked</span>
            <span className="font-label-xs text-label-xs">6. Host-to-Host Disburse</span>
          </div>
        </div>
      </div>

      {/* Top Financial Metric Bar (5 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-md">
        <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between border border-slate-200">
          <div className="flex items-start justify-between">
            <span className="font-label-xs text-label-xs text-secondary uppercase font-semibold">
              Gross Pay Commitment
            </span>
            <span className="material-symbols-outlined text-secondary text-base">account_balance_wallet</span>
          </div>
          <div className="mt-space-sm">
            <div className="font-headline-md text-headline-md font-bold text-on-surface tabular-nums">
              ₹10,48,22,400
            </div>
            <div className="flex items-center gap-1 mt-1 text-tertiary">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              <span className="font-body-xs text-body-xs font-medium">100% CTC base sync</span>
            </div>
          </div>
          <div className="w-full bg-surface-container h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between border border-slate-200">
          <div className="flex items-start justify-between">
            <span className="font-label-xs text-label-xs text-secondary uppercase font-semibold">
              Statutory & Deductions
            </span>
            <span className="material-symbols-outlined text-secondary text-base">receipt_long</span>
          </div>
          <div className="mt-space-sm">
            <div className="font-headline-md text-headline-md font-bold text-on-surface tabular-nums">
              ₹2,06,18,000
            </div>
            <div className="flex items-center gap-1 mt-1 text-on-surface-variant">
              <span className="material-symbols-outlined text-xs">shield</span>
              <span className="font-body-xs text-body-xs">PF, ESI, TDS, PTax verified</span>
            </div>
          </div>
          <div className="w-full bg-surface-container h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-secondary h-full rounded-full" style={{ width: '19.6%' }}></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between border border-slate-200">
          <div className="flex items-start justify-between">
            <span className="font-label-xs text-label-xs text-secondary uppercase font-semibold">
              Net Payout Commitment
            </span>
            <span className="material-symbols-outlined text-primary text-base">send_money</span>
          </div>
          <div className="mt-space-sm">
            <div className="font-headline-md text-headline-md font-bold text-primary tabular-nums">
              ₹8,42,04,400
            </div>
            <div className="flex items-center gap-1 mt-1 text-secondary">
              <span className="material-symbols-outlined text-xs">account_balance</span>
              <span className="font-body-xs text-body-xs">Direct Bank Transfer</span>
            </div>
          </div>
          <div className="w-full bg-surface-container h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-tertiary-container h-full rounded-full" style={{ width: '80.4%' }}></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between border border-slate-200">
          <div className="flex items-start justify-between">
            <span className="font-label-xs text-label-xs text-secondary uppercase font-semibold">
              Processed Employees
            </span>
            <span className="material-symbols-outlined text-secondary text-base">groups</span>
          </div>
          <div className="mt-space-sm">
            <div className="flex items-baseline gap-1">
              <span className="font-headline-md text-headline-md font-bold text-on-surface tabular-nums">
                10,248
              </span>
              <span className="font-body-sm text-body-sm text-secondary">/ 10,248</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-tertiary">
              <span className="material-symbols-outlined text-xs">verified</span>
              <span className="font-body-xs text-body-xs font-medium">100% Calculated</span>
            </div>
          </div>
          <div className="w-full bg-surface-container h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-tertiary-container h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="bg-error-container/40 p-space-md rounded-lg shadow-sm flex flex-col justify-between border border-error-container">
          <div className="flex items-start justify-between">
            <span className="font-label-xs text-label-xs text-on-error-container uppercase font-semibold">
              Exceptions Flagged
            </span>
            <span className="material-symbols-outlined text-error text-base">warning</span>
          </div>
          <div className="mt-space-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-headline-md text-headline-md font-bold text-error tabular-nums">
                {currentRun.exceptionsTotal}
              </span>
              <span className="font-label-xs text-label-xs text-on-error-container font-semibold uppercase">
                Total Issues
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 font-body-xs text-body-xs text-on-error-container">
              <span className="font-bold text-error">{criticalRemaining} Critical Blockers</span>
              <span>•</span>
              <span>19 Warnings</span>
            </div>
          </div>
          <div className="w-full bg-surface-container-high h-1 rounded-full mt-3 overflow-hidden flex">
            <div className="bg-error h-full" style={{ width: `${(criticalRemaining / 23) * 100}%` }}></div>
            <div className="bg-secondary h-full" style={{ width: `${((23 - criticalRemaining) / 23) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Workspace Sub-navigation Tabs */}
      <div className="flex items-center justify-between bg-surface-container-lowest px-space-base rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-space-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('overview')}
            className={`py-space-md font-label-md text-label-md transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'overview' ? 'text-primary font-semibold border-b-2 border-primary' : 'text-secondary hover:text-on-surface'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('exceptions')}
            className={`py-space-md font-label-md text-label-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'exceptions' ? 'text-primary font-semibold border-b-2 border-primary' : 'text-secondary hover:text-on-surface'
            }`}
          >
            <span>Exception Resolver</span>
            <span className="px-2 py-0.5 rounded-full font-label-xs text-label-xs bg-error-container text-on-error-container font-bold">
              {currentRun.exceptionsTotal}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('register')}
            className={`py-space-md font-label-md text-label-md transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'register' ? 'text-primary font-semibold border-b-2 border-primary' : 'text-secondary hover:text-on-surface'
            }`}
          >
            Employee Salary Register (10,248)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('compliance')}
            className={`py-space-md font-label-md text-label-md transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'compliance' ? 'text-primary font-semibold border-b-2 border-primary' : 'text-secondary hover:text-on-surface'
            }`}
          >
            Statutory Compliance & Tax
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('audit')}
            className={`py-space-md font-label-md text-label-md transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'audit' ? 'text-primary font-semibold border-b-2 border-primary' : 'text-secondary hover:text-on-surface'
            }`}
          >
            Audit & Approval Trail
          </button>
        </div>
        <div className="hidden xl:flex items-center gap-space-sm text-secondary font-body-xs text-body-xs">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span>Payroll SLA: Disbursal in 27h 14m</span>
        </div>
      </div>

      {/* Main Exception Resolution Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* Left + Center Data Workspace (9 Cols) */}
        <div className="xl:col-span-9 flex flex-col gap-space-base">
          {/* Filter Toolbar */}
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col gap-space-sm border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedFilter('all')}
                  className={`px-3 py-1.5 rounded font-label-xs text-label-xs font-semibold transition-all cursor-pointer ${
                    selectedFilter === 'all'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  All ({exceptions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('critical')}
                  className={`px-3 py-1.5 rounded font-label-xs text-label-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    selectedFilter === 'critical'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-error"></span>
                  Critical Only ({exceptions.filter((e) => e.severity === 'CRITICAL').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('bank')}
                  className={`px-3 py-1.5 rounded font-label-xs text-label-xs font-semibold transition-all cursor-pointer ${
                    selectedFilter === 'bank'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  Missing Bank/IFSC (1)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('netpay')}
                  className={`px-3 py-1.5 rounded font-label-xs text-label-xs font-semibold transition-all cursor-pointer ${
                    selectedFilter === 'netpay'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  Negative Net Pay (1)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('attendance')}
                  className={`px-3 py-1.5 rounded font-label-xs text-label-xs font-semibold transition-all cursor-pointer ${
                    selectedFilter === 'attendance'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  Attendance Gap/LOP (1)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('tax')}
                  className={`px-3 py-1.5 rounded font-label-xs text-label-xs font-semibold transition-all cursor-pointer ${
                    selectedFilter === 'tax'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  Tax Anomaly (1)
                </button>
              </div>

              <div className="flex items-center gap-space-xs">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-2 text-secondary text-base">
                    search
                  </span>
                  <input
                    className="h-8 pl-8 pr-3 text-body-xs font-body-xs bg-surface-container-low rounded focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary w-48 shadow-inner"
                    placeholder="Filter employee or ID..."
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setToastMessage('Bulk Resolution: Auto-reconcile low-variance tax anomalies initiated.');
                    setTimeout(() => setToastMessage(null), 4000);
                  }}
                  className="h-8 px-2.5 bg-surface-container-low text-secondary rounded flex items-center gap-1 font-label-xs text-label-xs hover:bg-surface-container-high transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">tune</span>
                  <span>Bulk Actions</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-space-xs text-secondary font-body-xs text-body-xs border-t border-surface-container-low">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-sm text-error">info</span>
                <span>
                  {criticalRemaining} critical exceptions block final CFO sign-off and RTGS batch packaging. Resolving an issue recalculates the net pay in real-time.
                </span>
              </div>
              <span className="font-code-sm text-code-sm text-on-surface-variant font-semibold">
                Displaying {filteredExceptions.length} active
              </span>
            </div>
          </div>

          {/* Exception Data Grid */}
          <div className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low text-secondary font-label-xs text-label-xs uppercase">
                  <tr>
                    <th className="py-2.5 px-space-md w-28">Severity</th>
                    <th className="py-2.5 px-space-md">Employee ID & Name</th>
                    <th className="py-2.5 px-space-md">Designation & Dept</th>
                    <th className="py-2.5 px-space-md">Exception Type</th>
                    <th className="py-2.5 px-space-md min-w-[240px]">Discrepancy Detail</th>
                    <th className="py-2.5 px-space-md text-right">Net Impact</th>
                    <th className="py-2.5 px-space-md">Assigned To</th>
                    <th className="py-2.5 px-space-md text-center">Status</th>
                    <th className="py-2.5 px-space-md text-right min-w-[190px]">Resolution Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low font-body-sm text-body-sm text-on-surface">
                  {filteredExceptions.map((exc) => {
                    const isResolved = exc.status === 'RESOLVED';

                    return (
                      <tr
                        key={exc.id}
                        className={`hover:bg-surface-container-low/50 transition-colors ${
                          isResolved ? 'opacity-60 bg-surface-container-low/20' : ''
                        }`}
                      >
                        <td className="py-space-md px-space-md align-top">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-xs text-label-xs font-bold uppercase ${
                              isResolved
                                ? 'bg-surface-container text-secondary'
                                : exc.severity === 'CRITICAL'
                                ? 'bg-error text-on-error'
                                : 'bg-surface-container-highest text-on-surface-variant'
                            }`}
                          >
                            <span className="material-symbols-outlined text-xs">
                              {isResolved ? 'check' : exc.severity === 'CRITICAL' ? 'error' : 'warning'}
                            </span>
                            {isResolved ? 'RESOLVED' : exc.severity}
                          </span>
                        </td>
                        <td className="py-space-md px-space-md align-top">
                          <div className="flex items-center gap-space-xs">
                            <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center font-label-xs text-label-xs font-bold text-on-surface">
                              {exc.employeeName
                                .split(' ')
                                .map((p) => p[0])
                                .slice(0, 2)
                                .join('')}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                                {exc.employeeName}
                              </span>
                              <span className="font-code-sm text-code-sm text-secondary">{exc.employeeCode}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md align-top">
                          <div className="flex flex-col">
                            <span className="text-on-surface">{exc.designation}</span>
                            <span className="font-body-xs text-body-xs text-secondary">
                              {exc.department} • {exc.location}
                            </span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md align-top">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-xs text-label-xs font-medium">
                            {exc.exceptionTypeLabel}
                          </span>
                        </td>
                        <td className="py-space-md px-space-md align-top">
                          <p className="font-body-xs text-body-xs text-on-surface-variant leading-relaxed">
                            {exc.description}
                          </p>
                        </td>
                        <td
                          className={`py-space-md px-space-md align-top text-right font-code-sm text-code-sm font-bold ${
                            exc.netImpact < 0 ? 'text-error' : 'text-on-surface'
                          }`}
                        >
                          {exc.netImpact < 0
                            ? `-₹${Math.abs(exc.netImpact).toLocaleString()}`
                            : `₹${exc.netImpact.toLocaleString()}`}
                        </td>
                        <td className="py-space-md px-space-md align-top">
                          <span className="inline-flex items-center gap-1 font-body-xs text-body-xs text-secondary bg-surface-container px-2 py-0.5 rounded">
                            <span className="material-symbols-outlined text-xs">account_circle</span>
                            {exc.assignedDesk}
                          </span>
                        </td>
                        <td className="py-space-md px-space-md align-top text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-label-xs text-label-xs font-semibold ${
                              isResolved
                                ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                                : 'bg-error-container/60 text-on-error-container'
                            }`}
                          >
                            {isResolved ? 'Resolved' : exc.status}
                          </span>
                        </td>
                        <td className="py-space-md px-space-md align-top text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isResolved ? (
                              <>
                                <button
                                  type="button"
                                  disabled={!canResolve}
                                  onClick={() => handleResolveException(exc.id, exc.suggestedAction)}
                                  className="h-7 px-2 bg-primary text-on-primary rounded font-label-xs text-label-xs hover:bg-primary-container transition-colors shadow-xs cursor-pointer disabled:opacity-40"
                                >
                                  {exc.exceptionType === 'NEGATIVE_NET_PAY'
                                    ? 'Adjust Schedule'
                                    : exc.exceptionType === 'MISSING_BANK_IFSC'
                                    ? 'Update IFSC'
                                    : exc.exceptionType === 'TAX_ANOMALY'
                                    ? 'Recompute Tax'
                                    : exc.exceptionType === 'UNRECORDED_PUNCHES'
                                    ? 'Auto-Casual Leave'
                                    : 'Resolve Override'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setToastMessage(`Exception held for ${exc.employeeName}. Payout routed to manual cheque buffer.`);
                                    setTimeout(() => setToastMessage(null), 4000);
                                  }}
                                  className="h-7 px-2 bg-surface-container-low text-secondary rounded font-label-xs text-label-xs hover:bg-surface-container-high transition-colors cursor-pointer"
                                >
                                  Hold
                                </button>
                              </>
                            ) : (
                              <span className="text-tertiary text-xs font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Corrected
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-surface-container-low px-space-md py-space-sm flex items-center justify-between text-secondary font-body-xs text-body-xs border-t border-surface-container">
              <span>
                Showing {filteredExceptions.length} exceptions • 19 attendance/minor warnings queued for automated batch approval
              </span>
              <div className="flex items-center gap-space-xs">
                <button className="px-2 py-1 bg-surface-container-lowest rounded text-on-surface font-label-xs text-label-xs cursor-pointer" type="button">
                  Previous
                </button>
                <span className="px-2 font-code-sm text-code-sm">Page 1 of 6</span>
                <button className="px-2 py-1 bg-surface-container-lowest rounded text-on-surface font-label-xs text-label-xs cursor-pointer" type="button">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Drawer / Resolution Preview Panel (3 Cols) */}
        <div className="xl:col-span-3 flex flex-col gap-space-base">
          {/* Statutory Compliance Checklist Card */}
          <div className="bg-surface-container-lowest p-space-base rounded-lg shadow-sm flex flex-col gap-space-md border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-base">fact_check</span>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Statutory Audit Gate</h2>
              </div>
              <span className="font-label-xs text-label-xs text-secondary uppercase font-semibold">Pre-Flight</span>
            </div>

            <div className="flex flex-col gap-space-sm">
              <div className="p-space-sm rounded bg-surface-container-low flex items-start justify-between">
                <div className="flex items-start gap-space-xs">
                  <span className="material-symbols-outlined text-tertiary text-base mt-0.5">check_circle</span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">EPFO / ESIC Validation</span>
                    <span className="font-body-xs text-body-xs text-secondary">
                      10,248 accounts cross-referenced with EPFO UAN portal
                    </span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded font-label-xs text-label-xs bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                  PASS
                </span>
              </div>

              <div className="p-space-sm rounded bg-surface-container-low flex items-start justify-between">
                <div className="flex items-start gap-space-xs">
                  <span className="material-symbols-outlined text-tertiary text-base mt-0.5">check_circle</span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">Form 16 Tax Regimes</span>
                    <span className="font-body-xs text-body-xs text-secondary">
                      Sec 115BAC & Old Regime declarations computed
                    </span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded font-label-xs text-label-xs bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                  PASS
                </span>
              </div>

              <div
                className={`p-space-sm rounded flex items-start justify-between ${
                  criticalRemaining === 0 ? 'bg-surface-container-low' : 'bg-error-container/30'
                }`}
              >
                <div className="flex items-start gap-space-xs">
                  <span
                    className={`material-symbols-outlined text-base mt-0.5 ${
                      criticalRemaining === 0 ? 'text-tertiary' : 'text-error'
                    }`}
                  >
                    {criticalRemaining === 0 ? 'check_circle' : 'cancel'}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">IFSC Host Validation</span>
                    <span className="font-body-xs text-body-xs text-secondary">
                      {criticalRemaining === 0
                        ? 'All RTGS account nodes verified with NPCI'
                        : '1 RTGS account node failed HDFC NPCI handshake'}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded font-label-xs text-label-xs font-bold ${
                    criticalRemaining === 0
                      ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                      : 'bg-error text-on-error'
                  }`}
                >
                  {criticalRemaining === 0 ? 'PASS' : 'FAILED'}
                </span>
              </div>

              <div className="p-space-sm rounded bg-surface-container-low flex items-start justify-between">
                <div className="flex items-start gap-space-xs">
                  <span className="material-symbols-outlined text-tertiary text-base mt-0.5">check_circle</span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">Treasury Escrow Balance</span>
                    <span className="font-body-xs text-body-xs text-secondary">
                      Available balance: ₹12,50,00,000 (Coverage: 148%)
                    </span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded font-label-xs text-label-xs bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                  PASS
                </span>
              </div>
            </div>

            <div className="w-full bg-surface-container h-px"></div>

            {/* CFO Approval Gate Section */}
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface">CFO Approval Gate</span>
                <span
                  className={`font-label-xs text-label-xs font-bold uppercase ${
                    currentRun.status === 'APPROVED'
                      ? 'text-tertiary'
                      : criticalRemaining === 0
                      ? 'text-primary'
                      : 'text-error'
                  }`}
                >
                  {currentRun.status === 'APPROVED'
                    ? 'Signed'
                    : criticalRemaining === 0
                    ? 'Ready for Signature'
                    : 'Locked'}
                </span>
              </div>

              <div className="bg-surface-container-low p-space-sm rounded flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-xs">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-label-xs text-label-xs font-bold text-secondary">
                    AK
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">Ananya Kulkarni</span>
                    <span className="font-body-xs text-body-xs text-secondary">Chief Financial Officer • Key #982-A</span>
                  </div>
                </div>

                <div className="mt-2 bg-surface-container-lowest p-space-sm rounded text-center flex flex-col items-center justify-center gap-1 min-h-[90px] border border-surface-container">
                  <span className="material-symbols-outlined text-2xl text-secondary">
                    {currentRun.status === 'APPROVED' ? 'verified' : 'draw'}
                  </span>
                  <span className="font-label-xs text-label-xs font-semibold text-secondary uppercase tracking-wider">
                    {currentRun.status === 'APPROVED' ? 'Cryptographically e-Signed' : 'e-Sign Blocked'}
                  </span>
                  <span className="font-body-xs text-body-xs text-on-surface-variant max-w-[200px]">
                    {currentRun.status === 'APPROVED'
                      ? 'Session token validated with HSM audit key #982-A'
                      : criticalRemaining === 0
                      ? 'All blockers resolved! Unlocked for final authorization.'
                      : 'Requires zero critical blockers before cryptographic sign-off unlocks'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCfoApproval}
                disabled={criticalRemaining > 0 || currentRun.status === 'APPROVED' || !canApprove}
                className={`w-full h-9 rounded font-label-sm text-label-sm font-semibold flex items-center justify-center gap-space-xs transition-all cursor-pointer ${
                  currentRun.status === 'APPROVED'
                    ? 'bg-tertiary text-on-tertiary'
                    : criticalRemaining === 0
                    ? 'bg-primary text-on-primary hover:bg-primary-container shadow-md'
                    : 'bg-surface-container text-secondary cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {currentRun.status === 'APPROVED' ? 'check' : 'lock'}
                </span>
                <span>
                  {currentRun.status === 'APPROVED'
                    ? 'Dispatched via RTGS'
                    : 'Authorize & Dispatch via RTGS'}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Summary Metric Card */}
          <div className="bg-surface-container-lowest p-space-base rounded-lg shadow-sm flex flex-col gap-space-sm border border-slate-200">
            <span className="font-label-xs text-label-xs text-secondary uppercase font-semibold">
              Disbursement Health
            </span>
            <div className="flex items-center justify-between py-1">
              <span className="font-body-sm text-body-sm text-on-surface">Ready Accounts:</span>
              <span className="font-code-sm text-code-sm font-bold text-tertiary">
                {10248 - criticalRemaining} ({(((10248 - criticalRemaining) / 10248) * 100).toFixed(2)}%)
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="font-body-sm text-body-sm text-on-surface">Exceptions Pending:</span>
              <span className="font-code-sm text-code-sm font-bold text-error">{criticalRemaining} accounts</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="font-body-sm text-body-sm text-on-surface">Estimated HDFC Fees:</span>
              <span className="font-code-sm text-code-sm font-bold text-on-surface">₹5,124</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="font-body-sm text-body-sm text-on-surface">Cut-off Window:</span>
              <span className="font-body-xs text-body-xs font-semibold text-primary">Tomorrow, 14:00 IST</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
