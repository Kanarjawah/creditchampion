# Agency release verification

Release 0.5.0, November 14, 2026.

## Infrastructure decision

Use the existing Hostinger plan and a newly isolated MySQL database assigned to Credit Champion. Supabase is not required or connected. The existing PostgreSQL repositories were adapted with parameter-bound MySQL support and transaction-aware mutation/audit handling. MySQL database credentials and application encryption/setup secrets are stored only in the project's Hostinger environment settings, not in Git.

## Validation

- Complete local default suite: 26 passed; the optional real-MySQL test is skipped when no test database is supplied.
- Separate real MariaDB 11.8 run: shared agency test and real MySQL-compatible repository/authentication test both passed.
- GitHub CI now provisions isolated MySQL 8.0, runs migrations and executes all 27 tests.
- Tests cover one-time owner claim, single-use recipient-bound invitations, password sign-in and MFA, scope/role checks, booking conflicts, agreement version acceptance/cancellation, credit-repair invoice hold, encrypted scanned documents, auditable downloads, opt-in follow-ups and unsubscribe suppression.
- TypeScript checks, browser script syntax checks and compilation passed. Dependency audit reported no known vulnerabilities.
- Hostinger's loader requires an ESM graph without top-level await. The initial asynchronous entry was corrected and a CommonJS require-loader regression check was added to CI.

## Operator handoff

The deployment does not set an owner's password or enroll an authenticator for them. The authorized owner retrieves STAGING_REGISTRATION_CODE from this application's private Hostinger environment settings, opens #account, leaves the recipient invitation field blank, enters the code in the operator staging registration field, sets their own password, registers and signs in, then enrolls MFA. The first successful setup-code registration atomically claims the owner role. Later team/client accounts require an owner-issued recipient-bound invitation.

## Remaining connection and production gates

The application workflows are implemented; not every external service is live. Uploads require an operational malware scanner. Public lead capture additionally requires the owner's agency tenant configuration. Email delivery requires the approved mailbox/API credentials, sender identity, postal address, consent review and enabled scheduler. Online payment collection remains disabled pending service-specific legal/processor approval. Consumer reporting, eCredable bill reporting and tax transmission need direct provider enrollment/credentials and further provider-specific integration. No such providers are represented as connected. This release remains private staging and public education/planning.

## Live checks before final review

Native MySQL schema initialization and private staging listener were confirmed in Hostinger runtime logs. External HTTP smoke passed all 17 expected statuses, including readiness 200 and unauthenticated private access 401. Public contact requests remained closed (503), and the activation page correctly displayed MySQL/accounts configured with provider/scanner/payment/email gates closed. The Hostinger production deployment uses the vendor-documented one-proxy-hop setting. The Node port must remain behind the hosting/CDN proxy; IP limits are not an authorization boundary. Local development trusts loopback only.
