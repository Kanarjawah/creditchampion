# Credit Champion

Credit education, business funding discovery and financial planning workspace. This repository deploys to an isolated Hostinger staging app, using synthetic data only.

## Run locally

Use Node.js 22 (or supported Node 24):

```sh
npm ci
npm run typecheck
npm test
npm run build
npm start
```

Open http://localhost:3000. The runtime entry is `dist/server.js`; public assets are served from the committed `public/` directory. No database is required for education and calculators.

## Modules

- Credit education, evidence-first issue review and 90-day plans.
- Funding directory and preliminary criteria research, including business vehicle providers and personal credit-line discovery.
- Loan cost, utilization, cash coverage and business-mileage-share planners.
- Bankruptcy Chapters 7/13 comparison and preparation steps; tax recordkeeping and business-vehicle education.
- Synthetic agency workflow preview and transparent capability status.
- Gated PostgreSQL accounts, MFA, sessions, scoped cases and audit metadata.

No real credit reports, uploads, payments, tax or bankruptcy filings, outbound disputes, lender applications or AI provider are enabled. Accurate negative credit history cannot be promised away. Business-name vehicle financing can still create personal liability.

## Operations and next steps

- [Deployment](DEPLOYMENT.md)
- [Architecture and limitations](docs/ARCHITECTURE.md)
- [Staging status](docs/STAGING_STATUS.md)
- [Production activation gates](docs/PRODUCTION_GATES.md)
- [Editorial sources](docs/CONTENT_SOURCES.md)

Private account configuration is documented in `.env.example`. Never commit actual credentials. A 99.9% availability target requires independent monitoring, measurement, resilience and recovery work; this single staging instance carries no such guarantee.
