import { LeaveEngine } from '../utils/leaveEngine.ts';

export function runLeaveTests(): { passed: number; failed: number; results: Array<{ name: string; ok: boolean; err?: string }> } {
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

  // Test 1: Valid leave request
  test('Validates normal leave request within quota', () => {
    const res = LeaveEngine.validate({
      leaveType: 'ANNUAL',
      startDate: '2026-10-01',
      endDate: '2026-10-05',
      availableBalance: 12,
      existingRequests: [],
    });
    assert(res.valid === true, 'Leave should be valid');
    assert(res.durationDays === 5, 'Duration should be 5 days');
  });

  // Test 2: End date before start date
  test('Rejects request where end date is before start date', () => {
    const res = LeaveEngine.validate({
      leaveType: 'SICK',
      startDate: '2026-10-10',
      endDate: '2026-10-08',
      availableBalance: 10,
      existingRequests: [],
    });
    assert(!res.valid, 'Must be rejected');
    assert(res.errorCode === 'INVALID_DATE_RANGE', 'Should have INVALID_DATE_RANGE error code');
  });

  // Test 3: Insufficient balance
  test('Rejects leave request exceeding available balance', () => {
    const res = LeaveEngine.validate({
      leaveType: 'CASUAL',
      startDate: '2026-10-01',
      endDate: '2026-10-10', // 10 days
      availableBalance: 4, // only 4 available
      existingRequests: [],
    });
    assert(!res.valid, 'Must be rejected');
    assert(res.errorCode === 'INSUFFICIENT_BALANCE', 'Should have INSUFFICIENT_BALANCE error code');
  });

  // Test 4: Overlapping leave request
  test('Rejects overlapping leave request with existing active request', () => {
    const res = LeaveEngine.validate({
      leaveType: 'ANNUAL',
      startDate: '2026-10-12',
      endDate: '2026-10-16',
      availableBalance: 15,
      existingRequests: [
        { id: '1', startDate: '2026-10-14', endDate: '2026-10-20', status: 'APPROVED' },
      ],
    });
    assert(!res.valid, 'Must be rejected due to overlap');
    assert(res.errorCode === 'OVERLAPPING_LEAVE', 'Should flag OVERLAPPING_LEAVE');
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  return { passed, failed, results };
}
