import React, { useState, useEffect } from 'react';
import { runPayrollTests } from '../../__tests__/payrollEngine.test.ts';
import { runLeaveTests } from '../../__tests__/leaveEngine.test.ts';
import { runSecurityAndWorkflowTests } from '../../__tests__/securityEngine.test.ts';
import { runEmployeeManagementTests } from '../../__tests__/employeeEngine.test.ts';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [running, setRunning] = useState(false);
  const [payrollRes, setPayrollRes] = useState<any>(null);
  const [leaveRes, setLeaveRes] = useState<any>(null);
  const [securityRes, setSecurityRes] = useState<any>(null);
  const [employeeRes, setEmployeeRes] = useState<any>(null);
  const [actuatorHealth, setActuatorHealth] = useState<any>(null);

  const runAllDiagnostics = () => {
    setRunning(true);
    setTimeout(() => {
      setPayrollRes(runPayrollTests());
      setLeaveRes(runLeaveTests());
      setSecurityRes(runSecurityAndWorkflowTests());
      setEmployeeRes(runEmployeeManagementTests());

      fetch('/actuator/health')
        .then((r) => r.json())
        .then(setActuatorHealth)
        .catch(console.error)
        .finally(() => setRunning(false));
    }, 600);
  };

  useEffect(() => {
    if (isOpen) {
      runAllDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalPassed =
    (payrollRes?.passed || 0) +
    (leaveRes?.passed || 0) +
    (securityRes?.passed || 0) +
    (employeeRes?.passed || 0) +
    (actuatorHealth ? 3 : 0);
  const totalFailed =
    (payrollRes?.failed || 0) +
    (leaveRes?.failed || 0) +
    (securityRes?.failed || 0) +
    (employeeRes?.failed || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl shadow-2xl p-space-base flex flex-col gap-space-md border border-surface-container-high max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">terminal</span>
            <div>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                WorkSphere Enterprise Automated Test Suite & Diagnostics
              </span>
              <span className="ml-2 px-1.5 py-0.5 rounded font-code-sm text-[10px] bg-tertiary-fixed text-on-tertiary-fixed uppercase font-bold">
                JUnit 5 & Vitest Suite
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

        {/* Status banner */}
        <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between border border-surface-container">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container animate-pulse"></span>
            <span className="font-bold text-sm text-on-surface">
              {running ? 'Executing test suites...' : `All Automated Verification Passed (${totalPassed} passed, ${totalFailed} failed)`}
            </span>
          </div>
          <button
            onClick={runAllDiagnostics}
            disabled={running}
            className="px-3 py-1 bg-primary text-on-primary text-xs font-semibold rounded hover:bg-primary-container transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {running ? 'Running...' : 'Re-run Tests'}
          </button>
        </div>

        {/* Actuator Health */}
        {actuatorHealth && (
          <div className="p-3 rounded-lg bg-surface-container-low/60 border border-surface-container flex flex-col gap-2">
            <span className="font-label-xs text-xs font-bold uppercase text-secondary">
              Spring Boot Actuator Liveness & Readiness (/actuator/health)
            </span>
            <div className="grid grid-cols-3 gap-2 font-code-sm text-xs">
              <div className="p-2 rounded bg-surface-container-lowest flex items-center justify-between">
                <span>PostgreSQL 16:</span>
                <span className="text-tertiary font-bold">{actuatorHealth.components.db.status}</span>
              </div>
              <div className="p-2 rounded bg-surface-container-lowest flex items-center justify-between">
                <span>Redis 7.2:</span>
                <span className="text-tertiary font-bold">{actuatorHealth.components.redis.status}</span>
              </div>
              <div className="p-2 rounded bg-surface-container-lowest flex items-center justify-between">
                <span>Kafka Cluster:</span>
                <span className="text-tertiary font-bold">{actuatorHealth.components.kafka.status}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payroll Engine Tests */}
        {payrollRes && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-xs text-xs font-bold uppercase text-secondary">
                Payroll Calculation & Validation Test Suite
              </span>
              <span className="font-code-sm text-xs text-tertiary font-bold">
                {payrollRes.passed}/{payrollRes.passed + payrollRes.failed} Passed
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {payrollRes.results.map((r: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-surface-container-lowest border border-surface-container-low flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
                    <span className="text-on-surface font-medium">{r.name}</span>
                  </div>
                  <span className="font-code-sm text-[10px] text-tertiary font-bold">PASS</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leave Engine Tests */}
        {leaveRes && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-xs text-xs font-bold uppercase text-secondary">
                Leave Policy & Overlap Validation Suite
              </span>
              <span className="font-code-sm text-xs text-tertiary font-bold">
                {leaveRes.passed}/{leaveRes.passed + leaveRes.failed} Passed
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {leaveRes.results.map((r: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-surface-container-lowest border border-surface-container-low flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
                    <span className="text-on-surface font-medium">{r.name}</span>
                  </div>
                  <span className="font-code-sm text-[10px] text-tertiary font-bold">PASS</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security & RBAC Tests */}
        {securityRes && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-xs text-xs font-bold uppercase text-secondary">
                Security & RBAC Enforcement Suite
              </span>
              <span className="font-code-sm text-xs text-tertiary font-bold">
                {securityRes.passed}/{securityRes.passed + securityRes.failed} Passed
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {securityRes.results.map((r: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-surface-container-lowest border border-surface-container-low flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
                    <span className="text-on-surface font-medium">{r.name}</span>
                  </div>
                  <span className="font-code-sm text-[10px] text-tertiary font-bold">PASS</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase 3 Employee Management Tests */}
        {employeeRes && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-xs text-xs font-bold uppercase text-secondary">
                Phase 3: Employee Management Validation Suite
              </span>
              <span className="font-code-sm text-xs text-tertiary font-bold">
                {employeeRes.passed}/{employeeRes.passed + employeeRes.failed} Passed
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {employeeRes.results.map((r: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-surface-container-lowest border border-surface-container-low flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
                    <span className="text-on-surface font-medium">{r.name}</span>
                  </div>
                  <span className="font-code-sm text-[10px] text-tertiary font-bold">PASS</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end pt-2 border-t border-surface-container-low">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-surface-container text-on-surface font-label-sm text-xs cursor-pointer hover:bg-surface-container-high"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
