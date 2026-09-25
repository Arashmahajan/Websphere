export type Role = 'EMPLOYEE' | 'MANAGER' | 'PAYROLL_ADMIN' | 'HR_ADMIN' | 'SYSTEM_ADMIN';

export type Permission =
  | 'EMPLOYEE_READ'
  | 'EMPLOYEE_WRITE'
  | 'EMPLOYEE_STATUS_CHANGE'
  | 'EMPLOYEE_DELETE'
  | 'ATTENDANCE_READ'
  | 'ATTENDANCE_PUNCH'
  | 'ATTENDANCE_REGULARIZE'
  | 'ATTENDANCE_APPROVE'
  | 'LEAVE_READ'
  | 'LEAVE_APPLY'
  | 'LEAVE_APPROVE'
  | 'LEAVE_REJECT'
  | 'PAYROLL_READ'
  | 'PAYROLL_PROCESS'
  | 'PAYROLL_APPROVE'
  | 'PAYROLL_EXCEPTION_RESOLVE'
  | 'REPORT_READ'
  | 'REPORT_EXPORT'
  | 'AUDIT_READ'
  | 'USER_MANAGE';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  permissions: Permission[];
  title: string;
  department: string;
  avatarUrl: string;
  employeeId: string;
}

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'PROBATION' | 'NOTICE' | 'SUSPENDED' | 'TERMINATED';

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  dateOfJoining: string;
  departmentId: string;
  departmentName: string;
  managerId: string;
  managerName: string;
  jobTitle: string;
  level: string;
  employmentType: EmploymentType;
  locationId: string;
  locationName: string;
  status: EmployeeStatus;
  avatarUrl: string;
  bankAccountReference: string;
  ifscCode: string;
  panNumber: string;
  uanNumber: string;
  ctcAnnual: number;
  baseMonthly: number;
  version?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  headEmployeeId?: string;
  headcountTarget?: number;
}

export interface Location {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  country: string;
  address?: string;
}

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'ON_LEAVE'
  | 'HOLIDAY'
  | 'MISSING_PUNCH';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  avatarUrl?: string;
  attendanceDate: string;
  shiftName: string;
  firstIn: string;
  lastOut: string;
  durationFormatted: string;
  status: AttendanceStatus;
  statusNote?: string;
  overtimeMinutes: number;
  source: 'BIOMETRIC_GATE' | 'MOBILE_GEO' | 'WEB_PORTAL' | 'MANUAL';
  createdAt: string;
  updatedAt: string;
}

export interface RegularizationRequest {
  id: string;
  requestId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  incidentDate: string;
  category: string;
  proposedTime: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  shiftSchedule: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type LeaveType = 'ANNUAL' | 'SICK' | 'CASUAL' | 'UNPAID' | 'MATERNITY' | 'PATERNITY';
export type LeaveStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  status: LeaveStatus;
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface LeaveBalance {
  leaveType: LeaveType;
  allocated: number;
  used: number;
  pending: number;
  available: number;
}

export type ApprovalType = 'LEAVE' | 'EXPENSE' | 'REGULARIZATION' | 'PAYROLL';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | 'CANCELLED';

export interface ApprovalStep {
  stepOrder: number;
  approverRole: string;
  approverName: string;
  action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'PENDING';
  comments?: string;
  timestamp?: string;
}

export interface ApprovalItem {
  id: string;
  type: ApprovalType;
  title: string;
  requesterName: string;
  requesterRole: string;
  requesterAvatar: string;
  amountFormatted?: string;
  daysFormatted?: string;
  slaRiskText?: string;
  slaDueMinutes: number;
  status: ApprovalStatus;
  description: string;
  steps: ApprovalStep[];
  createdAt: string;
}

export type PayrollRunStatus =
  | 'DRAFT'
  | 'VALIDATING'
  | 'CALCULATING'
  | 'REVIEW'
  | 'APPROVAL'
  | 'APPROVED'
  | 'PROCESSED'
  | 'FAILED';

export interface PayrollRun {
  id: string;
  runCode: string;
  periodStart: string;
  periodEnd: string;
  status: PayrollRunStatus;
  step: number; // 1 to 6
  employeeCount: number;
  grossAmount: number;
  deductionAmount: number;
  netAmount: number;
  exceptionsTotal: number;
  criticalExceptions: number;
  warningExceptions: number;
  createdAt: string;
  processedAt?: string;
  targetDisbursementDate: string;
  batchId: string;
  bankingGatewayStatus: string;
}

export type ExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ExceptionType =
  | 'NEGATIVE_NET_PAY'
  | 'MISSING_BANK_IFSC'
  | 'TAX_ANOMALY'
  | 'UNRECORDED_PUNCHES'
  | 'SALARY_MISMATCH';

export interface PayrollException {
  id: string;
  payrollRunId: string;
  severity: ExceptionSeverity;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeeAvatar?: string;
  designation: string;
  department: string;
  location: string;
  exceptionType: ExceptionType;
  exceptionTypeLabel: string;
  description: string;
  netImpact: number;
  assignedDesk: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'IGNORED';
  suggestedAction: string;
}

export interface Payslip {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  jobTitle: string;
  department: string;
  location: string;
  dateOfJoining: string;
  bankAccountRef: string;
  bankName: string;
  ifscCode: string;
  panNumber: string;
  uanNumber: string;
  payPeriod: string;
  disbursementDate: string;
  workedDays: number;
  lopDays: number;
  earnings: {
    baseSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    specialAllowance: number;
    overtime: number;
    performanceBonus: number;
    grossEarnings: number;
  };
  deductions: {
    providentFund: number;
    employeeStateInsurance: number;
    professionalTax: number;
    incomeTaxTds: number;
    voluntaryDeduction: number;
    totalDeductions: number;
  };
  netPayable: number;
  netPayableWords: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  timeAgo: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  source: string;
  result: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'PAYROLL_EXCEPTION' | 'PAYROLL_COMPLETED' | 'APPROVAL_PENDING' | 'ATTENDANCE_ALERT' | 'SYSTEM';
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  read: boolean;
  createdAt: string;
}

export interface DashboardMetrics {
  totalWorkforce: number;
  workforceDelta: number;
  retentionRate: string;
  presentToday: number;
  presentRate: string;
  lateOrHalfCount: number;
  leaveCount: number;
  pendingApprovalsCount: number;
  slaRiskCount: number;
  payrollGross: string;
  payrollNet: string;
  cycleLockInDays: number;
  exceptionsCount: number;
  criticalExceptionsCount: number;
  shiftEfficiency: string;
  shiftEfficiencyDelta: string;
}
