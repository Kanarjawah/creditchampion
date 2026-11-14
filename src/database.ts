import {Pool} from 'pg';
import mysql,{type Pool as MyPool,type PoolConnection} from 'mysql2/promise';
export interface DB {query(sql:string,params?:any[]):Promise<{rows:any[];rowCount?:number|null}>;transaction?<T>(fn:(db:DB)=>Promise<T>):Promise<T>;dialect?:'postgres'|'mysql';}
const locks=new WeakMap<object,Promise<unknown>>();
export async function transaction<T>(db:DB,fn:(db:DB)=>Promise<T>):Promise<T>{
 if(db.transaction)return db.transaction(fn);
 const prev=locks.get(db)||Promise.resolve();const job=prev.catch(()=>{}).then(async()=>{await db.query('BEGIN');try{const value=await fn(db);await db.query('COMMIT');return value;}catch(e){await db.query('ROLLBACK');throw e;}});locks.set(db,job);return job;
}
export class PostgresDB implements DB {
 dialect='postgres' as const;constructor(private pool:Pool){}
 async query(sql:string,params:any[]=[]){return this.pool.query(sql,params);}
 async transaction<T>(fn:(db:DB)=>Promise<T>){const c=await this.pool.connect();try{await c.query('BEGIN');const result=await fn({dialect:'postgres',query:async(s,p)=>c.query(s,p)});await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
}
export function mysqlSQL(sql:string,params:any[]=[]){const values:any[]=[];const query=sql.replace(/now\(\)/gi,'CURRENT_TIMESTAMP(3)').replace(/::boolean|::int\b/g,'').replace(/interval '(\d+) (minutes?|hours?|days?)'/g,(_,n,u)=>`INTERVAL ${n} ${u.replace(/s$/,'').toUpperCase()}`).replace(/\$(\d+)/g,(_,n)=>{if(Number(n)>params.length)throw new Error('Missing SQL parameter');const value=params[Number(n)-1]??null;values.push(typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)?value.replace('T',' ').replace('Z',''):value);return '?';});return {query,values};}
/** Fixed application SQL only. Preserves parameter binding and row locks for RETURNING. */
const initializedPools=new WeakSet<MyPool>();
export class MysqlDB implements DB {
 dialect='mysql' as const;constructor(private pool:MyPool,private connection?:PoolConnection){if(!initializedPools.has(pool)){initializedPools.add(pool);pool.on('connection',connection=>{connection.query("SET time_zone = '+00:00'");});}}
 async transaction<T>(fn:(db:DB)=>Promise<T>):Promise<T>{if(this.connection)return fn(this);const c=await this.pool.getConnection();try{await c.beginTransaction();const result=await fn(new MysqlDB(this.pool,c));await c.commit();return result;}catch(e){await c.rollback();throw e;}finally{c.release();}}
 async query(sql:string,params:any[]=[]):Promise<{rows:any[];rowCount:number}>{
  const returning=sql.match(/\s+RETURNING\s+([\w*, ]+)\s*$/i);
  if(returning){return this.transaction(async d=>{const self=d as MysqlDB,statement=sql.slice(0,returning.index),columns=returning[1];let table:string,ids:string[]=[];
   const ins=statement.match(/^\s*INSERT INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*\((.+)\)\s*$/is);
   const upd=statement.match(/^\s*UPDATE (\w+) SET .+? WHERE (.+)$/is);
   if(ins){table=ins[1];const names=ins[2].split(',').map(x=>x.trim()),tokens=ins[3].split(',').map(x=>x.trim());const key=tokens[names.indexOf('id')];if(!/^\$\d+$/.test(key||''))throw new Error('Unsupported returning insert');ids=[params[Number(key.slice(1))-1]];}
   else if(upd){table=upd[1];ids=(await self.query(`SELECT id FROM ${table} WHERE ${upd[2]} FOR UPDATE`,params)).rows.map(r=>r.id);if(!ids.length)return {rows:[],rowCount:0};}
   else throw new Error('Unsupported returning statement');
   await self.query(statement,params);const selected=await self.query(`SELECT ${columns} FROM ${table} WHERE id IN (${ids.map((_,i)=>'$'+(i+1)).join(',')})`,ids);return {rows:selected.rows,rowCount:selected.rows.length};
  });}
  const {query,values}=mysqlSQL(sql,params);try{const [result]=await (this.connection||this.pool).execute(query,values);if(Array.isArray(result)){for(const row of result as any[])for(const key of ['mfa_enabled','mfa_verified','customer_approved','evidence_reviewed','publication_consent','marketing_consent','published','processor_approved'])if(key in row)row[key]=!!row[key];return {rows:result as any[],rowCount:result.length};}return {rows:[],rowCount:(result as any).affectedRows||0};}catch(e){if((e as any).code==='ER_DUP_ENTRY')(e as any).code='23505';throw e;}
 }
}
export function databaseFromEnv():DB|undefined{
 const url=process.env.DATABASE_URL;if(!url)return undefined;
 if(/^mysql:\/\//.test(url)){const u=new URL(url);const host=u.hostname;if(process.env.NODE_ENV==='production'&&!['127.0.0.1','localhost'].includes(host)&&process.env.DB_SSL!=='require')throw new Error('Remote MySQL requires verified TLS');return new MysqlDB(mysql.createPool({host,port:Number(u.port||3306),user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:u.pathname.slice(1),connectionLimit:5,connectTimeout:5000,timezone:'Z',dateStrings:true,ssl:process.env.DB_SSL==='require'?{rejectUnauthorized:true}:undefined,multipleStatements:false}));}
 if(!/^postgres(ql)?:\/\//.test(url))throw new Error('Unsupported database URL');return new PostgresDB(new Pool({connectionString:url,ssl:process.env.DB_SSL==='require'?{rejectUnauthorized:true}:undefined,max:5,connectionTimeoutMillis:5000,statement_timeout:10000}));
}
