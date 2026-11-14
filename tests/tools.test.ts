import test from 'node:test';
import assert from 'node:assert/strict';
import {loanEstimate,utilization,cashflow,reviewIssue} from '../src/tools.js';
import {matchFunding,type FundingProduct} from '../src/funding.js';
import {fundingProducts} from '../src/funding-data.js';
import {guides,sources} from '../src/knowledge.js';
test('fixed-rate loan math and zero-rate boundaries',()=>{
 assert.equal(loanEstimate({price:12000,fees:0,downPayment:0,annualRate:0,months:12}).monthlyPayment,1000);
 const x=loanEstimate({price:35000,fees:2500,downPayment:7500,annualRate:9,months:60});
 assert.equal(x.principal,30000);assert.equal(x.monthlyPayment,622.75);
 assert.throws(()=>loanEstimate({price:100,fees:0,downPayment:101,annualRate:5,months:12}));
 assert.throws(()=>loanEstimate({price:100,fees:0,downPayment:0,annualRate:-1,months:12}));
});
test('utilization can exceed limit, target paydown never negative',()=>{
 assert.deepEqual(utilization({balance:6000,limit:5000,targetPercent:10}).paydown,5500);
 assert.equal(utilization({balance:100,limit:5000,targetPercent:10}).paydown,0);
 assert.throws(()=>utilization({balance:100,limit:0,targetPercent:10}));
});
test('cashflow returns shortfall and avoids divide-by-zero',()=>{
 assert.equal(cashflow({monthlyCashAvailable:100,existingDebtPayments:150,newDebtPayment:50}).remaining,-100);
 assert.equal(cashflow({monthlyCashAvailable:100,existingDebtPayments:0,newDebtPayment:0}).coverage,null);
});
test('accurate negatives and unsupported identity theft cannot become dispute drafts',()=>{
 for(const category of ['late_payment','repossession','collection'] as const){const x=reviewIssue({category,basis:'accurate',hasEvidence:true,identityTheftConfirmed:false});assert.equal(x.status,'education_only');assert.equal(x.canSubmit,false);}
 assert.equal(reviewIssue({category:'identity',basis:'identity_theft',hasEvidence:true,identityTheftConfirmed:false}).status,'research_needed');
 assert.equal(reviewIssue({category:'late_payment',basis:'inaccurate',hasEvidence:true,identityTheftConfirmed:false}).status,'draft_review');
});
test('directories and incomplete underwriting never become preliminary product matches',()=>{
 for(const entry of fundingProducts){const x=matchFunding({purpose:entry.kind.startsWith('personal_')?'personal':'business',state:'AZ',creditScore:800,annualRevenue:1e6,yearsBusiness:10},[entry])[0];assert.equal(x.status,'needs_review');}
 const p:FundingProduct={id:'expired',name:'Expired test',institution:'Test',kind:'grant',officialUrl:'https://example.org',verifiedAt:'2026-11-13',expiresAt:'2026-11-01',sourceNote:'Synthetic fixture'};
 assert.equal(matchFunding({purpose:'business',state:'AZ'},[p],new Date('2026-11-14'))[0].status,'does_not_match');
});
test('every guide has accountable official sources and source-review metadata',()=>{
 assert.ok(guides.length>=12);for(const g of guides){assert.ok(g.steps.length);assert.ok(g.risks.length);assert.ok(g.reviewedAt);for(const id of g.sources){const s=sources[id as keyof typeof sources];assert.ok(s);assert.ok(s.url.startsWith('https://'));}}
});
