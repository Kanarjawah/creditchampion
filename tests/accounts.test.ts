import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import type {AddressInfo} from 'node:net';
import {Store,type DB,type Actor} from '../src/store.js';
import {createApp} from '../src/app.js';
import {cipher,passwordHash,passwordValid,totp,verifyTotp} from '../src/crypto.js';
test('scrypt, authenticated encryption and TOTP replay boundaries',async()=>{
 const hash=await passwordHash('a-test-password-with-length');assert.equal(await passwordValid('a-test-password-with-length',hash),true);assert.equal(await passwordValid('incorrect',hash),false);
 const c=cipher(randomBytes(32).toString('base64'));const encrypted=c.encrypt('synthetic secret');assert.equal(c.decrypt(encrypted),'synthetic secret');const bytes=Buffer.from(encrypted,'base64');bytes[14]^=1;assert.throws(()=>c.decrypt(bytes.toString('base64')));
 const secret='GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';assert.equal(totp(secret,1),'287082');assert.equal(verifyTotp(secret,'287082',59000),1);assert.equal(verifyTotp(secret,'287082',59000,1),null);
});
test('PostgreSQL schema, auth, MFA, origin enforcement, ownership and tenant isolation',async()=>{
 const db=new PGlite();await db.exec(await readFile(new URL('../migrations/001_core.sql',import.meta.url),'utf8'));
 const store=new Store(db as unknown as DB),key=randomBytes(32).toString('base64');
 const config={enabled:true,origin:'https://staging.example.test',encryptionKey:key,registrationCode:'test-invitation-only',secure:true};
 const app=createApp(store,config),server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;let cookie='';
 const post=(path:string,body:unknown,origin=config.origin)=>fetch(base+'/api/account'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie},body:JSON.stringify(body)});
 try{
  const identity={email:'synthetic@example.test',password:'long-synthetic-password-only',registrationCode:config.registrationCode};
  assert.equal((await post('/register',identity,'https://attacker.test')).status,403);
  assert.equal((await post('/register',identity)).status,201);
  const user=await store.byEmail(cipher(key).lookup(identity.email));assert.notEqual(user.email_cipher,identity.email);assert.equal(user.role,'individual_customer');assert.equal(user.mfa_enabled,false);
  const login=await post('/login',identity);assert.equal(login.status,200);assert.match(login.headers.get('set-cookie')||'',/HttpOnly/);assert.match(login.headers.get('set-cookie')||'',/Secure/);assert.match(login.headers.get('set-cookie')||'',/SameSite=Strict/);cookie=(login.headers.get('set-cookie')||'').split(';')[0];
  assert.equal((await fetch(base+'/api/account/cases',{headers:{Cookie:cookie}})).status,403);
  const enrollment=await (await post('/mfa/enroll',{})).json();const code=totp(enrollment.secret,Math.floor(Date.now()/30000));
  assert.equal((await post('/mfa/verify',{code})).status,200);
  assert.equal((await post('/mfa/verify',{code})).status,401);
  const created=await post('/cases',{category:'late_payment'});assert.equal(created.status,201);const row=await created.json();
  assert.equal((await post('/cases/'+row.id+'/review-evidence',{})).status,409);
  assert.equal((await post('/cases/'+row.id+'/approve',{})).status,409);
  assert.equal((await fetch(base+'/api/account/audit',{headers:{Cookie:cookie}})).status,403);
  const other=await store.register('different-lookup',cipher(key).encrypt('other@example.test'),await passwordHash('other-long-test-password'),false);
  await db.query("UPDATE users SET role='super_admin' WHERE id=$1",[other.id]);
  const foreign={...other,role:'super_admin'} as Actor;
  assert.deepEqual(await store.cases(foreign),[]);assert.equal(await store.caseById(foreign,row.id),undefined);assert.equal(await store.reviewEvidence(foreign,row.id),undefined);
  const actor={...user,mfa_verified:true} as Actor;
  assert.equal(await store.approveCase(actor,row.id),undefined);
  assert.ok(await store.reviewEvidence({...actor,role:'compliance_admin'},row.id));
  assert.ok(await store.approveCase(actor,row.id));
  const rows=await db.query('SELECT action FROM audit_events WHERE tenant_id=$1',[user.tenant_id]);assert.ok(rows.rows.length>=3);
  assert.equal((await post('/logout',{})).status,200);
  assert.equal((await fetch(base+'/api/account/me',{headers:{Cookie:cookie}})).status,401);
 }finally{await new Promise<void>(r=>server.close(()=>r()));await db.close();}
});
