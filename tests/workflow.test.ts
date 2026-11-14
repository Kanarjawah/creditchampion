import test from 'node:test';
import assert from 'node:assert/strict';
import {advance,scheduledTasks} from '../src/workflow.js';
test('workflow requires ordered approvals',()=>{assert.equal(advance('awaiting_customer_approval','customer_approved'),'awaiting_compliance_review');assert.throws(()=>advance('awaiting_customer_approval','submission_recorded'))});
test('90 day schedule never promises score increase',()=>{assert.equal(scheduledTasks(90).day,90);assert.throws(()=>scheduledTasks(91))});
