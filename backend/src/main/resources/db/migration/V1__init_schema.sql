-- ====================================================================
-- WorkSphere Enterprise HCM: V1 Flyway Initial Schema (3NF)
-- PostgreSQL 16 ACID Compliance, Foreign Keys, Versioned Optimistic Locking
-- ====================================================================

-- 1. Identity & RBAC
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    module VARCHAR(64) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(64) REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(64) REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(128),
    department VARCHAR(128),
    avatar_url TEXT,
    employee_code VARCHAR(64),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(64) REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 2. Organization & Workforce
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    head_employee_id VARCHAR(64),
    headcount_target INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    city VARCHAR(64) NOT NULL,
    state VARCHAR(64) NOT NULL,
    country VARCHAR(64) NOT NULL DEFAULT 'India',
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(64) PRIMARY KEY,
    employee_code VARCHAR(64) NOT NULL UNIQUE,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(32),
    date_of_birth DATE NOT NULL,
    date_of_joining DATE NOT NULL,
    department_id VARCHAR(64) REFERENCES departments(id),
    department_name VARCHAR(128),
    manager_id VARCHAR(64) REFERENCES employees(id),
    manager_name VARCHAR(128),
    job_title VARCHAR(128) NOT NULL,
    level VARCHAR(32) NOT NULL,
    employment_type VARCHAR(32) NOT NULL,
    location_id VARCHAR(64) REFERENCES locations(id),
    location_name VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    avatar_url TEXT,
    bank_account_ref VARCHAR(64),
    ifsc_code VARCHAR(32),
    pan_number VARCHAR(32),
    uan_number VARCHAR(32),
    ctc_annual NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    base_monthly NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Attendance, Shifts & Regularizations
CREATE TABLE IF NOT EXISTS shifts (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_minutes INT DEFAULT 15,
    half_day_threshold_minutes INT DEFAULT 240,
    full_day_threshold_minutes INT DEFAULT 480
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) NOT NULL REFERENCES employees(id),
    employee_code VARCHAR(64) NOT NULL,
    employee_name VARCHAR(128) NOT NULL,
    department VARCHAR(128),
    work_date DATE NOT NULL,
    first_in TIME,
    last_out TIME,
    total_hours_worked NUMERIC(5, 2) DEFAULT 0.00,
    shift_code VARCHAR(32),
    status VARCHAR(32) NOT NULL,
    turnstile_gate VARCHAR(64),
    anomaly_flag VARCHAR(64),
    version BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_workdate UNIQUE (employee_id, work_date)
);

