/** Run only on the application server after independently verifying the owner. No password resets. */
import {Store} from '../dist/store.js';
import {databaseFromEnv,transaction} from '../dist/database.js';
const id=process.argv[2],confirmation=process.argv[3],tenant=process.env.PUBLIC_AGENCY_TENANT_ID;
if(!/^[a-f0-9-]{36}$/.test(id||'')||confirmation!=='verified-owner'||!tenant)throw new Error('Usage: npm run operator:promote USER_ID verified-owner; set the agency tenant first');
const db=databaseFromEnv();if(!db)throw new Error('Database required');
await transaction(db,async c=>{const u=(await c.query('SELECT id,tenant_id,role,mfa_enabled FROM users WHERE id=$1',[id])).rows[0];if(!u||!u.mfa_enabled)throw new Error('Existing verified owner must enroll MFA first');
if(u.tenant_id!==tenant){const count=(await c.query('SELECT count(*) AS total FROM service_requests WHERE owner_id=$1',[id])).rows[0];if(Number(count.total))throw new Error('Owner account already has records; do not reassign its tenant');await c.query('UPDATE users SET tenant_id=$2 WHERE id=$1',[id,tenant]);}
await c.query("UPDATE users SET role='agency_owner' WHERE id=$1",[id]);await new Store(c).audit({id,tenant_id:tenant,role:'agency_owner',mfa_enabled:true,mfa_verified:true},'operator.promoted');});
console.log('Verified owner promoted; no credentials printed or changed.');process.exit(0);
