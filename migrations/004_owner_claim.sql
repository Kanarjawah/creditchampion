CREATE TABLE IF NOT EXISTS owner_bootstrap (
 id uuid PRIMARY KEY, owner_id uuid REFERENCES users(id), claimed_at timestamptz
);
INSERT INTO owner_bootstrap(id) VALUES('00000000-0000-4000-8000-000000000001') ON CONFLICT DO NOTHING;
INSERT INTO schema_migrations(version) VALUES(4) ON CONFLICT DO NOTHING;
