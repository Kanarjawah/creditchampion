# Credit Champion agency operations

Release 0.5.0 implements the six workstreams as protected application workflows. Hostinger native MySQL is supported in addition to the previous PostgreSQL implementation. No external database subscription is required for this release.

## Implemented workflows

1. Accounts: existing password hashing, encrypted email and authenticator MFA, plus expiring one-use invitations bound to a recipient email and fixed role. Operators can invite staff and clients into the same isolated agency. No public role promotion or default administrator password exists.
2. Agency dashboard: tenant/owner/assignment scoped requests, staff assignment, task tracking, future 30-minute slots, atomic booking and cancellation.
3. Documents: encrypted database storage outside public assets, PDF/PNG/JPEG signature checks, 1 MB per record, 50 per client, malware-scan requirement, audited downloads, owner deletion, 30-day expiry and cleanup worker. Uploads fail closed without an operational private ClamAV socket. Retention cleanup must be scheduled; expiry denies access even before deletion runs.
4. Packages and billing: operator-authored draft packages, manager attestation before publishing, full agreement text and immutable SHA-256 version at acceptance, customer cancellation and invoice preparation. Personal credit invoices are held for legal review. All online payment collection remains disabled. These controls are not a legal compliance determination or payment processor approval.
5. Providers: official enrollment requirements and an audited internal setup-request workflow. No consumer reporting, eCredable or tax-filing API is falsely represented as connected. Provider enrollment, agreements and credentials remain necessary. SMTP and optional Resend sender adapters and private ClamAV integration are implemented.
6. Acquisition: agency-scoped contact requests, encrypted contact data, optional marketing consent, CRM stages, one acknowledgement and an optional follow-up queue, scoped worker, unsubscribe cancellation and duplicate-request suppression. No email is sent without configured sender credentials and explicit worker activation.

## Hostinger configuration

Use this project's isolated MySQL database only. The application connection host is `127.0.0.1`; remote database hosts require verified TLS. Set `DATABASE_URL` using the private Hostinger environment editor. Do not commit credentials. Migrations live under `migrations/mysql/`; `DB_MIGRATE_ON_START=true` applies them at startup. PostgreSQL migrations remain supported under `migrations/`.

Private staging activation additionally needs `ACCOUNT_MODE=private_staging`, `APP_ORIGIN`, `DATA_ENCRYPTION_KEY` (32 random bytes, base64), `STAGING_REGISTRATION_CODE`, and `PUBLIC_AGENCY_TENANT_ID`. The staging code must be delivered privately by an operator. With `BOOTSTRAP_OWNER_ENABLED=true`, the first registration using the private staging registration code atomically claims the owner role. The owner must set their own password and enroll MFA. Later registrations require recipient-bound invitations. No owner password is created by deployment. Alternatively, after identity verification use the server-only `npm run operator:promote USER_ID verified-owner` command. Client/staff invitations then keep new accounts in the agency tenant.

Hostinger email can use `SMTP_HOST=smtp.hostinger.com`, port 465 with TLS, a mailbox username/password, `MAIL_FROM` and a real `MAIL_POSTAL_ADDRESS`. Keep `EMAIL_WORKER_ENABLED=false` until sender verification and the operator's consent/template review. Run `npm run worker:once` from an approved scheduler to deliver due messages and delete expired records. Failed or interrupted deliveries need operator review; SMTP cannot guarantee exactly-once delivery after a process crash.

## Current release boundaries

This remains private staging and public education/planning. Real document intake awaits scanner and operational readiness. No native credit pulls, bill reporting, tax transmission, bankruptcy filing or online charge is enabled. External providers cannot be activated merely by recording an internal request. Agreements must be supplied and reviewed by the business; no generic agreement is presented as legally sufficient.

## Sources reviewed November 14, 2026

- Hostinger MySQL for Node: https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/
- Hostinger database support: https://www.hostinger.com/support/which-databases-and-data-tools-are-supported-at-hostinger/
- Hostinger SMTP: https://www.hostinger.com/support/1575756-how-to-get-email-account-configuration-details-for-hostinger-email/
- ClamAV protocol: https://docs.clamav.net/manual/Usage/ClamdProtocol.html
- Stripe restricted businesses: https://stripe.com/legal/restricted-businesses
- CFPB credit services and fees: https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-credit-counseling-and-debt-settlement-debt-consolidation-or-credit-repair-en-1449/
- IRS e-file enrollment: https://www.irs.gov/e-file-providers/become-an-authorized-e-file-provider
