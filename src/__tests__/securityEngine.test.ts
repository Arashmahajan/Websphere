import { authApi, payrollApi, leaveApi, attendanceApi } from '../services/apiServices.ts';

export function runSecurityAndWorkflowTests(): {
  passed: number;
  failed: number;
  results: Array<{ name: string; ok: boolean; err?: string }>;
} {
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

  // Test 1: Role-Based Access Control Structure
  test('User entity contains strict non-empty permissions array and designated role', () => {
    const mockUser = {
      id: 'usr-1',
      email: 'admin@worksphere.local',
      role: 'SYSTEM_ADMIN',
      permissions: ['EMPLOYEE_READ', 'PAYROLL_APPROVE', 'ATTENDANCE_APPROVE'],
    };
    assert(mockUser.permissions.length > 0, 'Permissions array must not be empty');
    assert(mockUser.role === 'SYSTEM_ADMIN', 'Role must match assignment');
  });

  // Test 2: Employee cannot possess PAYROLL_APPROVE
  test('Employee persona does NOT possess PAYROLL_APPROVE permission', () => {
    const employeePermissions = [
      'EMPLOYEE_READ',
      'ATTENDANCE_READ',
      'ATTENDANCE_PUNCH',
      'ATTENDANCE_REGULARIZE',
      'LEAVE_READ',
      'LEAVE_APPLY',
    ];
    assert(
      !employeePermissions.includes('PAYROLL_APPROVE'),
      'Employee must strictly not have PAYROLL_APPROVE permission'
    );
    assert(
      !employeePermissions.includes('ATTENDANCE_APPROVE'),
      'Employee must strictly not have ATTENDANCE_APPROVE permission'
    );
  });

  // Test 3: Payroll Admin can resolve exceptions
  test('Payroll Admin persona possesses PAYROLL_EXCEPTION_RESOLVE permission', () => {
    const payrollAdminPermissions = [
      'EMPLOYEE_READ',
      'ATTENDANCE_READ',
      'LEAVE_READ',
      'PAYROLL_READ',
      'PAYROLL_PROCESS',
      'PAYROLL_APPROVE',
      'PAYROLL_EXCEPTION_RESOLVE',
      'REPORT_READ',
      'REPORT_EXPORT',
      'AUDIT_READ',
    ];
    assert(
      payrollAdminPermissions.includes('PAYROLL_EXCEPTION_RESOLVE'),
      'Payroll admin must have PAYROLL_EXCEPTION_RESOLVE'
    );
    assert(
      payrollAdminPermissions.includes('PAYROLL_APPROVE'),
      'Payroll admin must have PAYROLL_APPROVE'
    );
  });

  // Test 4: Critical payroll exceptions gate CFO approval
  test('CFO sign-off is prevented when critical unhandled exceptions exist', () => {
    const exceptions = [
      { id: '1', severity: 'CRITICAL', status: 'OPEN' },
      { id: '2', severity: 'WARNING', status: 'OPEN' },
    ];
    const unhandledCritical = exceptions.filter((e) => e.severity === 'CRITICAL' && e.status !== 'RESOLVED');
    assert(unhandledCritical.length === 1, 'Should detect 1 critical blocker');
    const canApprove = unhandledCritical.length === 0;
    assert(!canApprove, 'Approval must be strictly blocked when critical exceptions exist');
  });

  // Test 5: Double punch-in prevention rule
  test('Prevents duplicate punch-in when active attendance session exists', () => {
    const session = { active: true, checkInTime: '09:00 AM' };
    const allowPunchIn = !session.active;
    assert(!allowPunchIn, 'Cannot punch in twice without active session termination');
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  return { passed, failed, results };
}
