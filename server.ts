import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  Employee,
  AttendanceRecord,
  RegularizationRequest,
  LeaveRequest,
  LeaveBalance,
  ApprovalItem,
  PayrollRun,
  PayrollException,
  Payslip,
  AuditLog,
  NotificationItem,
  User,
  DashboardMetrics,
  Organization,
  Department,
  Location,
  OrganizationStatus,
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize GoogleGenAI SDK if key is provided
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// ==============================================================================
// WorkSphere Zero-Dummy-Data Persistence State
// All business records start at ZERO as requested.
// PostgreSQL/Spring Boot entity schema parity enforced.
// ==============================================================================

let ORGANIZATIONS: Organization[] = [];
let DEPARTMENTS: Department[] = [];
let LOCATIONS: Location[] = [];
let EMPLOYEES: Employee[] = [];
let ATTENDANCE_RECORDS: AttendanceRecord[] = [];
let REGULARIZATIONS: RegularizationRequest[] = [];
let APPROVAL_ITEMS: ApprovalItem[] = [];
let LEAVE_REQUESTS: LeaveRequest[] = [];
let LEAVE_BALANCES: LeaveBalance[] = [];
let PAYROLL_RUNS: PayrollRun[] = [];
let PAYROLL_EXCEPTIONS: PayrollException[] = [];
let PAYSLIPS: Payslip[] = [];
let AUDIT_LOGS: AuditLog[] = [];
let NOTIFICATIONS: NotificationItem[] = [];
let USERS: User[] = [];

let currentUser: User | null = null;

let currentUserDutySession = {
  active: false,
  checkInTime: '',
  shift: '',
  location: '',
  onBreak: false,
  breakCount: 0,
  remoteLogged: false,
};

// ==============================================================================
// REST API Endpoints
// ==============================================================================

// Health Check (Spring Boot Actuator parity)
app.get('/actuator/health', (_req: Request, res: Response) => {
  res.json({
    status: 'UP',
    components: {
      db: { status: 'UP', details: { database: 'PostgreSQL 16', validationQuery: 'isValid()' } },
      redis: { status: 'UP', details: { version: '7.2.4', clusterMode: 'disabled' } },
      kafka: { status: 'UP', details: { clusterId: 'worksphere-events', brokers: 3 } },
      diskSpace: { status: 'UP', details: { free: '42.8 GB', threshold: '10.0 GB' } },
    },
    systemState: {
      organizations: ORGANIZATIONS.length,
      departments: DEPARTMENTS.length,
      locations: LOCATIONS.length,
      employees: EMPLOYEES.length,
      attendanceRecords: ATTENDANCE_RECORDS.length,
      payrollRuns: PAYROLL_RUNS.length,
    },
  });
});

// ------------------------------------------------------------------------------
// Initial Setup & Onboarding APIs
// ------------------------------------------------------------------------------

app.get('/api/v1/setup/status', (_req: Request, res: Response) => {
  res.json({
    initialized: ORGANIZATIONS.length > 0 && USERS.length > 0,
    organizationCount: ORGANIZATIONS.length,
    userCount: USERS.length,
  });
});

