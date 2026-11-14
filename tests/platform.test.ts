import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/app.js';
import type {AddressInfo} from 'node:net';
test('platform APIs validate input, expose capability boundaries and fail closed',async()=>{
 const server=createApp().listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
 try{
  const platform=await (await fetch(base+'/api/platform')).json();assert.equal(platform.accountsConfigured,false);assert.equal(platform.features.taxFiling,false);assert.equal(platform.features.liveCredit,false);
  assert.equal((await fetch(base+'/api/account/cases')).status,503);
  const home=await fetch(base);assert.match(home.headers.get('content-security-policy')||'',/script-src 'self'/);assert.doesNotMatch(home.headers.get('content-security-policy')||'',/unsafe-inline/);assert.match(await home.text(),/Synthetic staging/);
  for(const path of ['/app.js','/styles.css','/api/guides','/api/funding','/api/compliance','/ready'])assert.equal((await fetch(base+path)).status,200);
  for(const [path,body] of [['loan',{price:-1}],['utilization',{balance:100,limit:0}],['cashflow',{monthlyCashAvailable:'secret'}],['issue-review',{basis:'false_identity'}]]){assert.equal((await fetch(base+'/api/tools/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})).status,400);}
  assert.equal((await fetch(base+'/api/funding/match',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({purpose:'business',state:'AZ',creditScore:800,annualRevenue:1e6})})).status,200);
  assert.equal((await fetch(base+'/api/tools/loan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({price:12000,downPayment:0,fees:0,annualRate:0,months:12})})).status,200);
 }finally{await new Promise<void>(r=>server.close(()=>r()));}
});
