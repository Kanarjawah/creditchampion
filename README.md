# Credit Champion

Credit Champion is a compliance-first credit health and dispute-workflow prototype.

Status: demonstration only. The application uses synthetic inputs and must not be used to process live credit reports, submit disputes, collect regulated fees, or promise score increases.

## Start

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Test

```sh
npm test
```

## Demo routes

- `GET /health` — service health
- `GET /api/demo/plan/1` — illustrative 90-day plan
- `POST /api/demo/dispute/check` — safety gating for a supplied synthetic dispute case

## Launch gates

Production deployment requires secure user authentication, isolated tenant storage, customer consent, verified jurisdictional legal requirements, provider agreements, security assessment, and reviewed correspondence workflows. No real credit data ingestion or outbound dispute submission is implemented.

Build with `npm run build`, then run the compiled server with `npm start`.

See `DEPLOYMENT.md` for Hostinger settings and `docs/STAGING_STATUS.md` for verified implementation status and hosting blockers.