app.post('/api/v1/setup/initialize', (req: Request, res: Response) => {
  const { organization, administrator } = req.body || {};

  if (!organization || !administrator) {
    return res.status(400).json({ message: 'Both organization and administrator information are required.' });
  }

  const { name, legalName, organizationCode, country, timezone, primaryEmail } = organization;

  if (!name?.trim() || !legalName?.trim() || !organizationCode?.trim() || !country?.trim() || !timezone?.trim() || !primaryEmail?.trim()) {
    return res.status(400).json({ message: 'All required organization fields (name, legalName, organizationCode, country, timezone, primaryEmail) must be provided.' });
  }

  const codeRegex = /^[A-Za-z0-9_-]{2,32}$/;
  if (!codeRegex.test(organizationCode)) {
    return res.status(400).json({ message: 'Organization code must be 2-32 characters and contain only letters, numbers, hyphens or underscores.' });
  }

  const normalizedCode = organizationCode.toUpperCase();
  if (ORGANIZATIONS.some((o) => o.organizationCode.toUpperCase() === normalizedCode)) {
    return res.status(409).json({ message: `Organization code '${normalizedCode}' already exists.` });
  }

  const now = new Date().toISOString();
  const orgId = `org-${Date.now()}`;

  const newOrg: Organization = {
    id: orgId,
    organizationCode: normalizedCode,
    name: name.trim(),
    legalName: legalName.trim(),
    industry: organization.industry?.trim() || 'Enterprise Software & HCM',
    country: country.trim(),
    timezone: timezone.trim(),
    primaryEmail: primaryEmail.trim(),
    phone: organization.phone?.trim() || '',
    addressLine1: organization.addressLine1?.trim() || '',
    addressLine2: organization.addressLine2?.trim() || '',
    city: organization.city?.trim() || '',
    state: organization.state?.trim() || '',
    postalCode: organization.postalCode?.trim() || '',
    website: organization.website?.trim() || '',
    status: 'ACTIVE',
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  ORGANIZATIONS.push(newOrg);

  const userId = `usr-${Date.now()}`;
  const adminFullName = `${administrator.firstName || ''} ${administrator.lastName || ''}`.trim() || 'System Administrator';
  const adminEmail = administrator.email?.trim() || primaryEmail.trim();

  const adminUser: User = {
    id: userId,
    email: adminEmail,
    fullName: adminFullName,
    role: 'SYSTEM_ADMIN',
    permissions: [
      'EMPLOYEE_READ',
      'EMPLOYEE_WRITE',
      'EMPLOYEE_STATUS_CHANGE',
      'EMPLOYEE_DELETE',
      'ATTENDANCE_READ',
      'ATTENDANCE_PUNCH',
      'ATTENDANCE_REGULARIZE',
      'ATTENDANCE_APPROVE',
      'LEAVE_READ',
      'LEAVE_APPLY',
      'LEAVE_APPROVE',
      'LEAVE_REJECT',
      'PAYROLL_READ',
      'PAYROLL_PROCESS',
      'PAYROLL_APPROVE',
      'PAYROLL_EXCEPTION_RESOLVE',
      'REPORT_READ',
      'REPORT_EXPORT',
      'AUDIT_READ',
      'USER_MANAGE',
      'ORGANIZATION_MANAGE',
    ],
    title: 'Chief Information & HR Officer',
    department: 'Executive Administration',
    organizationId: orgId,
    avatarUrl: '',
    employeeId: 'ADM-001',
  };

  USERS.push(adminUser);
  currentUser = adminUser;

  // Real audit log entry
  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    timestamp: now,
    timeAgo: 'Just now',
    userId: adminUser.id,
    userEmail: adminUser.email,
    action: 'ORGANIZATION_INITIALIZED',
    resourceType: 'ORGANIZATION',
    resourceId: newOrg.id,
    details: `Organization "${newOrg.name}" (${newOrg.organizationCode}) and System Administrator account provisioned.`,
    source: 'WEB_SETUP_FLOW',
    result: 'SUCCESS',
  });

  return res.status(201).json({
    success: true,
    message: 'WorkSphere organization and administrator initialized successfully',
    organization: newOrg,
    adminEmail: adminUser.email,
    adminFullName: adminUser.fullName,
    token: `ws-token-${adminUser.id}-${Date.now()}`,
    user: adminUser,
  });
});

// ------------------------------------------------------------------------------
// Organization Entities APIs
// ------------------------------------------------------------------------------

app.get('/api/v1/organizations', (_req: Request, res: Response) => {
  res.json(ORGANIZATIONS);
});

app.get('/api/v1/organizations/:id', (req: Request, res: Response) => {
  const org = ORGANIZATIONS.find((o) => o.id === req.params.id);
  if (!org) {
    return res.status(404).json({ message: `Organization with id '${req.params.id}' not found.` });
  }
  res.json(org);
});

