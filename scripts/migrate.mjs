import {Pool} from 'pg';
import {readFile,readdir} from 'node:fs/promises';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DB_SSL==='require'?{rejectUnauthorized:true}:undefined});
const client=await pool.connect();
try{await client.query('BEGIN');for(const file of (await readdir(new URL('../migrations/',import.meta.url))).filter(x=>x.endsWith('.sql')).sort())await client.query(await readFile(new URL('../migrations/'+file,import.meta.url),'utf8'));await client.query('COMMIT');console.log('Available schema migrations applied. No default accounts or passwords created.');}
catch(error){await client.query('ROLLBACK');throw error;}
finally{client.release();await pool.end();}
