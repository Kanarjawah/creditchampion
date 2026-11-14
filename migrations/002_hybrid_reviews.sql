CREATE TABLE IF NOT EXISTS service_requests (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id), owner_id uuid NOT NULL,
 service text NOT NULL CHECK (service IN ('personal','business','tax')),
 goal text NOT NULL CHECK (goal IN ('understand_credit','review_errors','build_business','prepare_funding','business_vehicle','organize_taxes','vehicle_records')),
 status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','needs_documents','in_review','ready_for_consultation','closed')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (owner_id,tenant_id) REFERENCES users(id,tenant_id)
);
CREATE INDEX IF NOT EXISTS service_requests_scope ON service_requests(tenant_id,owner_id);
CREATE TABLE IF NOT EXISTS reviews (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id), owner_id uuid NOT NULL UNIQUE,
 display_name text NOT NULL, rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
 service text NOT NULL CHECK (service IN ('personal','business','tax','platform')),
 body text NOT NULL, publication_consent boolean NOT NULL DEFAULT false,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','rejected','withdrawn')),
 moderation_reason text, moderated_by uuid REFERENCES users(id), published_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (owner_id,tenant_id) REFERENCES users(id,tenant_id)
);
CREATE INDEX IF NOT EXISTS public_reviews ON reviews(status,publication_consent,published_at);
INSERT INTO schema_migrations(version) VALUES(2) ON CONFLICT DO NOTHING;