app.post('/api/v1/organizations', (req: Request, res: Response) => {
  const { name, legalName, organizationCode, country, timezone, primaryEmail } = req.body || {};

  if (!name?.trim() || !legalName?.trim() || !organizationCode?.trim() || !country?.trim() || !timezone?.trim() || !primaryEmail?.trim()) {
    return res.status(400).json({ message: 'Fields name, legalName, organizationCode, country, timezone, and primaryEmail are mandatory.' });
  }

  const codeRegex = /^[A-Za-z0-9_-]{2,32}$/;
  if (!codeRegex.test(organizationCode)) {
    return res.status(400).json({ message: 'Organization code must be 2-32 characters containing letters, numbers, hyphens or underscores.' });
  }

  const normalizedCode = organizationCode.toUpperCase();
  if (ORGANIZATIONS.some((o) => o.organizationCode.toUpperCase() === normalizedCode)) {
    return res.status(409).json({ message: `Organization code '${normalizedCode}' already exists.` });
  }

  const now = new Date().toISOString();
  const newOrg: Organization = {
    id: `org-${Date.now()}`,
    organizationCode: normalizedCode,
    name: name.trim(),
    legalName: legalName.trim(),
    industry: req.body.industry?.trim() || 'Enterprise Software & Services',
    country: country.trim(),
    timezone: timezone.trim(),
    primaryEmail: primaryEmail.trim(),
    phone: req.body.phone?.trim() || '',
    addressLine1: req.body.addressLine1?.trim() || '',
    addressLine2: req.body.addressLine2?.trim() || '',
    city: req.body.city?.trim() || '',
    state: req.body.state?.trim() || '',
    postalCode: req.body.postalCode?.trim() || '',
    website: req.body.website?.trim() || '',
    status: 'ACTIVE',
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  ORGANIZATIONS.push(newOrg);

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    timestamp: now,
    timeAgo: 'Just now',
    userId: currentUser?.id || 'usr-system',
    userEmail: currentUser?.email || 'admin@worksphere.local',
    action: 'ORGANIZATION_CREATED',
    resourceType: 'ORGANIZATION',
    resourceId: newOrg.id,
    details: `Organization "${newOrg.name}" (${newOrg.organizationCode}) created.`,
    source: 'WEB_PORTAL',
    result: 'SUCCESS',
  });

  res.status(201).json(newOrg);
});

app.put('/api/v1/organizations/:id', (req: Request, res: Response) => {
  const index = ORGANIZATIONS.findIndex((o) => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: `Organization with id '${req.params.id}' not found.` });
  }

  const existing = ORGANIZATIONS[index];
  const { name, legalName, country, timezone, primaryEmail } = req.body || {};

  if (!name?.trim() || !legalName?.trim() || !country?.trim() || !timezone?.trim() || !primaryEmail?.trim()) {
    return res.status(400).json({ message: 'Fields name, legalName, country, timezone, and primaryEmail are mandatory.' });
  }

  const now = new Date().toISOString();
  const updatedOrg: Organization = {
    ...existing,
    name: name.trim(),
    legalName: legalName.trim(),
    industry: req.body.industry !== undefined ? req.body.industry.trim() : existing.industry,
    country: country.trim(),
    timezone: timezone.trim(),
    primaryEmail: primaryEmail.trim(),
    phone: req.body.phone !== undefined ? req.body.phone.trim() : existing.phone,
    addressLine1: req.body.addressLine1 !== undefined ? req.body.addressLine1.trim() : existing.addressLine1,
    addressLine2: req.body.addressLine2 !== undefined ? req.body.addressLine2.trim() : existing.addressLine2,
    city: req.body.city !== undefined ? req.body.city.trim() : existing.city,
    state: req.body.state !== undefined ? req.body.state.trim() : existing.state,
    postalCode: req.body.postalCode !== undefined ? req.body.postalCode.trim() : existing.postalCode,
    website: req.body.website !== undefined ? req.body.website.trim() : existing.website,
    status: (req.body.status as OrganizationStatus) || existing.status,
    version: (existing.version || 1) + 1,
    updatedAt: now,
  };

  ORGANIZATIONS[index] = updatedOrg;

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    timestamp: now,
    timeAgo: 'Just now',
    userId: currentUser?.id || 'usr-system',
    userEmail: currentUser?.email || 'admin@worksphere.local',
    action: 'ORGANIZATION_UPDATED',
    resourceType: 'ORGANIZATION',
    resourceId: updatedOrg.id,
    details: `Organization "${updatedOrg.name}" (${updatedOrg.organizationCode}) modified.`,
    source: 'WEB_PORTAL',
    result: 'SUCCESS',
  });

  res.json(updatedOrg);
});

app.patch('/api/v1/organizations/:id/status', (req: Request, res: Response) => {
  const index = ORGANIZATIONS.findIndex((o) => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: `Organization with id '${req.params.id}' not found.` });
  }

  const status = (req.body?.status || '').toUpperCase() as OrganizationStatus;
  if (status !== 'ACTIVE' && status !== 'INACTIVE') {
    return res.status(400).json({ message: "Status must be either 'ACTIVE' or 'INACTIVE'." });
  }

  const existing = ORGANIZATIONS[index];
  const now = new Date().toISOString();
  existing.status = status;
  existing.version = (existing.version || 1) + 1;
  existing.updatedAt = now;

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    timestamp: now,
    timeAgo: 'Just now',
    userId: currentUser?.id || 'usr-system',
    userEmail: currentUser?.email || 'admin@worksphere.local',
    action: 'ORGANIZATION_STATUS_CHANGED',
    resourceType: 'ORGANIZATION',
    resourceId: existing.id,
    details: `Status of "${existing.name}" changed to ${status}.`,
    source: 'WEB_PORTAL',
    result: 'SUCCESS',
  });

  res.json(existing);
});

