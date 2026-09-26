import React, { useState, useEffect } from 'react';
import { payrollApi } from '../../services/apiServices.ts';

interface AIPayrollAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIPayrollAssistantModal: React.FC<AIPayrollAssistantModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      payrollApi
        .getAiAdvice('Analyze current payroll cycle health')
        .then((res: any) => {
          setData(res.result || res.response);
        })
        .catch((err: any) => {
          setError(err?.message || 'AI service temporarily unavailable.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl shadow-2xl p-space-base flex flex-col gap-space-md border border-surface-container-high max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">psychology</span>
            <div>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Payroll Exception Advisory Assistant
              </span>
              <span className="ml-2 px-1.5 py-0.5 rounded font-code-sm text-[10px] bg-secondary-container text-on-secondary-container uppercase font-bold">
                Gemini 3.8 Flash Advisory Engine
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

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-3xl text-primary animate-spin">
              autorenew
            </span>
            <span className="font-label-sm text-sm text-secondary">
              Analyzing 23 payroll anomalies and calculating statutory clearing exposure...
            </span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-error-container text-on-error-container text-xs font-semibold">
            {error}
          </div>
        ) : data ? (
          <div className="flex flex-col gap-space-md text-on-surface">
            {/* Metric pill row */}
            <div className="grid grid-cols-3 gap-space-xs bg-surface-container-low p-space-sm rounded-lg">
              <div className="flex flex-col">
                <span className="font-label-xs text-label-xs uppercase font-semibold text-secondary">
                  Cycle Exceptions
                </span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface mt-0.5">
                  {data.totalExceptions} Items
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-xs text-label-xs uppercase font-semibold text-secondary">
                  Blocking Criticals
                </span>
                <span className="font-headline-sm text-headline-sm font-bold text-error mt-0.5">
                  {data.criticalBlockersCount} Blockers
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-xs text-label-xs uppercase font-semibold text-secondary">
                  At-Risk Disbursal
                </span>
                <span className="font-headline-sm text-headline-sm font-bold text-primary mt-0.5">
                  {data.financialRiskVolume}
                </span>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="p-space-sm rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1">
              <span className="font-label-xs text-label-xs uppercase font-bold text-secondary">
                Executive Synthesis
              </span>
              <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">{data.summary}</p>
            </div>

            {/* Root Causes */}
            <div className="flex flex-col gap-1.5">
              <span className="font-label-xs text-label-xs uppercase font-bold text-secondary">
                Identified Root Causes
              </span>
              <ul className="list-disc list-inside space-y-1 font-body-xs text-body-xs text-secondary bg-surface-container-lowest p-2 rounded border border-surface-container-low">
                {data.rootCauses?.map((cause: string, i: number) => (
                  <li key={i} className="text-on-surface">
                    {cause}
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested Review Order */}
            <div className="flex flex-col gap-2">
              <span className="font-label-xs text-label-xs uppercase font-bold text-secondary">
                Recommended Remediation Sequence (Order of Operations)
              </span>
              <div className="flex flex-col gap-2">
                {data.suggestedReviewOrder?.map((stepItem: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-space-sm rounded-lg bg-surface-container-low/70 border border-surface-container flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary text-on-primary font-code-sm text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {stepItem.step || idx + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                        {stepItem.action}
                      </span>
                      <span className="font-body-xs text-body-xs text-secondary mt-0.5">
                        {stepItem.rational}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance Note */}
            {data.complianceSummary && (
              <div className="p-2.5 rounded bg-tertiary-fixed/30 text-on-surface flex items-center gap-2 font-body-xs text-xs">
                <span className="material-symbols-outlined text-sm text-tertiary">verified</span>
                <span>{data.complianceSummary}</span>
              </div>
            )}

            {/* Advisory Safety Disclaimer (Section 40) */}
            <div className="p-2 rounded bg-surface-container font-code-sm text-[11px] text-secondary text-center">
              🛡️ {data.advisoryDisclaimer}
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-end pt-space-xs border-t border-surface-container-low">
          <button
            onClick={onClose}
            type="button"
            className="px-space-base h-9 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors cursor-pointer"
          >
            Acknowledge & Proceed to Resolver
          </button>
        </div>
      </div>
    </div>
  );
};
