import {spawnSync} from 'node:child_process';
import {Store} from './store.js';
import {databaseFromEnv} from './database.js';
import {z} from 'zod';
export async function initializeDatabase(){
 if(process.env.DB_MIGRATE_ON_START!=='true')return;
 if(!process.env.DATABASE_URL)throw new Error('Database migration requested without configuration');
 const result=spawnSync(process.execPath,['scripts/migrate.mjs'],{stdio:'inherit',env:process.env});if(result.status!==0)throw new Error('Database migration failed');
 const db=databaseFromEnv();if(!db)throw new Error('Database unavailable');
 if(process.env.PUBLIC_AGENCY_TENANT_ID){const id=z.uuid().parse(process.env.PUBLIC_AGENCY_TENANT_ID);const exists=(await db.query('SELECT id FROM tenants WHERE id=$1',[id])).rows.length;if(!exists)await db.query('INSERT INTO tenants(id) VALUES($1)',[id]);}
 console.log('Agency schema initialized; no default administrator credentials created.');
}
