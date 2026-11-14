# Activation and implementation roadmap

No real consumer, credit, tax or payment data should enter this release.

1. Provision isolated PostgreSQL with verified TLS, least-privilege credentials, network controls, backups and restore testing. Hostinger's built-in MySQL option is not interchangeable with this PostgreSQL schema.
2. Apply `npm run db:migrate` through a controlled deployment process. Supply APP_ORIGIN, DATA_ENCRYPTION_KEY and STAGING_REGISTRATION_CODE through secure environment controls. ACCOUNT_MODE=private_staging permits synthetic invitation-only account tests, not production customer enrollment.
3. Verify hosted registration/login/MFA, session revocation, credential recovery, tenancy, encryption, proxy-aware rate limits and audit operations. Complete email verification, operator provisioning, agency membership and role assignment. Never seed default administrator credentials.
4. Implement protected encrypted storage, file validation and malware scanning, retention/deletion, consent evidence, atomic audit/outbox operations and monitored background workers.
5. Obtain approved report-provider and postal agreements and secrets. Implement controlled authorization and professional review before any outbound action. Obtain separate explicit customer consent for each credit application or inquiry.
6. Complete qualified legal review: CROA, FCRA, FDCPA, GLBA, ECOA, service classification, customer states, registration/bonding, disclosures, cancellation rights and billing restrictions. Registry dates are editorial review dates; unknown effective dates remain null. No automated legal conclusion is made.
7. Tax and bankruptcy modules remain education and preparation checklists. Licensed professional workflows, current forms and local rules must be separately designed before offering regulated preparation or filing services.
8. Verify payments and pricing only after covered-service billing rules are reviewed. No advance credit-repair charges or promises of deletions, approvals or score changes.
9. Integrate an AI provider only after key provisioning, data-processing review, redaction, retrieval citations and safety/accuracy evaluation. Current guides and calculations are deterministic; they are not represented as AI.
10. Add official nationwide institution imports and separately verified, expiring grant opportunity records. Implement source-specific adapters, deduplication, territory, current eligibility and provenance. Current directory entries do not imply every bank or active grant is listed.
11. Complete threat modeling, independent security testing, incident response, high-availability design and reliability measurement before live activation.

## Commercial readiness

The public staging app is a demonstrator, not a paid financial service. Product tiers, subscriptions and agency retainers can be evaluated after legal classification and service costs are established. No guaranteed revenue, approval or credit-score outcomes are presented. Measure activation, completed education/checklists and requested qualified consultations once a lawful lead workflow is available; do not collect live leads in this staging release.
