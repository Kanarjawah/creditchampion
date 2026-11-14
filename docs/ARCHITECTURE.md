# Credit Champion v0.3 architecture

The existing Express/TypeScript application is retained and upgraded to Express 5 for promise-aware error handling. A responsive HTML/CSS/JavaScript application uses same-origin JSON endpoints. No external scripts, fonts, trackers or advertising SDKs load in the app.

## Available in public synthetic staging

- Overview, credit education, report-issue triage and a 90-day planner.
- A curated directory of 15 products, programs and discovery sources; incomplete eligibility is always flagged for provider review. This is not a comprehensive institution database, live loan feed or grant inventory.
- Business vehicle preparation and quoted-rate loan cost calculation, cash coverage, credit utilization and mileage-share calculations.
- Twelve sourced guides covering credit building, accurate versus erroneous negatives, repossession, business credit, vehicle financing, funding, grants, Chapters 7/13, filing preparation and tax records.
- Agency workflow preview using synthetic in-memory examples. Browser checklist ticks use sessionStorage only.
- An explicit capability and compliance-gate registry. No production compliance claim.

## Private account backend

`src/accounts.ts`, `src/store.ts`, `src/crypto.ts`, `migrations/001_core.sql` implement:

- Invitation-only synthetic staging registration, individual/business customer roles only. No role may be chosen by a client.
- Scrypt password hashes, encrypted email and MFA secrets with AES-256-GCM; keyed email lookups. Encryption keys must be provisioned outside source control.
- Opaque random session cookies; only SHA-256 hashes in PostgreSQL. HttpOnly, SameSite=Strict and Secure in production. Pending sessions last ten minutes; verified sessions last eight hours with a thirty-minute inactivity boundary.
- TOTP enrollment and verification with time-step replay prevention. MFA required for case/audit access.
- Origin validation on account mutations, rate limits and input validation. Reverse-proxy trust is not guessed; production per-user limit behavior must be verified with Hostinger before scale.
- All case reads/updates include tenant scope, plus owner/staff checks. Support cannot read other users' cases. Super-admin remains tenant-scoped in this release. No public role promotion or cross-tenant administration endpoint exists.
- Categories and workflow flags only. Evidence upload/review contents, customer reports, bank data and real tax records are not ingested.
- Audit metadata records, no passwords or request-body logging.

Accounts return 503 unless the private staging configuration and database are supplied. No database is created as part of a source deployment. The embedded PostgreSQL engine used by tests is not the hosting database.

## Material limits

No email verification, automated password/MFA recovery, agency onboarding/invitations, production profiles, document vault, transactional outbox, immutable off-host audit sink, production billing, provider AI, bureau connector, postal dispatch, notification delivery, tax preparation, bankruptcy petition generation or filing is enabled. Audit writes and state updates are separate operations in this first backend; production requires atomic event recording and least-privilege database enforcement. There is no automatic compliance approval or real submission state.

## Reliability

`/health` checks the synthetic app; `/ready` checks database connectivity when private accounts are configured. A scheduled GitHub workflow observes HTTPS endpoints approximately every 15 minutes, subject to GitHub scheduling and workflow availability. Hosted execution must be verified separately. It is a coarse observation, not a 99.9% uptime measurement or SLA.

The single staging instance has no failover or verified backup/restore path. Before production: define SLIs/SLOs, configure independent frequent monitoring and approved alert routing, measure error rates/latency, load-test, run restore exercises, document RPO/RTO and provision an appropriate redundant architecture.
