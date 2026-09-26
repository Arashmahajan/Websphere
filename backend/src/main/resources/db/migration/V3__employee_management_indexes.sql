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

-- 2. Clean Business Model: Zero Pre-seeded Departments & Locations
-- Departments and Locations are created dynamically via UI/API after Organization onboarding.


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
