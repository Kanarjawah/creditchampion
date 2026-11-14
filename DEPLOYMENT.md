# Credit Champion staging deployment

This release is a synthetic-data demonstration. Real credit processing, registration, uploads, paid subscriptions, and outbound submissions are not implemented or enabled.

## Build and run

Use Node.js 22 and the committed lockfile. Install development dependencies during the build because TypeScript is a build tool.

1. Install: `npm ci`
2. Validate: `npm run typecheck` and `npm test`
3. Build: `npm run build`
4. Audit: `npm audit`
5. Start: `npm start`

The runtime starts compiled JavaScript at `dist/server.js` and binds to `0.0.0.0` using the hosting provider's `PORT`, defaulting to 3000. Development uses `npm run dev`. The compiled runtime does not require tsx or TypeScript. SIGTERM and SIGINT close the listener gracefully.

## Hostinger target

Create a separate Node.js staging application from `Kanarjawah/creditchampion`, branch `main`, using an included free staging subdomain. Do not reuse an existing website or purchase a service.

| Setting | Value |
| :--- | :--- |
| Runtime | Node.js 22 |
| Install | npm ci |
| Build | npm run typecheck && npm test && npm run build |
| Start | npm start |
| Compiled entry | dist/server.js |
| Environment | NODE_ENV=production |
| Port | Provider-assigned PORT |
| Database | None required for this demo |

Confirm the plan supports an Express Node.js server. If it does not, do not replace the application with a static export. Verify supported start-command and entry-file settings in hPanel before starting the build.

Do not add production credentials. Database, billing, and credit integrations are absent. Do not set feature flags suggesting those integrations are enabled.

## Acceptance checks

Use HTTPS and verify actual Credit Champion content, rather than relying only on HTTP 200.

1. `/` returns the Credit Champion demonstration and its synthetic-data disclosure.
2. `/health` returns `ok: true`, `environment: demo`, and `realCreditDataEnabled: false`.
3. `/api/demo/plan/1` and `/api/demo/plan/90` return phases and tasks.
4. `/api/demo/plan/91` returns HTTP 400.
5. POST `/api/demo/dispute/check` with an invalid object returns HTTP 400.
6. No live submission endpoint exists.

Record the actual staging URL, deployed commit, build logs, HTTPS result, and acceptance results. Only then configure redeployment on pushes using the same settings. Never record a guessed URL as a deployment result.

## Production gates

Before real customers: implement authentication and MFA, database migrations, tenant isolation, protected storage, consent evidence, audit records, rate limits, monitored jobs, backup and restore, provider agreements, reviewed jurisdiction rules, billing controls, and independent security testing. A dependency audit and demo HTTP tests do not establish production readiness.

## v0.3 hosting notes

The source archive includes the `public/`, `migrations/` and `scripts/` directories. Keep the Express entry file as `dist/server.js`; default detection may incorrectly choose `server.js`. Set `NPM_CONFIG_INCLUDE=dev` along with `NODE_ENV=production` so the build can run TypeScript. Do not set PORT manually.

Hostinger's current archive flow runs npm install and npm run build. Full tests and audit run locally and in the repository validation workflow; do not claim the hosted build executes the test suite unless logs show that.

No PostgreSQL database or private-account secrets are provisioned by this deployment. Keep ACCOUNT_MODE unset. Verify `/api/platform` reports version 0.3.0, accountsConfigured=false, liveCredit=false and taxFiling=false. `node scripts/smoke.mjs` checks the expected public staging boundaries.

The scheduled repository observation workflow has no custom message destination and is not a substitute for independent uptime monitoring. Check hosted workflow execution before reporting it operational.
