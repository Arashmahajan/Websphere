-- ====================================================================
-- WorkSphere Enterprise HCM: V4 Flyway Migration
-- Infrastructure Indexes, Audit Trail Performance & User Search
-- ====================================================================

-- 1. Performance Indexes for Audit Trail Queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- 2. Indexes for User Account Lookups & Association with Employees
CREATE INDEX IF NOT EXISTS idx_users_employee_code ON users(employee_code);
CREATE INDEX IF NOT EXISTS idx_users_enabled ON users(enabled);

-- 3. Verification comment
COMMENT ON TABLE audit_logs IS 'Append-only enterprise audit trail logging all lifecycle, RBAC, and operational events';
COMMENT ON TABLE users IS 'Enterprise identity records with BCrypt hashed credentials and RBAC role associations';