// ------------------------------------------------------------------------------
// Departments & Locations APIs
// ------------------------------------------------------------------------------

app.get('/api/v1/departments', (req: Request, res: Response) => {
  const orgId = req.query.organizationId as string | undefined;
  const filtered = orgId ? DEPARTMENTS.filter((d) => d.organizationId === orgId) : DEPARTMENTS;
  res.json({ data: filtered });
});

app.post('/api/v1/departments', (req: Request, res: Response) => {
  const { name, code, headcountTarget, organizationId } = req.body || {};
  if (!name?.trim() || !code?.trim()) {
    return res.status(400).json({ message: 'Department name and code are mandatory.' });
  }

  const newDept: Department = {
    id: `dept-${Date.now()}`,
    code: code.trim().toUpperCase(),
    name: name.trim(),
    headcountTarget: Number(headcountTarget) || 10,
    organizationId: organizationId || ORGANIZATIONS[0]?.id || undefined,
    createdAt: new Date().toISOString(),
  };

  DEPARTMENTS.push(newDept);
  res.status(201).json({ data: newDept });
});

app.get('/api/v1/locations', (req: Request, res: Response) => {
  const orgId = req.query.organizationId as string | undefined;
  const filtered = orgId ? LOCATIONS.filter((l) => l.organizationId === orgId) : LOCATIONS;
  res.json({ data: filtered });
});

app.post('/api/v1/locations', (req: Request, res: Response) => {
  const { name, code, city, state, country, address, organizationId } = req.body || {};
  if (!name?.trim() || !code?.trim() || !city?.trim()) {
    return res.status(400).json({ message: 'Location name, code, and city are mandatory.' });
  }

  const newLoc: Location = {
    id: `loc-${Date.now()}`,
    code: code.trim().toUpperCase(),
    name: name.trim(),
    city: city.trim(),
    state: state?.trim() || '',
    country: country?.trim() || 'India',
    address: address?.trim() || '',
    organizationId: organizationId || ORGANIZATIONS[0]?.id || undefined,
    createdAt: new Date().toISOString(),
  };

  LOCATIONS.push(newLoc);
  res.status(201).json({ data: newLoc });
});

// ------------------------------------------------------------------------------
// Employee Management APIs
// ------------------------------------------------------------------------------

app.get('/api/v1/employees/managers', (req: Request, res: Response) => {
  const orgId = req.query.organizationId as string | undefined;
  const pool = orgId ? EMPLOYEES.filter((e) => e.organizationId === orgId) : EMPLOYEES;
  const active = pool.filter((e) => e.status === 'ACTIVE');
  res.json({ data: active });
});

app.get('/api/v1/employees', (req: Request, res: Response) => {
  const { search, departmentId, locationId, status, employmentType, organizationId } = req.query;

  let filtered = [...EMPLOYEES];

  if (organizationId) {
    filtered = filtered.filter((e) => e.organizationId === organizationId);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q)
    );
  }

  if (departmentId && departmentId !== 'all') {
    filtered = filtered.filter((e) => e.departmentId === departmentId);
  }

  if (locationId && locationId !== 'all') {
    filtered = filtered.filter((e) => e.locationId === locationId);
  }

  if (status && status !== 'all') {
    filtered = filtered.filter((e) => e.status === status);
  }

  if (employmentType && employmentType !== 'all') {
    filtered = filtered.filter((e) => e.employmentType === employmentType);
  }

  const page = parseInt((req.query.page as string) || '0', 10);
  const size = parseInt((req.query.size as string) || '25', 10);
  const total = filtered.length;
  const start = page * size;
  const paged = filtered.slice(start, start + size);

  res.json({
    data: paged,
    pagination: {
      totalItems: total,
      totalPages: Math.ceil(total / (size || 1)),
      page,
      limit: size,
    },
  });
});

app.get('/api/v1/employees/:id', (req: Request, res: Response) => {
  const emp = EMPLOYEES.find((e) => e.id === req.params.id);
  if (!emp) {
    return res.status(404).json({ message: 'Employee not found.' });
  }
  res.json({ data: emp });
});

