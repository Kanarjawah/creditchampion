CREATE TABLE IF NOT EXISTS service_requests (
 id char(36) PRIMARY KEY, tenant_id char(36) NOT NULL REFERENCES tenants(id), owner_id char(36) NOT NULL,
 service varchar(255) NOT NULL CHECK (service IN ('personal','business','tax')),
 goal varchar(255) NOT NULL CHECK (goal IN ('understand_credit','review_errors','build_business','prepare_funding','business_vehicle','organize_taxes','vehicle_records')),
 status varchar(255) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','needs_documents','in_review','ready_for_consultation','closed')),
 created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY (owner_id,tenant_id) REFERENCES users(id,tenant_id)
);
CREATE INDEX service_requests_scope ON service_requests(tenant_id,owner_id);
CREATE TABLE IF NOT EXISTS reviews (
 id char(36) PRIMARY KEY, tenant_id char(36) NOT NULL REFERENCES tenants(id), owner_id char(36) NOT NULL UNIQUE,
 display_name varchar(255) NOT NULL, rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
 service varchar(255) NOT NULL CHECK (service IN ('personal','business','tax','platform')),
 body text NOT NULL, publication_consent boolean NOT NULL DEFAULT false,
 status varchar(255) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','rejected','withdrawn')),
 moderation_reason varchar(255), moderated_by char(36) REFERENCES users(id), published_at datetime(3),
 created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY (owner_id,tenant_id) REFERENCES users(id,tenant_id)
);
CREATE INDEX public_reviews ON reviews(status,publication_consent,published_at);


INSERT IGNORE INTO schema_migrations(version) VALUES(2);
