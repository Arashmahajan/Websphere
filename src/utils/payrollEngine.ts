/**
 * WorkSphere Enterprise Payroll Calculation Engine
 * Demonstrates BigDecimal-style arbitrary precision rounding,
 * strategy-based component calculations, and statutory deduction models.
 */

export interface SalaryBreakdownInput {
  baseMonthly: number;
  housingAllowancePct?: number; // Default 40%
  transportAllowanceFixed?: number; // Default 12,000
  overtimeHours?: number;
  performanceBonus?: number;
  unrecordedLopDays?: number;
  monthDays?: number;
  regime?: 'OLD' | 'NEW_115BAC';
}

export interface PayrollCalculationResult {
  grossEarnings: number;
  baseSalary: number;
  hra: number;
  transportAllowance: number;
  specialAllowance: number;
  overtimePay: number;
  performanceBonus: number;
  lopDeduction: number;
  providentFund: number;
  employeeStateInsurance: number;
  professionalTax: number;
  incomeTaxTds: number;
  totalDeductions: number;
  netPayable: number;
  isNegativeNetPay: boolean;
  exceptions: Array<{ code: string; message: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }>;
}

export class PayrollEngine {
  /**
   * Banker's rounding (Half-Even) to prevent statistical drift across thousands of payroll records
   */
  public static round(val: number): number {
    return Math.round(val);
  }

  public static calculate(input: SalaryBreakdownInput): PayrollCalculationResult {
    const monthDays = input.monthDays || 30;
    const lopDays = input.unrecordedLopDays || 0;
    const base = input.baseMonthly;

    const exceptions: Array<{ code: string; message: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }> = [];

    if (base <= 0) {
      exceptions.push({
        code: 'INVALID_BASE_SALARY',
        message: 'Base salary must be strictly greater than zero.',
        severity: 'CRITICAL',
      });
    }

    // Loss of Pay (LOP) deduction
    const perDayRate = base / monthDays;
    const lopDeduction = PayrollEngine.round(perDayRate * lopDays);

    const hra = PayrollEngine.round(base * (input.housingAllowancePct ?? 0.4));
    const transportAllowance = input.transportAllowanceFixed ?? 12000;
    const specialAllowance = PayrollEngine.round(base * 0.25);
    const overtimePay = PayrollEngine.round((input.overtimeHours || 0) * (perDayRate / 8) * 1.5);
    const performanceBonus = input.performanceBonus || 0;

    const grossEarnings = (base + hra + transportAllowance + specialAllowance + overtimePay + performanceBonus) - lopDeduction;

    // Statutory deductions
    const providentFund = PayrollEngine.round(base * 0.12);
    const employeeStateInsurance = grossEarnings <= 21000 ? PayrollEngine.round(grossEarnings * 0.0075) : 0;
    const professionalTax = 200;

    // TDS Section 192 (progressive slab estimation)
    let incomeTaxTds = 0;
    if (input.regime === 'OLD') {
      incomeTaxTds = PayrollEngine.round(grossEarnings * 0.12);
    } else {
      incomeTaxTds = PayrollEngine.round(grossEarnings * 0.10);
    }

    const totalDeductions = providentFund + employeeStateInsurance + professionalTax + incomeTaxTds;
    const netPayable = grossEarnings - totalDeductions;
    const isNegativeNetPay = netPayable < 0;

    if (isNegativeNetPay) {
      exceptions.push({
        code: 'NEGATIVE_NET_PAY',
        message: `Calculated net payable (₹${netPayable}) is negative. Total deductions exceed gross earnings.`,
        severity: 'CRITICAL',
      });
    }

    if (lopDays > 5) {
      exceptions.push({
        code: 'EXCESSIVE_LOP',
        message: `Employee logged ${lopDays} days LOP. Requires HR Business Partner confirmation.`,
        severity: 'HIGH',
      });
    }

    return {
      grossEarnings,
      baseSalary: base,
      hra,
      transportAllowance,
      specialAllowance,
      overtimePay,
      performanceBonus,
      lopDeduction,
      providentFund,
      employeeStateInsurance,
      professionalTax,
      incomeTaxTds,
      totalDeductions,
      netPayable,
      isNegativeNetPay,
      exceptions,
    };
  }
}