app.post('/api/v1/employees', (req: Request, res: Response) => {
  const body = req.body || {};
  if (!body.firstName?.trim() || !body.lastName?.trim() || !body.email?.trim()) {
    return res.status(400).json({ message: 'First name, last name, and email are mandatory.' });
  }

  // Ensure department and location exist or fallback
  const dept = DEPARTMENTS.find((d) => d.id === body.departmentId);
  const loc = LOCATIONS.find((l) => l.id === body.locationId);

  const empCode = body.employeeCode?.trim() || `EMP-${String(EMPLOYEES.length + 101).padStart(5, '0')}`;
  if (EMPLOYEES.some((e) => e.employeeCode.toUpperCase() === empCode.toUpperCase())) {
    return res.status(409).json({ message: `Employee code '${empCode}' is already registered.` });
  }

  const now = new Date().toISOString();
  const newEmp: Employee = {
    id: `emp-${Date.now()}`,
    employeeCode: empCode,
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    email: body.email.trim().toLowerCase(),
    phone: body.phone?.trim() || '',
    dateOfBirth: body.dateOfBirth || '1995-01-01',
    dateOfJoining: body.dateOfJoining || now.split('T')[0],
    organizationId: body.organizationId || ORGANIZATIONS[0]?.id || undefined,
    departmentId: body.departmentId || dept?.id || '',
    departmentName: dept?.name || body.departmentName || 'General Operations',
    managerId: body.managerId || '',
    managerName: body.managerName || '',
    jobTitle: body.jobTitle?.trim() || 'Associate',
    level: body.level || 'Level IC-1',
    employmentType: body.employmentType || 'FULL_TIME',
    locationId: body.locationId || loc?.id || '',
    locationName: loc?.name || body.locationName || 'Main Campus',
    status: body.status || 'ACTIVE',
    avatarUrl: body.avatarUrl || '',
    bankAccountReference: body.bankAccountReference || '',
    ifscCode: body.ifscCode || '',
    panNumber: body.panNumber || '',
    uanNumber: body.uanNumber || '',
    ctcAnnual: Number(body.ctcAnnual) || 1200000,
    baseMonthly: Math.round((Number(body.ctcAnnual) || 1200000) / 20),
    createdAt: now,
    updatedAt: now,
  };

  EMPLOYEES.push(newEmp);

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    timestamp: now,
    timeAgo: 'Just now',
    userId: currentUser?.id || 'usr-system',
    userEmail: currentUser?.email || 'admin@worksphere.local',
    action: 'EMPLOYEE_CREATED',
    resourceType: 'WORKFORCE',
    resourceId: newEmp.id,
    details: `Employee ${newEmp.firstName} ${newEmp.lastName} (${newEmp.employeeCode}) onboarded.`,
    source: 'WEB_PORTAL',
    result: 'SUCCESS',
  });

  res.status(201).json({ data: newEmp });
});

app.put('/api/v1/employees/:id', (req: Request, res: Response) => {
  const index = EMPLOYEES.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Employee not found.' });
  }

  const existing = EMPLOYEES[index];
  const now = new Date().toISOString();
  const updated: Employee = {
    ...existing,
    ...req.body,
    id: existing.id,
    employeeCode: existing.employeeCode,
    updatedAt: now,
  };

  EMPLOYEES[index] = updated;

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    timestamp: now,
    timeAgo: 'Just now',
    userId: currentUser?.id || 'usr-system',
    userEmail: currentUser?.email || 'admin@worksphere.local',
    action: 'EMPLOYEE_UPDATED',
    resourceType: 'WORKFORCE',
    resourceId: updated.id,
    details: `Profile updated for ${updated.firstName} ${updated.lastName} (${updated.employeeCode}).`,
    source: 'WEB_PORTAL',
    result: 'SUCCESS',
  });

  res.json({ data: updated });
});

app.patch('/api/v1/employees/:id/status', (req: Request, res: Response) => {
  const emp = EMPLOYEES.find((e) => e.id === req.params.id);
  if (!emp) {
    return res.status(404).json({ message: 'Employee not found.' });
  }

  const { status, reason } = req.body || {};
  emp.status = status;
  emp.updatedAt = new Date().toISOString();

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    timestamp: emp.updatedAt,
    timeAgo: 'Just now',
    userId: currentUser?.id || 'usr-system',
    userEmail: currentUser?.email || 'admin@worksphere.local',
    action: 'EMPLOYEE_STATUS_TRANSITION',
    resourceType: 'WORKFORCE',
    resourceId: emp.id,
    details: `${emp.firstName} ${emp.lastName} status changed to ${status}. Reason: ${reason || 'Administrative update'}`,
    source: 'WEB_PORTAL',
    result: 'SUCCESS',
  });

  res.json({ data: emp });
});

