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

-- 3. Seed Users (BCrypt hashed 'WorkSphere@2026')
-- BCrypt: $2a$12$K1bV0d0iS...
INSERT INTO users (id, email, password_hash, full_name, title, department, employee_code, avatar_url) VALUES
('usr-1', 'admin@worksphere.local', '$2a$12$e8x1nKzP9mD3w8jI0y0nCe3g0P.pQh1rNfXk8rQv0W1z7P3gQ9i7e', 'Vikram Malhotra', 'CPO & Enterprise Admin', 'People Operations & HR', 'EMP-00108', 'https://lh3.googleusercontent.com/aida/AEtjO1XHqf_44drjKHy69uFGwId1FjRxHpWHmsGgYOwUzRGm05siNp7n26wG_b9WhOVWzx6_OL9l0igAAUiWlZOIg0hOiV039W_YxvQM1Bhsb_NUR90PUaQQJtJrUxVhLtaCra-vFGPlK9llH3gu6b4dhG-EQ6KYY7YZFp1sCBdRxPv6ITHxZ9flyzOf6ddsQslx5qupYf-U91_qoxmN3wE-hSy_4opkR5T6cFXOC1ZA8P4yGihqT-efUaiwQrE'),
('usr-2', 'payroll@worksphere.local', '$2a$12$e8x1nKzP9mD3w8jI0y0nCe3g0P.pQh1rNfXk8rQv0W1z7P3gQ9i7e', 'Pooja Nair', 'Director · FinOps & Payroll', 'Finance, Tax & Legal', 'EMP-01452', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQlPOhk6lCW9cL63G_AL-BIl4o6Gxr8F4d7CeN_izRhLccd5AuVmJk8D0_cGWV4wTNwNEqs-EwkEy_tzetrCYDilAEuM08hqjG02oE3mME9MX4Y3Lx5WYS1LNf_z699CPC2e95hwIrh6odFpIOyd0B3-df5sqr3SedHa0CShtSa4YjwG93eDeadniqsFYlOCea0mByfxk0oOllISjGCB6uccbl_JavGqNb6uNsIAr4lFxNzLAkTrRJ'),
('usr-3', 'manager@worksphere.local', '$2a$12$e8x1nKzP9mD3w8jI0y0nCe3g0P.pQh1rNfXk8rQv0W1z7P3gQ9i7e', 'Ananya Roy', 'Director of Engineering', 'Engineering & Product', 'WSP-0450', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCW_BZsh4Ahmj1vhWkdiPSJHJk_JiD7MGwCQHFREHOrhWfktTZmFql_2WdPk7DAmvX85ctiayfE-tgTFT-m5qFJros-gYCffttaop3ZmsIYkb_XCEW5qXaaD0NZjr7c-WsdXSug-TmnnAYhrtIht9_p90_BEM2AsCdxp37J736KcP49OIvllx_PdRB3iEhPdNFocd6EVO0tf18pKGqb8KPkrPZsU_7VMQTNrpC_u74I5Bm8JyCxN4m4'),
('usr-4', 'employee@worksphere.local', '$2a$12$e8x1nKzP9mD3w8jI0y0nCe3g0P.pQh1rNfXk8rQv0W1z7P3gQ9i7e', 'Rohan Sharma', 'Lead Cloud Architect', 'Engineering & Product', 'WSP-1092', 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5e-MuIzZAnpeh_asU-cbtoW4z6moi-NBbVuQJV2jjykGHArndLm3OoA7jgK_S6vno1sC1Mt5YGAcQh__jCJsaz4HjLRC4d7emKQMpm8FgfLilnAE_-HXXEfbpR1xnc1Jx3aWK6s6NHv-WuomH3qAStCo4i7T69xfVd08lZhex3LWzARiYsb9uqtBCRej5UXBN_--okZRLMYuwNhWDHk_MAPOX1IZpYxNRrTeVScsxIbHR3t48hQog')
ON CONFLICT (email) DO NOTHING;

-- 4. User Roles Mapping
INSERT INTO user_roles (user_id, role_id) VALUES
('usr-1', 'role-sysadmin'),
('usr-2', 'role-payrolladmin'),
('usr-3', 'role-manager'),
('usr-4', 'role-employee')
ON CONFLICT DO NOTHING;

-- 5. Leave Types
INSERT INTO leave_types (code, name, annual_quota, carry_forward_max, paid) VALUES
('ANNUAL', 'Annual Privilege Leave', 18, 10, TRUE),
('SICK', 'Paid Sick Leave', 12, 0, TRUE),
('CASUAL', 'Casual / Personal Leave', 8, 0, TRUE),
('UNPAID', 'Loss of Pay Leave', 30, 0, FALSE),
('MATERNITY', 'Maternity Statutory Leave', 180, 0, TRUE),
('PATERNITY', 'Paternity Statutory Leave', 15, 0, TRUE)
ON CONFLICT (code) DO NOTHING;
