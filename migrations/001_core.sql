CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS tenants (id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id), email_lookup text NOT NULL UNIQUE,
 email_cipher text NOT NULL, password_hash text NOT NULL,
 role text NOT NULL DEFAULT 'individual_customer' CHECK (role IN ('super_admin','compliance_admin','credit_specialist','agency_owner','agency_employee','individual_customer','business_customer','support')),
 mfa_cipher text, mfa_enabled boolean NOT NULL DEFAULT false, mfa_last_counter bigint NOT NULL DEFAULT -1,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (id, tenant_id)
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 mfa_verified boolean NOT NULL DEFAULT false, expires_at timestamptz NOT NULL,
 last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cases (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id), owner_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'needs_evidence' CHECK (status IN ('needs_evidence','awaiting_approval','awaiting_compliance_review','closed')),
 category text NOT NULL CHECK (category IN ('late_payment','collection','charge_off','repossession','bankruptcy','inquiry','identity','other')),
 evidence_reviewed boolean NOT NULL DEFAULT false, customer_approved boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (owner_id, tenant_id) REFERENCES users(id, tenant_id)
);
CREATE TABLE IF NOT EXISTS audit_events (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id), actor_id uuid NOT NULL REFERENCES users(id),
 action text NOT NULL, resource_id uuid, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS cases_tenant_owner ON cases (tenant_id,owner_id);
CREATE INDEX IF NOT EXISTS audit_tenant ON audit_events (tenant_id,created_at);
INSERT INTO schema_migrations (version) VALUES (1) ON CONFLICT DO NOTHING;
