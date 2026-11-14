import test from 'node:test';
import assert from 'node:assert/strict';
import {matchFunding,type FundingProduct} from '../src/funding.js';
const product:FundingProduct={id:'demo',institution:'Demo Bank',name:'Demo business line',kind:'business_line',officialUrl:'https://example.org',minimumScore:680,minimumAnnualRevenue:100000,verifiedAt:'2099-01-01',sourceNote:'Synthetic test data'};
test('rejects a mismatch without claiming approval',()=>{const x=matchFunding({purpose:'business',state:'AZ',creditScore:620,annualRevenue:120000},[product]);assert.equal(x[0].status,'does_not_match')});
test('requests missing information',()=>{const x=matchFunding({purpose:'business',state:'AZ'},[product]);assert.equal(x[0].status,'needs_review')});
test('preliminary match is not an approval',()=>{const x=matchFunding({purpose:'business',state:'AZ',creditScore:710,annualRevenue:150000},[product]);assert.equal(x[0].status,'possible');assert.match(x[0].reasons[0],/lender makes final decision/)});
