import {Router,type Request} from 'express';
import {rateLimit} from 'express-rate-limit';
import {z} from 'zod';
import {cipher,equal,newTotpSecret,passwordHash,passwordValid,randomToken,tokenHash,verifyTotp} from './crypto.js';
import {Store,type Actor} from './store.js';
import {hybridAccountRoutes} from './hybrid.js';
import {agencyRoutes} from './operations.js';
import {vaultRoutes} from './vault.js';
import {transaction} from './database.js';
import {integrationRoutes} from './integrations.js';
export type AccountConfig={enabled:boolean;origin:string;encryptionKey:string;registrationCode:string;secure:boolean};
export const accountConfig=():AccountConfig=>({enabled:process.env.ACCOUNT_MODE==='private_staging',origin:process.env.APP_ORIGIN||'',encryptionKey:process.env.DATA_ENCRYPTION_KEY||'',registrationCode:process.env.STAGING_REGISTRATION_CODE||'',secure:process.env.NODE_ENV==='production'});
const credentials=z.object({email:z.string().email().max(254).transform(x=>x.toLowerCase().trim()),password:z.string().min(14).max(128)});
const tokenFrom=(req:Request)=>(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('cc_session='))?.slice(11)||'';
export function accounts(store:Store|undefined,config:AccountConfig){
 const router=Router();
 const ready=!!(store&&config.enabled&&config.origin&&config.encryptionKey&&config.registrationCode);
 const crypt=ready?cipher(config.encryptionKey):undefined;
 router.use((_req,res,next)=>{if(!ready)return res.status(503).json({error:'Private staging accounts are not configured. Use the synthetic workspace; do not enter personal information.'});next();});
 router.use((req,res,next)=>{if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.origin!==config.origin)return res.status(403).json({error:'Origin not allowed'});next();});
 router.use(rateLimit({windowMs:15*60*1000,limit:120,standardHeaders:'draft-7',legacyHeaders:false}));
 const authLimiter=rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:'draft-7',legacyHeaders:false});
 const cookie={httpOnly:true,secure:config.secure,sameSite:'strict' as const,path:'/',maxAge:8*60*60*1000};
 router.post('/register',authLimiter,async(req,res)=>{
  const parsed=credentials.extend({business:z.boolean().default(false),registrationCode:z.string().max(256).optional(),invitation:z.string().min(20).max(256).optional()}).safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:'Use a valid email and a password of 14 to 128 characters.'});
  if(!parsed.data.invitation&&!equal(parsed.data.registrationCode||'',config.registrationCode))return res.status(403).json({error:'Staging invitation required'});
  try{const a=parsed.data.invitation?await transaction(store!.db,async db=>{const invite=(await db.query('SELECT * FROM agency_invites WHERE token_hash=$1 AND email_lookup=$2 AND used_at IS NULL AND expires_at>now() FOR UPDATE',[tokenHash(parsed.data.invitation!),crypt!.lookup(parsed.data.email)])).rows[0];if(!invite)return undefined;const id=(await import('node:crypto')).randomUUID();await db.query('INSERT INTO users(id,tenant_id,email_lookup,email_cipher,password_hash,role) VALUES($1,$2,$3,$4,$5,$6)',[id,invite.tenant_id,invite.email_lookup,crypt!.encrypt(parsed.data.email),await passwordHash(parsed.data.password),invite.role]);await db.query('UPDATE agency_invites SET used_at=now() WHERE id=$1',[invite.id]);return {id,tenant_id:invite.tenant_id,role:invite.role,mfa_enabled:false,mfa_verified:false};}):await store!.register(crypt!.lookup(parsed.data.email),crypt!.encrypt(parsed.data.email),await passwordHash(parsed.data.password),parsed.data.business);if(!a)return res.status(403).json({error:'Invitation invalid or expired'});await store!.audit(a,'account.created');return res.status(201).json({created:true,message:'Sign in and enroll an authenticator to access the private staging workspace.'});}
  catch(error){if((error as {code?:string}).code==='23505')return res.status(409).json({error:'Account cannot be created. Use an existing account or a different staging identity.'});throw error;}
 });
 router.post('/login',authLimiter,async(req,res)=>{
  const parsed=credentials.safeParse(req.body);if(!parsed.success)return res.status(401).json({error:'Invalid credentials'});
  const u=await store!.byEmail(crypt!.lookup(parsed.data.email));
  const hash=u?.password_hash||await passwordHash(randomToken());
  const valid=await passwordValid(parsed.data.password,hash);if(!u||!valid)return res.status(401).json({error:'Invalid credentials'});
  const token=randomToken();await store!.createSession(tokenHash(token),u.id);res.cookie('cc_session',token,cookie);
  await store!.audit(u,'session.password_verified');res.json({mfaRequired:true,enrollmentRequired:!u.mfa_enabled});
 });
 router.use(async(req,res,next)=>{const token=tokenFrom(req);if(!token)return res.status(401).json({error:'Sign in required'});const a=await store!.actor(tokenHash(token));if(!a)return res.status(401).json({error:'Session expired'});res.locals.actor=a;res.locals.hash=tokenHash(token);await store!.touch(res.locals.hash);next();});
 router.get('/me',(_req,res)=>{const a=res.locals.actor as Actor;res.json({id:a.id,role:a.role,mfaEnabled:a.mfa_enabled,mfaVerified:a.mfa_verified});});
 router.post('/logout',async(_req,res)=>{await store!.logout(res.locals.hash);res.clearCookie('cc_session',cookie);res.json({loggedOut:true});});
 router.post('/mfa/enroll',authLimiter,async(_req,res)=>{const a=res.locals.actor as Actor;if(a.mfa_enabled)return res.status(409).json({error:'Authenticator already enrolled'});const secret=newTotpSecret();await store!.enroll(a.id,crypt!.encrypt(secret));res.json({secret,issuer:'Credit Champion',account:a.id,message:'Store this manual setup key only in your authenticator. Recovery requires an operator identity-verification process.'});});
 router.post('/mfa/verify',authLimiter,async(req,res)=>{const a=res.locals.actor as Actor;const parsed=z.object({code:z.string().regex(/^\d{6}$/)}).safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Enter a six-digit authenticator code'});const u=await store!.mfaSecret(a.id);if(!u.mfa_cipher)return res.status(400).json({error:'Enroll an authenticator first'});const counter=verifyTotp(crypt!.decrypt(u.mfa_cipher),parsed.data.code,Date.now(),Number(u.mfa_last_counter));if(counter===null||!await store!.confirmMfa(a.id,counter))return res.status(401).json({error:'Code invalid or already used'});await store!.verifySession(res.locals.hash);await store!.audit(a,'session.mfa_verified');res.json({verified:true});});
 router.use((_req,res,next)=>{if(!res.locals.actor.mfa_verified)return res.status(403).json({error:'Authenticator verification required'});next();});
 router.get('/cases',async(_req,res)=>res.json({cases:await store!.cases(res.locals.actor)}));
 router.post('/cases',async(req,res)=>{const parsed=z.object({category:z.enum(['late_payment','collection','charge_off','repossession','bankruptcy','inquiry','identity','other'])}).strict().safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Choose a supported category; no customer details or reports accepted.'});const row=await store!.createCase(res.locals.actor,parsed.data.category);await store!.audit(res.locals.actor,'case.created',row.id);res.status(201).json(row);});
 router.post('/cases/:id/:action',async(req,res)=>{if(!z.uuid().safeParse(req.params.id).success)return res.status(400).json({error:'Invalid case ID'});const a=res.locals.actor as Actor;const existing=await store!.caseById(a,String(req.params.id));if(!existing)return res.status(404).json({error:'Case not found'});let row;if(req.params.action==='approve')row=await store!.approveCase(a,existing.id);else if(req.params.action==='review-evidence')row=await store!.reviewEvidence(a,existing.id);else return res.status(404).json({error:'Action not available'});if(!row)return res.status(409).json({error:'Role or workflow does not permit this action'});await store!.audit(a,`case.${req.params.action}`,row.id);res.json(row);});
 router.get('/audit',async(_req,res)=>{const rows=await store!.auditEvents(res.locals.actor);if(!rows)return res.status(403).json({error:'Role not permitted'});res.json({events:rows});});
 if(store){router.use(hybridAccountRoutes(store));router.use(agencyRoutes(store,config.encryptionKey));router.use(vaultRoutes(store,config.encryptionKey));router.use(integrationRoutes(store,config.encryptionKey));}
 return router;
}
