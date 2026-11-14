# Champion Funding Marketplace — implementation plan

## Included now
- Pure TypeScript preliminary matching engine
- Synthetic tests for mismatch, missing information and possible matches
- Small curated source directory for SBA and CDFI discovery
- Explicit warnings that matching is not underwriting or approval

## Not yet included
- Real-time bank product catalogs or affiliate agreements
- Consumer report ingestion, soft-pull APIs or credit score access
- Nationwide bank and credit union ETL, live grant listings, or geographic verification
- Customer identity verification, consent, lender application submission or protected data storage
- Paid subscriptions, offers, or lender referral tracking

## Compliance gates
- Verify every lender and product source, effective date, rates, reporting policies, eligibility and state restrictions
- Disclose referral compensation and avoid discriminatory eligibility or misleading approvals
- Do not collect SSNs, DOB, bank credentials or credit reports through demo endpoints
- Do not claim credit score improvements, immediate deletions or guaranteed funding
- Consult legal counsel on FCRA, ECOA, GLBA, CROA, state lending and referral rules before production
