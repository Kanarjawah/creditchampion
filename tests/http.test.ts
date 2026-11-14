import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from '../src/app.js';
import type {AddressInfo} from 'node:net';

test('demo HTTP contract and submission boundary', async()=>{
 const server=app.listen(0,'127.0.0.1');
 await new Promise<void>(resolve=>server.once('listening',resolve));
 const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
 try {
  const health=await fetch(`${base}/health`);
  assert.equal(health.status,200);
  assert.deepEqual(await health.json(),{ok:true,environment:'demo',realCreditDataEnabled:false});
  assert.equal(health.headers.get('x-powered-by'),null);
  assert.equal(health.headers.get('x-content-type-options'),'nosniff');
  assert.equal(health.headers.get('cache-control'),'no-store');
  const home=await fetch(base);
  assert.equal(home.status,200);
  assert.match(await home.text(),/CREDIT CHAMPION/);
  for(const day of [1,7,30,60,90]){
   const response=await fetch(`${base}/api/demo/plan/${day}`);
   assert.equal(response.status,200);
   const plan=await response.json();
   assert.equal(plan.day,day);
   assert.ok(plan.actions.length>0);
  }
  for(const day of ['0','91','1.5','invalid'])assert.equal((await fetch(`${base}/api/demo/plan/${day}`)).status,400);
  const invalid=await fetch(`${base}/api/demo/dispute/check`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  assert.equal(invalid.status,400);
  const malformed=await fetch(`${base}/api/demo/dispute/check`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{"secret":'});
  assert.equal(malformed.status,400);
  assert.deepEqual(await malformed.json(),{error:'Invalid JSON request'});
  const oversized=await fetch(`${base}/api/demo/dispute/check`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'x'.repeat(110000)})});
  assert.equal(oversized.status,413);
  assert.deepEqual(await oversized.json(),{error:'Request too large'});
  assert.equal((await fetch(`${base}/api/disputes/submit`,{method:'POST'})).status,404);
 }finally{
  await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
 }
});
