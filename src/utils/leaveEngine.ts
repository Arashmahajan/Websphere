/**
 * WorkSphere Enterprise Leave Policy & Validation Engine
 */

export interface LeaveValidationInput {
  leaveType: string;
  startDate: string;
  endDate: string;
  availableBalance: number;
  existingRequests: Array<{ id: string; startDate: string; endDate: string; status: string }>;
}

export interface LeaveValidationResult {
  valid: boolean;
  durationDays: number;
  errorCode?: string;
  errorMessage?: string;
}

export class LeaveEngine {
  public static validate(input: LeaveValidationInput): LeaveValidationResult {
    const { leaveType, startDate, endDate, availableBalance, existingRequests } = input;

    if (!startDate || !endDate) {
      return {
        valid: false,
        durationDays: 0,
        errorCode: 'MISSING_DATE_BOUNDS',
        errorMessage: 'Start date and end date are both required.',
      };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Rule 1: End Date cannot be before Start Date
    if (end < start) {
      return {
        valid: false,
        durationDays: 0,
        errorCode: 'INVALID_DATE_RANGE',
        errorMessage: 'Leave end date cannot be before start date.',
      };
    }

    // Calculate duration in days (inclusive)
    const diffMs = end.getTime() - start.getTime();
    const durationDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

    // Rule 2: Balance check (except for unpaid leave)
    if (leaveType !== 'UNPAID' && durationDays > availableBalance) {
      return {
        valid: false,
        durationDays,
        errorCode: 'INSUFFICIENT_BALANCE',
        errorMessage: `Requested ${durationDays} days exceeds available ${leaveType} balance (${availableBalance} days).`,
      };
    }

    // Rule 3: Detect overlapping active requests
    const overlap = existingRequests.some((req) => {
      if (req.status === 'REJECTED' || req.status === 'CANCELLED') return false;
      const reqStart = new Date(req.startDate);
      const reqEnd = new Date(req.endDate);
      return start <= reqEnd && end >= reqStart;
    });

    if (overlap) {
      return {
        valid: false,
        durationDays,
        errorCode: 'OVERLAPPING_LEAVE',
        errorMessage: 'The selected date range overlaps with an existing leave request.',
      };
    }

    return {
      valid: true,
      durationDays,
    };
  }
}