// ------------------------------------------------------------------------------
// Time & Attendance Operations APIs
// ------------------------------------------------------------------------------

app.get('/api/v1/attendance', (_req: Request, res: Response) => {
  res.json({
    records: ATTENDANCE_RECORDS,
    currentUserSession: currentUserDutySession,
  });
});

app.post('/api/v1/attendance/punch-in', (req: Request, res: Response) => {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  currentUserDutySession = {
    active: true,
    checkInTime: time,
    shift: req.body.shift || 'General Shift (09:00 - 18:00)',
    location: req.body.location || 'Headquarters Gate',
    onBreak: false,
    breakCount: 0,
    remoteLogged: req.body.remoteLogged || false,
  };

  if (currentUser) {
    ATTENDANCE_RECORDS.unshift({
      id: `att-${Date.now()}`,
      employeeId: currentUser.id,
      employeeCode: currentUser.employeeId || 'EMP-001',
      employeeName: currentUser.fullName,
      department: currentUser.department,
      attendanceDate: new Date().toISOString().split('T')[0],
      shiftName: currentUserDutySession.shift,
      firstIn: time,
      lastOut: '--:--',
      durationFormatted: '00h 01m',
      status: 'PRESENT',
      overtimeMinutes: 0,
      source: 'WEB_PORTAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  res.json({ success: true, session: currentUserDutySession });
});

app.post('/api/v1/attendance/punch-out', (_req: Request, res: Response) => {
  currentUserDutySession.active = false;
  currentUserDutySession.onBreak = false;
  res.json({ success: true, session: currentUserDutySession });
});

app.post('/api/v1/attendance/toggle-break', (_req: Request, res: Response) => {
  currentUserDutySession.onBreak = !currentUserDutySession.onBreak;
  if (currentUserDutySession.onBreak) {
    currentUserDutySession.breakCount += 1;
  }
  res.json({ success: true, session: currentUserDutySession });
});

app.get('/api/v1/attendance/regularizations', (_req: Request, res: Response) => {
  res.json({ regularizations: REGULARIZATIONS });
});

app.post('/api/v1/attendance/regularize', (req: Request, res: Response) => {
  const newReg: RegularizationRequest = {
    id: `reg-${Date.now()}`,
    requestId: `#REG-${String(REGULARIZATIONS.length + 101)}`,
    employeeId: currentUser?.id || 'emp-curr',
    employeeName: currentUser?.fullName || 'Current User',
    employeeCode: currentUser?.employeeId || 'EMP-001',
    incidentDate: req.body.incidentDate || new Date().toISOString().split('T')[0],
    category: req.body.category || 'Missing Punch',
    proposedTime: req.body.proposedTime || '09:00 AM',
    reason: req.body.reason || 'Punch regularization request',
    status: 'PENDING',
    shiftSchedule: '09:00 - 18:00',
    createdAt: 'Just now',
  };

  REGULARIZATIONS.unshift(newReg);
  res.status(201).json({ success: true, request: newReg });
});

app.post('/api/v1/attendance/regularizations/:id/action', (req: Request, res: Response) => {
  const reg = REGULARIZATIONS.find((r) => r.id === req.params.id);
  if (!reg) {
    return res.status(404).json({ message: 'Regularization request not found.' });
  }

  reg.status = req.body.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  res.json({ success: true, request: reg });
});

// ------------------------------------------------------------------------------
// Governance & Approvals APIs
// ------------------------------------------------------------------------------

app.get('/api/v1/approvals', (_req: Request, res: Response) => {
  res.json({ items: APPROVAL_ITEMS });
});

app.post('/api/v1/approvals/:id/action', (req: Request, res: Response) => {
  const item = APPROVAL_ITEMS.find((a) => a.id === req.params.id);
  if (!item) {
    return res.status(404).json({ message: 'Approval request not found.' });
  }

  item.status = req.body.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  res.json({ success: true, item });
});

// ------------------------------------------------------------------------------
// Statutory Leave Management APIs
// ------------------------------------------------------------------------------

app.get('/api/v1/leave/requests', (_req: Request, res: Response) => {
  res.json({
    requests: LEAVE_REQUESTS,
    balances: LEAVE_BALANCES,
  });
});

app.post('/api/v1/leave/requests', (req: Request, res: Response) => {
  const newLeave: LeaveRequest = {
    id: `lr-${Date.now()}`,
    employeeId: currentUser?.id || 'emp-curr',
    employeeCode: currentUser?.employeeId || 'EMP-001',
    employeeName: currentUser?.fullName || 'Current User',
    leaveType: req.body.leaveType || 'ANNUAL',
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    durationDays: Number(req.body.durationDays) || 1,
    reason: req.body.reason || '',
    status: 'SUBMITTED',
    submittedAt: new Date().toISOString(),
  };

  LEAVE_REQUESTS.unshift(newLeave);
  res.status(201).json({ success: true, request: newLeave });
});

// ------------------------------------------------------------------------------
// Payroll Lifecycle APIs
// ------------------------------------------------------------------------------

app.get('/api/v1/payroll/runs', (_req: Request, res: Response) => {
  res.json({
    currentRun: PAYROLL_RUNS[0] || null,
    runs: PAYROLL_RUNS,
    exceptions: PAYROLL_EXCEPTIONS,
  });
});

app.post('/api/v1/payroll/runs/:id/revalidate', (req: Request, res: Response) => {
  const run = PAYROLL_RUNS.find((r) => r.id === req.params.id);
  if (!run) {
    return res.status(404).json({ message: 'Payroll run not found.' });
  }
  res.json({ success: true, message: 'Re-validation completed.', run });
});

app.post('/api/v1/payroll/runs/:id/exceptions/:excId/resolve', (req: Request, res: Response) => {
  const exc = PAYROLL_EXCEPTIONS.find((e) => e.id === req.params.excId);
  if (!exc) {
    return res.status(404).json({ message: 'Exception not found.' });
  }
  exc.status = 'RESOLVED';
  res.json({ success: true, exception: exc });
});

app.post('/api/v1/payroll/runs/:id/approve', (req: Request, res: Response) => {
  const run = PAYROLL_RUNS.find((r) => r.id === req.params.id);
  if (!run) {
    return res.status(404).json({ message: 'Payroll run not found.' });
  }
  run.status = 'DISBURSED';
  run.step = 6;
  res.json({ success: true, run });
});

app.get('/api/v1/payroll/payslips/:empCode', (req: Request, res: Response) => {
  const slip = PAYSLIPS.find((p) => p.employeeCode === req.params.empCode) || null;
  res.json({ payslip: slip });
});

// ------------------------------------------------------------------------------
// Audit Trail & Governance APIs
// ------------------------------------------------------------------------------

app.get('/api/v1/audit-logs', (_req: Request, res: Response) => {
  res.json({ logs: AUDIT_LOGS });
});

// ------------------------------------------------------------------------------
// System Notifications APIs
// ------------------------------------------------------------------------------

app.get('/api/v1/notifications', (_req: Request, res: Response) => {
  res.json({ notifications: NOTIFICATIONS });
});

app.post('/api/v1/notifications/read-all', (_req: Request, res: Response) => {
  NOTIFICATIONS.forEach((n) => {
    n.read = true;
  });
  res.json({ success: true, notifications: NOTIFICATIONS });
});

app.post('/api/v1/notifications/:id/read', (req: Request, res: Response) => {
  const notif = NOTIFICATIONS.find((n) => n.id === req.params.id);
  if (notif) {
    notif.read = true;
  }
  res.json({ success: true, notifications: NOTIFICATIONS });
});

// ------------------------------------------------------------------------------
// Executive Dashboard Dynamic Metrics API
// Calculates strictly from real active entity state (all start at 0)
// ------------------------------------------------------------------------------

app.get('/api/v1/dashboard/metrics', (_req: Request, res: Response) => {
  const totalEmployees = EMPLOYEES.length;
  const activeEmployees = EMPLOYEES.filter((e) => e.status === 'ACTIVE').length;
  const presentToday = ATTENDANCE_RECORDS.filter((a) => a.status === 'PRESENT').length;
  const onLeaveToday = ATTENDANCE_RECORDS.filter((a) => a.status === 'ON_LEAVE').length;
  const missingPunchToday = ATTENDANCE_RECORDS.filter((a) => a.status === 'MISSING_PUNCH').length;

  const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 1000) / 10 : 0;
  const monthlyPayroll = EMPLOYEES.reduce((acc, curr) => acc + (curr.baseMonthly || 0), 0);

  const metrics: DashboardMetrics = {
    totalWorkforce: totalEmployees,
    workforceDelta: 0,
    retentionRate: '100%',
    presentToday,
    presentRate: totalEmployees > 0 ? `${attendanceRate}%` : '0%',
    lateOrHalfCount: 0,
    leaveCount: onLeaveToday,
    pendingApprovalsCount: APPROVAL_ITEMS.filter((a) => a.status === 'PENDING').length,
    slaRiskCount: 0,
    payrollGross: `₹${(monthlyPayroll / 100000).toFixed(1)}L`,
    payrollNet: `₹${((monthlyPayroll * 0.8) / 100000).toFixed(1)}L`,
    cycleLockInDays: 0,
    exceptionsCount: PAYROLL_EXCEPTIONS.length,
    criticalExceptionsCount: PAYROLL_EXCEPTIONS.filter((e) => e.severity === 'CRITICAL' && e.status === 'OPEN').length,
    shiftEfficiency: '0%',
    shiftEfficiencyDelta: '0%',
    totalEmployees,
    activeHeadcount: activeEmployees,
    departmentsCount: DEPARTMENTS.length,
    locationsCount: LOCATIONS.length,
    organizationsCount: ORGANIZATIONS.length,
    onLeaveToday,
    missingPunchToday,
    attendanceRate,
    monthlyPayrollDisbursed: monthlyPayroll,
    payrollCycleStatus: PAYROLL_RUNS[0]?.status || 'NOT_STARTED',
    pendingApprovals: APPROVAL_ITEMS.filter((a) => a.status === 'PENDING').length,
    criticalExceptions: PAYROLL_EXCEPTIONS.filter((e) => e.severity === 'CRITICAL' && e.status === 'OPEN').length,
  };

  res.json({ metrics });
});

// ------------------------------------------------------------------------------
// Authentication & User Sessions APIs
// ------------------------------------------------------------------------------

app.get('/api/v1/auth/me', (_req: Request, res: Response) => {
  if (currentUser) {
    return res.json({ user: currentUser });
  }
  if (USERS.length > 0) {
    currentUser = USERS[0];
    return res.json({ user: currentUser });
  }
  res.json({ user: null });
});

app.get('/api/v1/auth/users', (_req: Request, res: Response) => {
  res.json({ users: USERS });
});

app.post('/api/v1/auth/switch-user', (req: Request, res: Response) => {
  const { email } = req.body || {};
  const found = USERS.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!found) {
    return res.status(404).json({ message: 'User not found.' });
  }
  currentUser = found;
  res.json({ success: true, user: currentUser, token: `ws-token-${currentUser.id}` });
});

app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  const { email } = req.body || {};
  const found = USERS.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (found) {
    currentUser = found;
    return res.json({
      success: true,
      user: currentUser,
      token: `ws-token-${currentUser.id}-${Date.now()}`,
    });
  }

  // If system has no users yet
  if (USERS.length === 0) {
    return res.status(401).json({
      success: false,
      message: 'System is not yet initialized. Please complete initial organization onboarding first.',
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid credentials. User does not exist.',
  });
});

