CREATE TABLE IF NOT EXISTS agency_invites (
 id char(36) PRIMARY KEY, tenant_id char(36) NOT NULL REFERENCES tenants(id), token_hash varchar(64) NOT NULL UNIQUE,
 email_lookup varchar(64) NOT NULL, role varchar(40) NOT NULL CHECK(role IN ('individual_customer','business_customer','agency_employee','credit_specialist','support')),
 expires_at datetime(3) NOT NULL, used_at datetime(3), created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);
CREATE TABLE IF NOT EXISTS service_assignments (
 request_id char(36) PRIMARY KEY REFERENCES service_requests(id), tenant_id char(36) NOT NULL REFERENCES tenants(id), staff_id char(36) NOT NULL,
 FOREIGN KEY(staff_id,tenant_id) REFERENCES users(id,tenant_id)
);
CREATE TABLE IF NOT EXISTS agency_tasks (
 id char(36) PRIMARY KEY, tenant_id char(36) NOT NULL REFERENCES tenants(id), request_id char(36) NOT NULL REFERENCES service_requests(id),
 title varchar(160) NOT NULL, status varchar(24) NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done')),
 due_at datetime(3), created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);
CREATE TABLE IF NOT EXISTS consultation_slots (
 id char(36) PRIMARY KEY, tenant_id char(36) NOT NULL REFERENCES tenants(id), staff_id char(36) NOT NULL, starts_at datetime(3) NOT NULL,
 owner_id char(36), service varchar(20) NOT NULL CHECK(service IN ('personal','business','tax')), status varchar(20) NOT NULL DEFAULT 'available' CHECK(status IN ('available','booked','cancelled')),
 UNIQUE(staff_id,starts_at), FOREIGN KEY(staff_id,tenant_id) REFERENCES users(id,tenant_id),FOREIGN KEY(owner_id,tenant_id) REFERENCES users(id,tenant_id)
);
CREATE TABLE IF NOT EXISTS service_packages (
 id char(36) PRIMARY KEY, tenant_id char(36) NOT NULL REFERENCES tenants(id), name varchar(100) NOT NULL,
 service varchar(20) NOT NULL CHECK(service IN ('personal','business','tax','software')), price_cents integer NOT NULL CHECK(price_cents>=0),
 description text NOT NULL, agreement text NOT NULL, agreement_hash varchar(64) NOT NULL, published boolean NOT NULL DEFAULT false,
 created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);
CREATE TABLE IF NOT EXISTS engagements (
 id char(36) PRIMARY KEY, tenant_id char(36) NOT NULL REFERENCES tenants(id), request_id char(36) NOT NULL REFERENCES service_requests(id), owner_id char(36) NOT NULL,
 package_id char(36) NOT NULL REFERENCES service_packages(id), agreement_hash varchar(64) NOT NULL, accepted_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), cancelled_at datetime(3),
 UNIQUE(request_id,package_id), FOREIGN KEY(owner_id,tenant_id) REFERENCES users(id,tenant_id)
);
CREATE TABLE IF NOT EXISTS agency_invoices (
 id char(36) PRIMARY KEY, tenant_id char(36) NOT NULL REFERENCES tenants(id), engagement_id char(36) NOT NULL REFERENCES engagements(id),
 amount_cents integer NOT NULL CHECK(amount_cents>0), status varchar(30) NOT NULL CHECK(status IN ('draft','legal_review_required','open','paid','void')),
 completion_reference varchar(100) NOT NULL, payment_reference varchar(100), created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), paid_at datetime(3),
 UNIQUE(engagement_id)
);
CREATE TABLE IF NOT EXISTS vault_documents (
 id char(36) PRIMARY KEY, tenant_id char(36) NOT NULL REFERENCES tenants(id), request_id char(36) NOT NULL REFERENCES service_requests(id), owner_id char(36) NOT NULL,
 kind varchar(30) NOT NULL CHECK(kind IN ('credit_record','business_record','tax_record','other_record')),
 mime varchar(40) NOT NULL, sha256 varchar(64) NOT NULL, byte_length integer NOT NULL CHECK(byte_length>0),
 content_cipher longtext NOT NULL, scan_status varchar(20) NOT NULL CHECK(scan_status='clean'),
 expires_at datetime(3) NOT NULL, created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), FOREIGN KEY(owner_id,tenant_id) REFERENCES users(id,tenant_id)
);
CREATE TABLE IF NOT EXISTS agency_leads (
 id char(36) PRIMARY KEY, tenant_id char(36) NOT NULL REFERENCES tenants(id), email_lookup varchar(64) NOT NULL, email_cipher text NOT NULL, name_cipher text NOT NULL,
 service varchar(20) NOT NULL CHECK(service IN ('personal','business','tax')), marketing_consent boolean NOT NULL DEFAULT false,
 consent_version varchar(40) NOT NULL, unsubscribe_hash varchar(64) NOT NULL UNIQUE,
 status varchar(30) NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','consultation','client','do_not_contact')),
 source varchar(40) NOT NULL, created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), UNIQUE(tenant_id,email_lookup)
);
CREATE TABLE IF NOT EXISTS email_outbox (
 id char(36) PRIMARY KEY, tenant_id char(36) NOT NULL REFERENCES tenants(id), lead_id char(36) NOT NULL REFERENCES agency_leads(id),
 template varchar(30) NOT NULL CHECK(template IN ('requested_contact','follow_up')),
 status varchar(20) NOT NULL DEFAULT 'ready' CHECK(status IN ('ready','sending','sent','failed','cancelled')),
 due_at datetime(3) NOT NULL, attempts integer NOT NULL DEFAULT 0, lease_at datetime(3), sent_at datetime(3), UNIQUE(lead_id,template)
);
CREATE INDEX agency_tasks_scope ON agency_tasks(tenant_id,request_id,status);
CREATE INDEX vault_expiry ON vault_documents(expires_at);
CREATE INDEX outbox_due ON email_outbox(status,due_at);

CREATE TABLE IF NOT EXISTS integration_requests (
 id char(36) PRIMARY KEY, tenant_id char(36) NOT NULL REFERENCES tenants(id), provider_id varchar(40) NOT NULL,
 purpose varchar(30) NOT NULL, status varchar(30) NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','in_review','closed')),
 created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);

INSERT IGNORE INTO schema_migrations(version) VALUES(3);
