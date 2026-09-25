import { PayrollEngine } from '../utils/payrollEngine.ts';

// Self-contained test suite runner
export function runPayrollTests(): { passed: number; failed: number; results: Array<{ name: string; ok: boolean; err?: string }> } {
  const results: Array<{ name: string; ok: boolean; err?: string }> = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      results.push({ name, ok: true });
    } catch (e: any) {
      results.push({ name, ok: false, err: e.message || String(e) });
    }
  }

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: Standard payroll calculation
  test('Standard monthly calculation with valid earnings and statutory deductions', () => {
    const res = PayrollEngine.calculate({
      baseMonthly: 100000,
      housingAllowancePct: 0.4,
      transportAllowanceFixed: 12000,
      regime: 'OLD',
    });

    assert(res.baseSalary === 100000, 'Base salary must match input');
    assert(res.hra === 40000, 'HRA should be 40% of base (40,000)');
    assert(res.transportAllowance === 12000, 'Transport allowance should be 12,000');
    assert(res.specialAllowance === 25000, 'Special allowance should be 25% of base (25,000)');
    assert(res.grossEarnings === 177000, 'Gross should be 177,000');
    assert(res.providentFund === 12000, 'PF should be 12% of base (12,000)');
    assert(res.netPayable > 0, 'Net payable must be positive');
    assert(!res.isNegativeNetPay, 'Must not be flagged negative');
    assert(res.exceptions.length === 0, 'No exceptions should be raised for regular run');
  });

  // Test 2: Negative Net Pay detection
  test('Detects negative net pay when deductions exceed gross', () => {
    const res = PayrollEngine.calculate({
      baseMonthly: 30000,
      unrecordedLopDays: 28, // Almost whole month unpaid
      housingAllowancePct: 0.4,
      transportAllowanceFixed: 0,
    });

    assert(res.isNegativeNetPay || res.netPayable <= 0, 'Must flag negative or zero net pay');
    assert(res.exceptions.some((e) => e.code === 'NEGATIVE_NET_PAY'), 'Must emit NEGATIVE_NET_PAY exception');
  });

  // Test 3: Zero or negative base salary rejection
  test('Flags critical exception for invalid base salary', () => {
    const res = PayrollEngine.calculate({
      baseMonthly: 0,
    });
    assert(res.exceptions.some((e) => e.code === 'INVALID_BASE_SALARY'), 'Must emit INVALID_BASE_SALARY exception');
  });

  // Test 4: Overtime calculation accuracy
  test('Computes 1.5x overtime multiplier correctly', () => {
    const res = PayrollEngine.calculate({
      baseMonthly: 120000, // per day: 4,000; per hour: 500
      overtimeHours: 10, // 10 * 500 * 1.5 = 7,500
    });
    assert(res.overtimePay === 7500, `Expected overtime 7500, got ${res.overtimePay}`);
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  return { passed, failed, results };
}
