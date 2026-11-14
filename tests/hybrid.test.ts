import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {Store,type DB,type Actor} from '../src/store.js';
import {HybridStore,ReviewStore,reviewSchema,moderationSchema,businessReadiness,intakeSchema} from '../src/hybrid.js';
import {createApp} from '../src/app.js';
import type {AddressInfo} from 'node:net';
test('hybrid preparation validates service-goal relationships and never claims approval',()=>{
 assert.throws(()=>intakeSchema.parse({service:'tax',goal:'business_vehicle'}));
 assert.equal(intakeSchema.parse({service:'tax',goal:'organize_taxes'}).service,'tax');
 const r=businessReadiness({legalIdentity:true,separateBanking:true,records:false,paymentHistory:false,businessPurpose:true,cashflow:false});assert.equal(r.completed,3);assert.equal(r.nextSteps.length,3);assert.match(r.note,/not a credit score/);
 assert.throws(()=>reviewSchema.parse({displayName:'Test',rating:5,service:'platform',body:'My firsthand experience.',publicationConsent:false}));
 assert.throws(()=>moderationSchema.parse({action:'reject'}));
});
test('PostgreSQL hybrid requests and reviews enforce tenancy, consent, staff checks and rating-neutral publication',async()=>{
 const db=new PGlite();for(const f of ['001_core.sql','002_hybrid_reviews.sql'])await db.exec(await readFile(new URL('../migrations/'+f,import.meta.url),'utf8'));
 const store=new Store(db as unknown as DB),hybrid=new HybridStore(store),reviews=new ReviewStore(store);
 try{
  const user=await store.register('a','cipher-a','test-hash',false);const a={...user,mfa_verified:true} as Actor;
  const other=await store.register('b','cipher-b','test-hash',true);const foreign={...other,role:'super_admin',mfa_verified:true} as Actor;
  const staff=await store.register('c','cipher-c','test-hash',false);await db.query("UPDATE users SET tenant_id=$1,role='agency_owner' WHERE id=$2",[a.tenant_id,staff.id]);const moderator={...staff,tenant_id:a.tenant_id,role:'agency_owner',mfa_verified:true} as Actor;
  const row=await hybrid.request(a,{service:'tax',goal:'organize_taxes'});assert.equal(row.status,'requested');assert.equal((await hybrid.requests(foreign)).length,0);
  assert.equal(await hybrid.updateRequest(a,row.id,'closed'),undefined);assert.equal(await hybrid.updateRequest(foreign,row.id,'closed'),undefined);assert.equal((await hybrid.updateRequest(moderator,row.id,'in_review')).status,'in_review');
  assert.deepEqual(await reviews.publicReviews(),{count:0,average:null,reviews:[]});
  const review=await reviews.submit(a,{displayName:'A. Reader',rating:1,service:'platform',body:'I tried the preparation tools and found them difficult to use.',publicationConsent:true});assert.equal(review.status,'pending');assert.equal((await reviews.publicReviews()).count,0);
  assert.equal(await reviews.pending(a),null);assert.equal(await reviews.moderate(a,review.id,{action:'publish'}),undefined);assert.equal(await reviews.moderate(foreign,review.id,{action:'publish'}),undefined);
  assert.equal((await reviews.moderate(moderator,review.id,{action:'publish'})).status,'published');const publicData=await reviews.publicReviews();assert.equal(publicData.count,1);assert.equal(publicData.average,1);assert.equal(publicData.reviews[0].rating,1);assert.equal(publicData.reviews[0].owner_id,undefined);assert.equal(publicData.reviews[0].tenant_id,undefined);
  assert.equal(await reviews.withdraw(foreign),undefined);assert.equal((await reviews.publicReviews()).count,1);assert.ok(await reviews.withdraw(a));assert.equal((await reviews.publicReviews()).count,0);
  const audits=await db.query("SELECT action FROM audit_events WHERE tenant_id=$1",[a.tenant_id]);assert.ok(audits.rows.some((x:any)=>x.action==='review.moderated'));assert.ok(audits.rows.some((x:any)=>x.action==='service.requested'));
 }finally{await db.close();}
});
test('public hybrid release has genuine empty reviews and correct asset contracts',async()=>{
 const server=createApp().listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
 try{
  const r=await (await fetch(base+'/api/reviews')).json();assert.equal(r.count,0);assert.equal(r.average,null);assert.deepEqual(r.reviews,[]);assert.equal(r.collectionConfigured,false);
  const h=await (await fetch(base+'/api/hybrid')).json();assert.equal(h.services.length,3);assert.equal(h.agencyServicesLive,false);
  assert.equal((await fetch(base+'/api/tools/service-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service:'tax',goal:'organize_taxes'})})).status,200);
  assert.equal((await fetch(base+'/api/tools/service-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service:'tax',goal:'business_vehicle'})})).status,400);
  for(const path of ['/site.js','/site.css','/images/financial-consultation.webp','/images/business-owners.webp','/images/tax-readiness.webp']){const asset=await fetch(base+path);assert.equal(asset.status,200);if(path.endsWith('.webp'))assert.match(asset.headers.get('content-type')||'',/image\/webp/);}
  assert.equal((await fetch(base+'/api/account/service-requests')).status,503);
 }finally{await new Promise<void>(r=>server.close(()=>r()));}
});