CREATE TABLE IF NOT EXISTS attendance_regularizations (
    id VARCHAR(64) PRIMARY KEY,
    request_id VARCHAR(64) NOT NULL UNIQUE,
    employee_id VARCHAR(64) NOT NULL REFERENCES employees(id),
    employee_name VARCHAR(128) NOT NULL,
    employee_code VARCHAR(64) NOT NULL,
    incident_date DATE NOT NULL,
    category VARCHAR(64) NOT NULL,
    proposed_time VARCHAR(32) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    shift_schedule VARCHAR(64),
    reviewed_by VARCHAR(128),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Leave Types, Balances & Requests
CREATE TABLE IF NOT EXISTS leave_types (
    code VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    annual_quota INT NOT NULL,
    carry_forward_max INT DEFAULT 0,
    encashable BOOLEAN DEFAULT FALSE,
    paid BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS leave_balances (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) NOT NULL REFERENCES employees(id),
    leave_type VARCHAR(32) NOT NULL REFERENCES leave_types(code),
    allocated INT NOT NULL,
    used INT NOT NULL DEFAULT 0,
    pending INT NOT NULL DEFAULT 0,
    available INT NOT NULL,
    calendar_year INT NOT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT uq_emp_leavetype_year UNIQUE (employee_id, leave_type, calendar_year)
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) NOT NULL REFERENCES employees(id),
    employee_code VARCHAR(64) NOT NULL,
    employee_name VARCHAR(128) NOT NULL,
    leave_type VARCHAR(32) NOT NULL REFERENCES leave_types(code),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INT NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
    approved_by VARCHAR(128),
    approved_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Payroll Cycles, Items, Exceptions & Payslips
CREATE TABLE IF NOT EXISTS payroll_runs (
    id VARCHAR(64) PRIMARY KEY,
    run_code VARCHAR(64) NOT NULL UNIQUE,
    pay_period VARCHAR(128) NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    disbursement_date DATE NOT NULL,
    step INT DEFAULT 1,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    gross_disbursement NUMERIC(15, 2) DEFAULT 0.00,
    total_deductions NUMERIC(15, 2) DEFAULT 0.00,
    net_payable NUMERIC(15, 2) DEFAULT 0.00,
    employees_processed INT DEFAULT 0,
    critical_exceptions INT DEFAULT 0,
    exceptions_total INT DEFAULT 0,
    version BIGINT DEFAULT 0,
    approved_by VARCHAR(128),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_exceptions (
    id VARCHAR(64) PRIMARY KEY,
    payroll_run_id VARCHAR(64) NOT NULL REFERENCES payroll_runs(id),
    employee_id VARCHAR(64) NOT NULL REFERENCES employees(id),
    employee_code VARCHAR(64) NOT NULL,
    employee_name VARCHAR(128) NOT NULL,
    department VARCHAR(128),
    designation VARCHAR(128),
    severity VARCHAR(32) NOT NULL,
    exception_type VARCHAR(64) NOT NULL,
    exception_type_label VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    net_impact NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    suggested_action TEXT NOT NULL,
    assigned_desk VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    resolved_by VARCHAR(128),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payslips (
    id VARCHAR(64) PRIMARY KEY,
    payroll_run_id VARCHAR(64) NOT NULL REFERENCES payroll_runs(id),
    employee_id VARCHAR(64) NOT NULL REFERENCES employees(id),
    employee_code VARCHAR(64) NOT NULL,
    employee_name VARCHAR(128) NOT NULL,
    job_title VARCHAR(128) NOT NULL,
    department VARCHAR(128) NOT NULL,
    location VARCHAR(128) NOT NULL,
    date_of_joining DATE NOT NULL,
    bank_account_ref VARCHAR(64),
    bank_name VARCHAR(128),
    ifsc_code VARCHAR(32),
    pan_number VARCHAR(32),
    uan_number VARCHAR(32),
    pay_period VARCHAR(128) NOT NULL,
    disbursement_date DATE NOT NULL,
    base_salary NUMERIC(15, 2) NOT NULL,
    hra NUMERIC(15, 2) NOT NULL,
    transport_allowance NUMERIC(15, 2) NOT NULL,
    special_allowance NUMERIC(15, 2) NOT NULL,
    bonus NUMERIC(15, 2) DEFAULT 0.00,
    overtime_pay NUMERIC(15, 2) DEFAULT 0.00,
    gross_earnings NUMERIC(15, 2) NOT NULL,
    provident_fund NUMERIC(15, 2) NOT NULL,
    professional_tax NUMERIC(15, 2) NOT NULL,
    income_tax_tds NUMERIC(15, 2) NOT NULL,
    total_deductions NUMERIC(15, 2) NOT NULL,
    net_payable NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_payslip_run_emp UNIQUE (payroll_run_id, employee_id)
);

-- 6. Governance Approvals & Multi-step Routing
CREATE TABLE IF NOT EXISTS approval_items (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    requester_name VARCHAR(128) NOT NULL,
    requester_role VARCHAR(128) NOT NULL,
    requester_avatar TEXT,
    amount_formatted VARCHAR(64),
    days_formatted VARCHAR(64),
    sla_risk_text VARCHAR(64),
    sla_due_minutes INT,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approval_steps (
    id VARCHAR(64) PRIMARY KEY,
    approval_item_id VARCHAR(64) NOT NULL REFERENCES approval_items(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    approver_role VARCHAR(64) NOT NULL,
    approver_name VARCHAR(128),
    action VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    comments TEXT,
    timestamp TIMESTAMP WITH TIME ZONE
);

-- 7. Audit Trail & Notifications (Append-Only)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(64) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(128) NOT NULL,
    details TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    source VARCHAR(64) NOT NULL DEFAULT 'WEB_PORTAL',
    result VARCHAR(32) NOT NULL DEFAULT 'SUCCESS'
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id),
    type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
