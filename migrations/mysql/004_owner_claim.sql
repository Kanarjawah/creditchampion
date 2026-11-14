CREATE TABLE IF NOT EXISTS owner_bootstrap (
 id char(36) PRIMARY KEY, owner_id char(36), claimed_at datetime(3), FOREIGN KEY(owner_id) REFERENCES users(id)
);
INSERT IGNORE INTO owner_bootstrap(id) VALUES('00000000-0000-4000-8000-000000000001');
INSERT IGNORE INTO schema_migrations(version) VALUES(4);
