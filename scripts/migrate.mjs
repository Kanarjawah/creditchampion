import {Pool} from 'pg';
import mysql from 'mysql2/promise';
import {readFile,readdir} from 'node:fs/promises';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
if(process.env.DATABASE_URL.startsWith('mysql://')){
 const c=await mysql.createConnection({uri:process.env.DATABASE_URL,multipleStatements:false,ssl:process.env.DB_SSL==='require'?{rejectUnauthorized:true}:undefined});
 try{await c.query('CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at timestamp DEFAULT CURRENT_TIMESTAMP)');for(const file of (await readdir(new URL('../migrations/mysql/',import.meta.url))).filter(x=>x.endsWith('.sql')).sort()){
 const version=Number(file.split('_')[0]);const [done]=await c.execute('SELECT version FROM schema_migrations WHERE version=?',[version]);if(done.length)continue;
 for(const sql of (await readFile(new URL('../migrations/mysql/'+file,import.meta.url),'utf8')).split(';').map(x=>x.trim()).filter(Boolean))await c.query(sql);
 }console.log('MySQL schema migrations applied; no default accounts created.');}finally{await c.end();}
}else{
 const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DB_SSL==='require'?{rejectUnauthorized:true}:undefined});const c=await pool.connect();try{await c.query('BEGIN');for(const file of (await readdir(new URL('../migrations/',import.meta.url))).filter(x=>x.endsWith('.sql')).sort())await c.query(await readFile(new URL('../migrations/'+file,import.meta.url),'utf8'));await c.query('COMMIT');console.log('PostgreSQL schema migrations applied; no default accounts created.');}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();await pool.end();}
}
