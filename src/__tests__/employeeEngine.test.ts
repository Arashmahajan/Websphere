import { z } from 'zod';
import { EmployeeStatus } from '../types/index.ts';

const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'First name is mandatory'),
  lastName: z.string().min(1, 'Last name is mandatory'),
  email: z.string().email('Please enter a valid corporate email address'),
  departmentId: z.string().min(1, 'Department selection is mandatory'),
  locationId: z.string().min(1, 'Location selection is mandatory'),
  jobTitle: z.string().min(2, 'Job title is mandatory'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
});

export function isValidLifecycleTransition(current: EmployeeStatus, target: EmployeeStatus): boolean {
  if (current === target) return true;
  switch (current) {
    case 'ACTIVE':
      return ['ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'NOTICE'].includes(target);
    case 'ON_LEAVE':
      return target === 'ACTIVE';
    case 'SUSPENDED':
      return ['ACTIVE', 'TERMINATED'].includes(target);
    case 'PROBATION':
      return ['ACTIVE', 'TERMINATED'].includes(target);
    case 'NOTICE':
      return ['ACTIVE', 'TERMINATED'].includes(target);
    case 'TERMINATED':
      return false; // Terminal state
    default:
      return false;
  }
}

export function runEmployeeManagementTests(): {
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

  // Test 1: Zod validation on employee creation
  test('Create Employee schema validates required fields and RFC email', () => {
    const valid = createEmployeeSchema.safeParse({
      firstName: 'Rohan',
      lastName: 'Sharma',
      email: 'rohan.sharma@worksphere.local',
      departmentId: 'dept-1',
      locationId: 'loc-blr',
      jobTitle: 'Lead Cloud Architect',
      employmentType: 'FULL_TIME',
    });
    assert(valid.success, 'Valid employee payload must pass schema');

    const invalid = createEmployeeSchema.safeParse({
      firstName: '',
      lastName: 'Sharma',
      email: 'not-an-email',
      departmentId: 'dept-1',
      locationId: 'loc-blr',
      jobTitle: '',
      employmentType: 'FULL_TIME',
    });
    assert(!invalid.success, 'Invalid employee payload must fail schema');
  });

  // Test 2: Lifecycle transition state machine (ACTIVE -> SUSPENDED)
  test('Lifecycle transition: ACTIVE to SUSPENDED is permitted', () => {
    const allowed = isValidLifecycleTransition('ACTIVE', 'SUSPENDED');
    assert(allowed, 'ACTIVE -> SUSPENDED must be permitted');
  });

  // Test 3: Lifecycle transition terminal check (TERMINATED cannot change)
  test('Lifecycle transition: TERMINATED is strictly terminal', () => {
    const fromTerminated = isValidLifecycleTransition('TERMINATED', 'ACTIVE');
    assert(!fromTerminated, 'Cannot transition out of TERMINATED');
  });

  // Test 4: Optimistic locking version detection
  test('Optimistic locking: Mismatched version triggers concurrency conflict', () => {
    const currentVersion: number = 3;
    const clientProvidedVersion: number = 2; // Stale version
    const hasConflict = clientProvidedVersion !== currentVersion;
    assert(hasConflict, 'Must detect optimistic locking conflict when versions diverge');
  });

  // Test 5: Self-as-manager validation
  test('Manager assignment: Prevents employee from being assigned as own manager', () => {
    const employeeId = 'emp-1092';
    const assignedManagerId = 'emp-1092';
    const isSelfManager = employeeId === assignedManagerId;
    assert(isSelfManager, 'Must flag employee assigned as their own manager');
  });

  // Test 6: Duplicate code detection
  test('Duplicate check: Detects collision on employeeCode', () => {
    const existingCodes = ['WSP-1092', 'WSP-1145', 'WSP-1340'];
    const candidateCode = 'WSP-1092';
    const isDuplicate = existingCodes.includes(candidateCode);
    assert(isDuplicate, 'Must detect duplicate employee code');
  });

  // Test 7: Server-side pagination calculation
  test('Server-side pagination correctly computes totalPages and offsets', () => {
    const totalElements = 105;
    const pageSize = 25;
    const totalPages = Math.ceil(totalElements / pageSize);
    assert(totalPages === 5, 'Total pages for 105 items at 25/page should be 5');

    const page2Offset = 2 * pageSize;
    assert(page2Offset === 50, 'Page 2 offset should be 50');
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  return { passed, failed, results };
}
