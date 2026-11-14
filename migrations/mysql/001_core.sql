CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3));
CREATE TABLE IF NOT EXISTS tenants (id char(36) PRIMARY KEY, created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3));
CREATE TABLE IF NOT EXISTS users (
 id char(36) PRIMARY KEY, tenant_id char(36) NOT NULL REFERENCES tenants(id), email_lookup varchar(64) NOT NULL UNIQUE,
 email_cipher text NOT NULL, password_hash text NOT NULL,
 role varchar(255) NOT NULL DEFAULT 'individual_customer' CHECK (role IN ('super_admin','compliance_admin','credit_specialist','agency_owner','agency_employee','individual_customer','business_customer','support')),
 mfa_cipher text, mfa_enabled boolean NOT NULL DEFAULT false, mfa_last_counter bigint NOT NULL DEFAULT -1,
 created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), UNIQUE (id, tenant_id)
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash varchar(64) PRIMARY KEY, user_id char(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 mfa_verified boolean NOT NULL DEFAULT false, expires_at datetime(3) NOT NULL,
 last_seen_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);
CREATE TABLE IF NOT EXISTS cases (
 id char(36) PRIMARY KEY, tenant_id char(36) NOT NULL REFERENCES tenants(id), owner_id char(36) NOT NULL,
 status varchar(255) NOT NULL DEFAULT 'needs_evidence' CHECK (status IN ('needs_evidence','awaiting_approval','awaiting_compliance_review','closed')),
 category varchar(255) NOT NULL CHECK (category IN ('late_payment','collection','charge_off','repossession','bankruptcy','inquiry','identity','other')),
 evidence_reviewed boolean NOT NULL DEFAULT false, customer_approved boolean NOT NULL DEFAULT false,
 created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY (owner_id, tenant_id) REFERENCES users(id, tenant_id)
);
CREATE TABLE IF NOT EXISTS audit_events (
 id char(36) PRIMARY KEY, tenant_id char(36) NOT NULL REFERENCES tenants(id), actor_id char(36) NOT NULL REFERENCES users(id),
 action varchar(255) NOT NULL, resource_id char(36), created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);
CREATE INDEX sessions_expiry ON sessions (expires_at);
CREATE INDEX cases_tenant_owner ON cases (tenant_id,owner_id);
CREATE INDEX audit_tenant ON audit_events (tenant_id,created_at);


INSERT IGNORE INTO schema_migrations (version) VALUES (1);
