-- ====================================================================
-- WorkSphere Enterprise HCM: V2 Flyway Idempotent Seed Data
-- Seeded RBAC Accounts: admin, payroll, manager, employee
-- ====================================================================

-- 1. Roles
INSERT INTO roles (id, name, description) VALUES
('role-sysadmin', 'SYSTEM_ADMIN', 'Executive System Administrator with global capabilities'),
('role-hradmin', 'HR_ADMIN', 'HR Operations & Workforce Administration'),
('role-payrolladmin', 'PAYROLL_ADMIN', 'FinOps & Payroll Disbursement Officer'),
('role-manager', 'MANAGER', 'People Manager with Attendance & Leave approval authority'),
('role-employee', 'EMPLOYEE', 'Standard Workforce Self-Service Personnel')
ON CONFLICT (name) DO NOTHING;

-- 2. Permissions
INSERT INTO permissions (id, name, module, description) VALUES
('perm-1', 'EMPLOYEE_READ', 'WORKFORCE', 'Read employee records and directory'),
('perm-2', 'EMPLOYEE_WRITE', 'WORKFORCE', 'Create and modify employee profiles'),
('perm-3', 'EMPLOYEE_DELETE', 'WORKFORCE', 'Archive employee profiles'),
('perm-4', 'ATTENDANCE_READ', 'ATTENDANCE', 'View attendance and turnstile events'),
('perm-5', 'ATTENDANCE_PUNCH', 'ATTENDANCE', 'Clock in, break toggle, and clock out'),
('perm-6', 'ATTENDANCE_REGULARIZE', 'ATTENDANCE', 'Submit missing punch regularizations'),
('perm-7', 'ATTENDANCE_APPROVE', 'ATTENDANCE', 'Approve subordinate attendance regularizations'),
('perm-8', 'LEAVE_READ', 'LEAVE', 'View leave quotas, balances, and history'),
('perm-9', 'LEAVE_APPLY', 'LEAVE', 'Submit statutory leave requests'),
('perm-10', 'LEAVE_APPROVE', 'LEAVE', 'Authorize department leave applications'),
('perm-11', 'LEAVE_REJECT', 'LEAVE', 'Reject leave applications with comments'),
('perm-12', 'PAYROLL_READ', 'PAYROLL', 'Inspect payroll cycles, runs, and payslips'),
('perm-13', 'PAYROLL_PROCESS', 'PAYROLL', 'Execute gross calculations and variable inputs'),
('perm-14', 'PAYROLL_APPROVE', 'PAYROLL', 'CFO sign-off and host-to-host disbursement'),
('perm-15', 'PAYROLL_EXCEPTION_RESOLVE', 'PAYROLL', 'Resolve blocking exceptions in payroll runs'),
('perm-16', 'REPORT_READ', 'ANALYTICS', 'Access enterprise HCM BI dashboards'),
('perm-17', 'REPORT_EXPORT', 'ANALYTICS', 'Export audit-ready CSV/PDF reports'),
('perm-18', 'AUDIT_READ', 'GOVERNANCE', 'Inspect immutable audit trails'),
('perm-19', 'USER_MANAGE', 'ADMIN', 'Manage application users and role assignments')
ON CONFLICT (name) DO NOTHING;

-- 3. Status: Zero Business/User Records by default
-- System starts clean: Initial Administrator is provisioned during organization setup flow.


-- 5. Leave Types
INSERT INTO leave_types (code, name, annual_quota, carry_forward_max, paid) VALUES
('ANNUAL', 'Annual Privilege Leave', 18, 10, TRUE),
('SICK', 'Paid Sick Leave', 12, 0, TRUE),
('CASUAL', 'Casual / Personal Leave', 8, 0, TRUE),
('UNPAID', 'Loss of Pay Leave', 30, 0, FALSE),
('MATERNITY', 'Maternity Statutory Leave', 180, 0, TRUE),
('PATERNITY', 'Paternity Statutory Leave', 15, 0, TRUE)
ON CONFLICT (code) DO NOTHING;
