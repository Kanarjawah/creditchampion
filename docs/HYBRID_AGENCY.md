# Credit Champion hybrid agency and SaaS

## Product position

One brand with three client-facing service paths: personal credit, business credit and tax. The public release provides education, preparation, research and planning. A separate professional/agency experience explains the shared operating model. The existing workspace remains available through `#overview`.

The homepage uses an original conversion structure informed by the named reference sites: a clear hero, primary starting-path CTA, alternative demo CTA, separate audience paths, workflow preview, process explanation, transparent reviews and FAQs. Credit Repair Cloud is a design/operating-model reference, not an affiliation, licensed template or copied implementation.

| Reference consulted November 14, 2026 | Observed pattern | Credit Champion implementation |
| :--- | :--- | :--- |
| Credit Repair Cloud | Agency software, audience segmentation, demo/trial navigation, workflow presentation | Original marketing site, professional page and working demo entry |
| eCredable | Separate personal/business bill-reporting journeys | Separate paths and an independent reporting-research link; no native reporting connection |
| Credit Suite | Business credit and funding preparation | Business preparation checklist, provider directory and vehicle/cash-flow planning |
| The Credit Pros | Distinct review/build paths and goal-oriented education | Personal-credit path, factual issue review and a starting-path questionnaire |
| Credit Saint | Visible process, package/service explanations, reviews and FAQs | Process page, service-scope explanations, genuine-review component and FAQs |

Official reference URLs: https://www.creditrepaircloud.com/ ; https://ecredable.com/ ; https://www.creditsuite.com/ ; https://thecreditpros.com/ ; https://www.creditsaint.com/ . Reference claims, ratings, pricing, logos, customer quotes and performance statistics are not copied or represented as Credit Champion's.

## Design

Deep emerald #08664f, forest #063d32, navy #102b36, warm white #faf9f4 and restrained gold #edc66e. The palette supports a calm financial-services identity. Locally hosted original WebP imagery is used on the homepage and service pages. The image captions disclose that these are AI-generated illustrations, not customer testimonials, real staff or licensed-professional portraits.

## New available public journeys

- `#home`: public marketing homepage.
- `#personal-services`, `#business-services`, `#tax-services`: separate paths with clear scope.
- `#professionals`: hybrid agency/SaaS explanation and demo entry.
- `#how-it-works`: preparation process.
- `#start` and service-specific starting routes: no-PII questionnaire, next-step checklist and downloadable text plan.
- `#reviews`: public genuine-feedback summary and policy. Empty until approved feedback exists.
- Business preparation check: six record/readiness areas; no creditworthiness or approval score.

## Backend additions

Migration 002 adds tenant/owner-scoped service preparation requests and consented reviews. Account routes remain behind existing account configuration, authentication, MFA and origin validation. Service requests do not initiate financial services or filings. Request creation/status changes and review submissions/moderation/withdrawals record audit metadata in the same PostgreSQL statement as the mutation.

Reviews accept 1 to 5 stars with equal rules. No reviews or ratings are seeded. Public output includes only published, consented fields; it excludes tenant IDs, user IDs and private identity data. One review per customer account. Staff cannot submit customer reviews or approve their own feedback. Moderation is tenant-scoped and records a reason for rejection. Reviewer consent can be withdrawn, removing the review from public output. No verified-purchase badge or external Google/Trustpilot connection is asserted.

FTC review-policy reference: https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers . This engineering policy is not a complete legal compliance determination.

## Activation boundaries

Private accounts, service requests and review collection remain inactive on the public host until PostgreSQL migrations and secure account configuration are provisioned. No real financial/tax documents, lending decisions, credit pulls, billing, dispute dispatch or filing services are enabled. Agency operator onboarding, client assignment, billing, integrations and professional/compliance activation remain production work.
