import React, { useState, useEffect } from 'react';
import { Payslip, Employee } from '../../types/index.ts';
import { payrollApi } from '../../services/apiServices.ts';

interface PayslipViewProps {
  selectedEmpCode?: string;
  employees: Employee[];
  onBackToPayroll?: () => void;
}

export const PayslipView: React.FC<PayslipViewProps> = ({
  selectedEmpCode = 'WSP-1092',
  employees,
  onBackToPayroll,
}) => {
  const [currentEmpCode, setCurrentEmpCode] = useState(selectedEmpCode);
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    payrollApi
      .getPayslip(currentEmpCode)
      .then((res) => {
        setPayslip(res.payslip);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentEmpCode]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !payslip) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          refresh
        </span>
        <span className="font-label-sm text-sm text-secondary">
          Compiling official compensation ledger statement...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-space-md animate-in fade-in duration-200">
      {/* Top Action Bar (hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-space-sm">
          {onBackToPayroll && (
            <button
              onClick={onBackToPayroll}
              className="p-1 rounded text-secondary hover:bg-surface-container hover:text-on-surface cursor-pointer"
              title="Return to Payroll Hub"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
            </button>
          )}
          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Official Payslip & Compensation Statement
          </span>
        </div>

        <div className="flex items-center gap-space-xs">
          {/* Employee Picker */}
          <div className="relative">
            <select
              value={currentEmpCode}
              onChange={(e) => setCurrentEmpCode(e.target.value)}
              className="h-9 pl-3 pr-8 rounded bg-surface-container-low font-body-xs text-body-xs text-on-surface focus:outline-none cursor-pointer"
            >
              {employees.map((emp) => (
                <option key={emp.employeeCode} value={emp.employeeCode}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-space-xs h-9 px-space-sm bg-primary text-on-primary rounded font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Official Enterprise Document Page */}
      <div className="print-page bg-white p-8 md:p-12 rounded-xl shadow-lg border border-slate-200 max-w-4xl mx-auto flex flex-col gap-6 text-slate-900">
        {/* Header Strip */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div className="flex items-center gap-3">
            <img
              alt="Logo"
              className="h-10 w-10 object-contain"
              src="https://lh3.googleusercontent.com/aida/AEtjO1VWVNolRXX_BAERd5EvRl-5pjKIdaiQCECItQG-gF-tzpVn5Uy48wntoEW-toLaiPEdEGyf9z8KU4SDYXuuHLcvEswfQ8vm08TEqwWZMxfY3ffiqmbsy7f6Ej6puN-ZyLir3ep_tOeRmKXZK5e8XKAr3R9VYRM8F8zE6yVUEPS8XDWQX5iCbQ3KfvX1h6IDUK0vVHhCXwTvE8nwFNMkpGItz80od4iqB2bZfIGSCURqCirPFNznsci3vS8"
            />
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-slate-900">
                Acme Global Enterprise India Private Limited
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Campus 1, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103
              </span>
              <span className="text-xs text-slate-400 font-mono mt-0.5">
                CIN: U72200KA2015PTC081290 · GSTIN: 29AAACA1234F1Z8
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-xs uppercase tracking-wider font-mono">
              CONFIDENTIAL PAYSLIP
            </span>
            <span className="font-bold text-sm text-slate-800 mt-1">{payslip.payPeriod}</span>
            <span className="text-xs text-slate-500">Disbursed on: {payslip.disbursementDate}</span>
          </div>
        </div>

        {/* Personnel & Bank Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-semibold uppercase">Employee Name</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">{payslip.employeeName}</div>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase">Employee ID</span>
            <div className="font-mono font-bold text-blue-700 text-sm mt-0.5">{payslip.employeeCode}</div>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase">Designation</span>
            <div className="font-medium text-slate-900 mt-0.5">{payslip.jobTitle}</div>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase">Department</span>
            <div className="font-medium text-slate-900 mt-0.5">{payslip.department}</div>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase">PAN Number</span>
            <div className="font-mono font-medium text-slate-800 mt-0.5">{payslip.panNumber}</div>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase">UAN Number</span>
            <div className="font-mono font-medium text-slate-800 mt-0.5">{payslip.uanNumber}</div>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase">Bank Details</span>
            <div className="font-mono font-medium text-slate-800 mt-0.5">
              {payslip.bankAccountRef} ({payslip.ifscCode})
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-semibold uppercase">Pay / LOP Days</span>
            <div className="font-medium text-slate-900 mt-0.5">
              {payslip.workedDays} Paid · {payslip.lopDays} LOP
            </div>
          </div>
        </div>

        {/* Two-Column Earnings & Deductions Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings */}
          <div className="flex flex-col border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-700 flex justify-between">
              <span>Earnings Component</span>
              <span>Amount (₹)</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs font-medium">
              <div className="px-4 py-2 flex justify-between">
                <span>Basic Salary</span>
                <span className="font-mono">₹{payslip.earnings.baseSalary.toLocaleString()}</span>
              </div>
              <div className="px-4 py-2 flex justify-between">
                <span>House Rent Allowance (HRA)</span>
                <span className="font-mono">₹{payslip.earnings.housingAllowance.toLocaleString()}</span>
              </div>
              <div className="px-4 py-2 flex justify-between">
                <span>Transport Allowance</span>
                <span className="font-mono">₹{payslip.earnings.transportAllowance.toLocaleString()}</span>
              </div>
              <div className="px-4 py-2 flex justify-between">
                <span>Special Allowance</span>
                <span className="font-mono">₹{payslip.earnings.specialAllowance.toLocaleString()}</span>
              </div>
              <div className="px-4 py-2 flex justify-between">
                <span>Performance & Statutory Bonus</span>
                <span className="font-mono">₹{payslip.earnings.performanceBonus.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 font-bold text-xs flex justify-between text-slate-900 mt-auto">
              <span>Total Gross Earnings (A)</span>
              <span className="font-mono text-sm">₹{payslip.earnings.grossEarnings.toLocaleString()}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="flex flex-col border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-700 flex justify-between">
              <span>Statutory Deductions</span>
              <span>Amount (₹)</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs font-medium">
              <div className="px-4 py-2 flex justify-between">
                <span>Employees' Provident Fund (EPF)</span>
                <span className="font-mono">₹{payslip.deductions.providentFund.toLocaleString()}</span>
              </div>
              <div className="px-4 py-2 flex justify-between">
                <span>Professional Tax (PT)</span>
                <span className="font-mono">₹{payslip.deductions.professionalTax.toLocaleString()}</span>
              </div>
              <div className="px-4 py-2 flex justify-between">
                <span>Income Tax (TDS u/s 192)</span>
                <span className="font-mono">₹{payslip.deductions.incomeTaxTds.toLocaleString()}</span>
              </div>
              <div className="px-4 py-2 flex justify-between">
                <span>Voluntary Insurance / NPS</span>
                <span className="font-mono">₹0</span>
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 font-bold text-xs flex justify-between text-red-700 mt-auto">
              <span>Total Deductions (B)</span>
              <span className="font-mono text-sm">₹{payslip.deductions.totalDeductions.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Net Pay Highlight Ribbon */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Net Disbursable Salary (A - B)
            </span>
            <span className="font-mono font-bold text-2xl text-blue-700 mt-0.5">
              ₹{payslip.netPayable.toLocaleString()}
            </span>
            <span className="text-xs text-slate-600 mt-1 italic font-medium">
              Amount in words: {payslip.netPayableWords}
            </span>
          </div>

          <div className="flex flex-col text-right text-xs text-slate-500 font-mono">
            <span>Direct Credit to Bank Acct</span>
            <span className="text-green-700 font-bold flex items-center justify-end gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Host-to-Host Confirmed
            </span>
          </div>
        </div>

        {/* Corporate Signatures & Disclaimer */}
        <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-xs text-slate-500">
          <div className="flex flex-col gap-1 max-w-sm">
            <span className="font-semibold text-slate-700">Digital Authentication:</span>
            <span>
              This is a computer-generated document authenticated under WorkSphere Enterprise PKI. No physical signature required.
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-10 flex items-center justify-center text-blue-800 font-mono font-bold text-sm">
              [ Digitally Signed by CFO Office ]
            </div>
            <span className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
              Authorized Signatory
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
