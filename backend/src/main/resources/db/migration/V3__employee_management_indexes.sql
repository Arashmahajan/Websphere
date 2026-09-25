-- ====================================================================
-- WorkSphere Enterprise HCM: V3 Flyway Migration
-- Employee Management Indexes, Reference Catalogs & Permissions
-- ====================================================================

-- 1. Performance Indexes for Server-Side Querying, Filtering & Sorting
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_location_id ON employees(location_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_date_of_joining ON employees(date_of_joining);
CREATE INDEX IF NOT EXISTS idx_employees_dept_status ON employees(department_id, status);
CREATE INDEX IF NOT EXISTS idx_employees_names ON employees(last_name, first_name);

-- 2. Seed Standard Departments (Idempotent)
INSERT INTO departments (id, code, name, headcount_target) VALUES
('dept-1', 'ENG', 'Engineering & Product', 450),
('dept-2', 'HR', 'Human Resources', 45),
('dept-3', 'FIN', 'Finance, Tax & Legal', 60),
('dept-4', 'PAY', 'Payroll & Benefits', 30),
('dept-5', 'OPS', 'Operations & Facilities', 120),
('dept-6', 'SLS', 'Sales & Business Development', 180),
('dept-7', 'MKT', 'Marketing & Communications', 50),
('dept-8', 'IT', 'Information Technology & Security', 85)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Standard Geographic Locations
INSERT INTO locations (id, code, name, city, state, country, address) VALUES
('loc-blr', 'BLR', 'Bengaluru (Campus 1 & 2)', 'Bangalore', 'Karnataka', 'India', 'Outer Ring Road, Bellandur'),
('loc-hyd', 'HYD', 'Hyderabad (HITEC City)', 'Hyderabad', 'Telangana', 'India', 'Mindspace Madhapur Hub'),
('loc-mum', 'MUM', 'Mumbai (BKC Hub)', 'Mumbai', 'Maharashtra', 'India', 'Bandra Kurla Complex, G Block'),
('loc-del', 'DEL', 'Delhi NCR (CyberHub)', 'Delhi', 'Delhi NCR', 'India', 'DLF CyberCity Tower 10'),
('loc-chd', 'CHD', 'Chandigarh (IT Park)', 'Chandigarh', 'Punjab', 'India', 'Rajiv Gandhi Chandigarh Technology Park'),
('loc-pun', 'PUN', 'Pune (Hinjawadi)', 'Pune', 'Maharashtra', 'India', 'Rajiv Gandhi Infotech Park Phase 1'),
('loc-rem', 'REM', 'Distributed Remote', 'Remote', 'All', 'India', 'Remote Work Infrastructure')
ON CONFLICT (id) DO NOTHING;

-- 4. Status Change Permission & Role Assignment
INSERT INTO permissions (id, name, module, description) VALUES
('perm-20', 'EMPLOYEE_STATUS_CHANGE', 'WORKFORCE', 'Authorize lifecycle transitions (ACTIVE, ON_LEAVE, SUSPENDED, TERMINATED)')
ON CONFLICT (name) DO NOTHING;

-- Grant permissions to HR_ADMIN and SYSTEM_ADMIN
INSERT INTO role_permissions (role_id, permission_id) VALUES
('role-sysadmin', 'perm-20'),
('role-hradmin', 'perm-1'),
('role-hradmin', 'perm-2'),
('role-hradmin', 'perm-20')
ON CONFLICT DO NOTHING;
