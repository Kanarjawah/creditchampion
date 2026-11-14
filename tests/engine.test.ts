import test from 'node:test';
import assert from 'node:assert/strict';
import {canSubmit,plan90Days,type Case} from '../src/engine.js';
const base:Case={id:'1',customerId:'demo',status:'ready_to_send',consent:true,approved:true,legalRuleVerified:true,findings:[{id:'f',category:'balance',description:'Potential balance error',evidence:['statement.pdf'],verified:true}]};
test('approved supported case can progress to controlled submission',()=>assert.equal(canSubmit(base).allowed,true));
test('missing consent blocks submission',()=>assert.equal(canSubmit({...base,consent:false}).allowed,false));
test('missing evidence blocks submission',()=>assert.equal(canSubmit({...base,findings:[{...base.findings[0],evidence:[]}]}).allowed,false));
test('duplicate delivery blocks submission',()=>assert.equal(canSubmit({...base,delivery:{tracking:'test',sentAt:'2026-11-13'}}).allowed,false));
test('90 day plan boundaries',()=>{assert.equal(plan90Days(1).phase,'Onboarding and analysis');assert.equal(plan90Days(90).phase,'Review and long-term improvement');assert.throws(()=>plan90Days(91))});
