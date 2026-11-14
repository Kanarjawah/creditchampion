# Credit Champion deployment checklist

**Demo only. Do not process real credit records.**

1. Verify GitHub repository visibility and make it private before adding sensitive materials.
2. Install Node.js 22, run `npm install`, `npm test` and `npm run typecheck`.
3. Run `npm start` with `PORT` set by the hosting provider.
4. Check `/health` returns `realCreditDataEnabled: false`.
5. Use a staging domain and HTTPS. No real customer data.
6. Inspect Hostinger Web Apps runtime support and deployment integration.
7. Before production: implement persistence, authentication, MFA, tenant isolation, secure secrets, encrypted document storage, state-law review, authorized bureau contracts, consent evidence, audits, and an independent security assessment.
8. Never automatically submit disputed information without genuine evidence, customer authorization, applicable legal checks, and appropriate oversight.

No production-ready Docker image is provided.
