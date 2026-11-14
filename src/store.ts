import {databaseFromEnv,transaction,type DB} from './database.js';
export type {DB} from './database.js';
import {randomUUID} from 'node:crypto';
export type Actor={id:string;tenant_id:string;role:string;mfa_enabled:boolean;mfa_verified:boolean};
const staff=new Set(['super_admin','compliance_admin','credit_specialist','agency_owner','agency_employee']);
export class Store {
 constructor(public db:DB){}
 async register(emailLookup:string,emailCipher:string,passwordHash:string,business:boolean,claimOwner=false){
  const tenant=randomUUID(),id=randomUUID();
  return transaction(this.db,async db=>{if(claimOwner){const bootstrap=(await db.query('SELECT owner_id FROM owner_bootstrap WHERE id=$1 FOR UPDATE',['00000000-0000-4000-8000-000000000001'])).rows[0];if(!bootstrap||bootstrap.owner_id)throw Object.assign(new Error('Owner already claimed'),{code:'OWNER_CLAIMED'});}await db.query('INSERT INTO tenants(id) VALUES($1)',[tenant]);const user=(await db.query('INSERT INTO users(id,tenant_id,email_lookup,email_cipher,password_hash,role) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,tenant_id,role,mfa_enabled',[id,tenant,emailLookup,emailCipher,passwordHash,claimOwner?'agency_owner':business?'business_customer':'individual_customer'])).rows[0] as Actor;if(claimOwner)await db.query('UPDATE owner_bootstrap SET owner_id=$1,claimed_at=now() WHERE id=$2',[id,'00000000-0000-4000-8000-000000000001']);return user;});
 }
 async byEmail(lookup:string){return (await this.db.query('SELECT * FROM users WHERE email_lookup=$1',[lookup])).rows[0];}
 async createSession(hash:string,user:string){await this.db.query(`INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '10 minutes')`,[hash,user]);}
 async actor(hash:string):Promise<Actor|undefined>{return (await this.db.query(`SELECT u.id,u.tenant_id,u.role,u.mfa_enabled,s.mfa_verified FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND s.last_seen_at>now()-interval '30 minutes'`,[hash])).rows[0];}
 async touch(hash:string){await this.db.query('UPDATE sessions SET last_seen_at=now() WHERE token_hash=$1',[hash]);}
 async logout(hash:string){await this.db.query('DELETE FROM sessions WHERE token_hash=$1',[hash]);}
 async mfaSecret(user:string){return (await this.db.query('SELECT mfa_cipher,mfa_enabled,mfa_last_counter FROM users WHERE id=$1',[user])).rows[0];}
 async enroll(user:string,secret:string){await this.db.query('UPDATE users SET mfa_cipher=$2 WHERE id=$1 AND mfa_enabled=false',[user,secret]);}
 async confirmMfa(user:string,counter:number){return (await this.db.query('UPDATE users SET mfa_enabled=true,mfa_last_counter=$2 WHERE id=$1 AND mfa_last_counter<$2 RETURNING id',[user,counter])).rows.length===1;}
 async verifySession(hash:string){await this.db.query(`UPDATE sessions SET mfa_verified=true,expires_at=now()+interval '8 hours' WHERE token_hash=$1`,[hash]);}
 async audit(a:Actor,action:string,resource:string|null=null){await this.db.query('INSERT INTO audit_events(id,tenant_id,actor_id,action,resource_id) VALUES($1,$2,$3,$4,$5)',[randomUUID(),a.tenant_id,a.id,action,resource]);}
 async cases(a:Actor){return (await this.db.query(`SELECT id,category,status,owner_id,created_at,updated_at FROM cases WHERE tenant_id=$1 AND ($3::boolean OR owner_id=$2) ORDER BY created_at DESC LIMIT 100`,[a.tenant_id,a.id,staff.has(a.role)])).rows;}
 async createCase(a:Actor,category:string){const id=randomUUID();return (await this.db.query('INSERT INTO cases(id,tenant_id,owner_id,category) VALUES($1,$2,$3,$4) RETURNING id,category,status',[id,a.tenant_id,a.id,category])).rows[0];}
 async caseById(a:Actor,id:string){return (await this.db.query('SELECT * FROM cases WHERE id=$1 AND tenant_id=$2 AND ($4::boolean OR owner_id=$3)',[id,a.tenant_id,a.id,staff.has(a.role)])).rows[0];}
 async approveCase(a:Actor,id:string){return (await this.db.query(`UPDATE cases SET customer_approved=true,status='awaiting_compliance_review',updated_at=now() WHERE id=$1 AND tenant_id=$2 AND owner_id=$3 AND status='awaiting_approval' AND evidence_reviewed=true RETURNING id,status`,[id,a.tenant_id,a.id])).rows[0];}
 async reviewEvidence(a:Actor,id:string){if(!['credit_specialist','compliance_admin','super_admin'].includes(a.role))return undefined;return (await this.db.query(`UPDATE cases SET evidence_reviewed=true,status='awaiting_approval',updated_at=now() WHERE id=$1 AND tenant_id=$2 AND status='needs_evidence' RETURNING id,status`,[id,a.tenant_id])).rows[0];}
 async auditEvents(a:Actor){if(!['super_admin','compliance_admin','agency_owner'].includes(a.role))return null;return (await this.db.query('SELECT id,actor_id,action,resource_id,created_at FROM audit_events WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 100',[a.tenant_id])).rows;}
}
export function configuredStore(){const db=databaseFromEnv();return db?new Store(db):undefined;}