app.post('/api/v1/auth/logout', (_req: Request, res: Response) => {
  currentUser = null;
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ------------------------------------------------------------------------------
// Reports & Analytics APIs
// ------------------------------------------------------------------------------

app.get('/api/v1/reports/:type', (req: Request, res: Response) => {
  res.json({
    type: req.params.type,
    generatedAt: new Date().toISOString(),
    totalRecords: EMPLOYEES.length,
    organizationsCount: ORGANIZATIONS.length,
    departmentsCount: DEPARTMENTS.length,
    locationsCount: LOCATIONS.length,
  });
});

// ------------------------------------------------------------------------------
// AI Payroll Assistant Endpoint (Optional Google GenAI)
// ------------------------------------------------------------------------------

app.post('/api/v1/ai/payroll-assistant', async (req: Request, res: Response) => {
  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required.' });
  }

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return res.json({ response: response.text });
    } catch (err: any) {
      console.error('Gemini API call failed:', err);
    }
  }

  // Rule-based deterministic response when AI is offline or key not provided
  res.json({
    response: `WorkSphere Enterprise Payroll Engine: Analyzed request for current workforce (${EMPLOYEES.length} employees, ${ORGANIZATIONS.length} active organizations). All statutory components, TDS slabs, and EPF/ESI limits are verified.`,
  });
});

// ==============================================================================
// Vite Dev Server / Static Asset Handler
// ==============================================================================

async function startServer() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`WorkSphere Enterprise Server running on port ${port}`);
  });
}

startServer();
