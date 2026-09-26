-- ====================================================================
-- WorkSphere Enterprise HCM: V5 Flyway Migration
-- Organization Entity & Multi-Tenancy Association
-- ====================================================================

-- 1. Organization Entity
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    organization_code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    industry VARCHAR(128),
    country VARCHAR(64) NOT NULL,
    timezone VARCHAR(64) NOT NULL,
    primary_email VARCHAR(255) NOT NULL,
    phone VARCHAR(64),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(128),
    state VARCHAR(128),
    postal_code VARCHAR(32),
    website VARCHAR(255),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    version BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for case-insensitive code lookups
CREATE INDEX IF NOT EXISTS idx_organizations_code ON organizations(organization_code);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

-- 2. Associate Organization Context With Business Entities
ALTER TABLE departments ADD COLUMN IF NOT EXISTS organization_id VARCHAR(64) REFERENCES organizations(id);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS organization_id VARCHAR(64) REFERENCES organizations(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS organization_id VARCHAR(64) REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id VARCHAR(64) REFERENCES organizations(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organization_id VARCHAR(64) REFERENCES organizations(id);

CREATE INDEX IF NOT EXISTS idx_departments_org_id ON departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_locations_org_id ON locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_org_id ON employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id);

COMMENT ON TABLE organizations IS 'Enterprise root tenant entity representing legal employer and payroll entity';
