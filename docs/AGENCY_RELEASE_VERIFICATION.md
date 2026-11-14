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

## Final deployed state

Verified November 14, 2026 at approximately 8:53 AM America/Phoenix.

- Deployed source: 43a9baeb2d2305c150d43b92dc202b83cd16aacf.
- Hostinger build: 01a1dac1-342a-7101-bc31-846790d4f092, Completed/current.
- Application: 0.5.0, native Hostinger MySQL connected and schema initialized.
- Final CI: https://github.com/Kanarjawah/creditchampion/actions/runs/43612261981 , completed successfully with MySQL 8.0 and all 27 tests.
- Final live smoke: all 17 expected HTTP statuses passed. Readiness was 200; unauthenticated private cases, account and operations routes returned 401.
- Runtime logs confirmed migrations and listener startup, with no remaining proxy-header validation error or startup failure in the current deployment.
- Browser confirmed owner registration/sign-in forms, public agency operations and activation pages, and closed consultation collection. At 390 by 844, document width was 375 with no horizontal document overflow; mobile Consultation navigation worked.
- Private UI workflows were validated by repository/API tests. The live first-owner claim was intentionally left for the user to set their own password and authenticator.
- No external database subscription, default administrator password, sample customer review, live charge, tax transmission or native credit-reporting connection was created.
