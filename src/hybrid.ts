import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {Router,type RequestHandler} from 'express';
import {Store,type Actor} from './store.js';
import {transaction,type DB} from './database.js';
async function audited(store:Store,a:Actor,sql:string,params:any[],action:string){return transaction(store.db,async db=>{const row=(await db.query(sql,params)).rows[0];if(row)await new Store(db).audit(a,action,row.id);return row;});}
export const services=[
 {id:'personal',name:'Personal credit',description:'Understand reports, review factual errors and build consistent habits.',available:['Credit education','90-day planner','Issue-review triage','Utilization planning'],planned:['Specialist-led case management','Authorized report integrations'],goalOptions:['understand_credit','review_errors']},
 {id:'business',name:'Business credit',description:'Organize the business foundation, compare funding sources and plan vehicle costs.',available:['Business preparation checklist','Lender and grant-source directory','Vehicle and cash-flow planning'],planned:['Provider reporting connections','Specialist application preparation'],goalOptions:['build_business','prepare_funding','business_vehicle']},
 {id:'tax',name:'Tax readiness',description:'Prepare organized records and informed questions for a qualified tax professional.',available:['Recordkeeping guidance','Document readiness checklist','Business vehicle-use planning'],planned:['Qualified preparer coordination','Secure tax-document workflow'],goalOptions:['organize_taxes','vehicle_records']}
];
export const intakeSchema=z.object({service:z.enum(['personal','business','tax']),goal:z.enum(['understand_credit','review_errors','build_business','prepare_funding','business_vehicle','organize_taxes','vehicle_records'])}).strict().refine(x=>services.find(s=>s.id===x.service)!.goalOptions.includes(x.goal),'Choose a goal for the selected service');
export const readinessSchema=z.object({legalIdentity:z.boolean(),separateBanking:z.boolean(),records:z.boolean(),paymentHistory:z.boolean(),businessPurpose:z.boolean(),cashflow:z.boolean()}).strict();
export function businessReadiness(input:z.infer<typeof readinessSchema>){const x=readinessSchema.parse(input);const names:Record<keyof typeof x,string>={legalIdentity:'Confirm accurate business identity and signer authority.',separateBanking:'Separate business banking and personal spending.',records:'Prepare current financial statements and source records.',paymentHistory:'Review payment history and correct factual errors.',businessPurpose:'Define the funding purpose and amount.',cashflow:'Stress-test repayment against operating cash flow.'};return {completed:Object.values(x).filter(Boolean).length,total:6,nextSteps:Object.entries(x).filter(([,yes])=>!yes).map(([key])=>names[key as keyof typeof x]),note:'Document preparation checklist, not a credit score, fundability rating, underwriting result or approval.'};}
export class HybridStore {
 constructor(private store:Store){}
 async requests(a:Actor){const staff=['super_admin','compliance_admin','credit_specialist','agency_owner','agency_employee'].includes(a.role);return (await this.store.db.query('SELECT id,service,goal,status,owner_id,created_at FROM service_requests WHERE tenant_id=$1 AND ($3::boolean OR owner_id=$2) ORDER BY created_at DESC LIMIT 100',[a.tenant_id,a.id,staff])).rows;}
 async request(a:Actor,input:z.infer<typeof intakeSchema>){const x=intakeSchema.parse(input);return audited(this.store,a,'INSERT INTO service_requests(id,tenant_id,owner_id,service,goal) VALUES($1,$2,$3,$4,$5) RETURNING id,service,goal,status',[randomUUID(),a.tenant_id,a.id,x.service,x.goal],'service.requested');}
 async updateRequest(a:Actor,id:string,status:string){if(!['super_admin','compliance_admin','credit_specialist','agency_owner','agency_employee'].includes(a.role))return undefined;return audited(this.store,a,'UPDATE service_requests SET status=$3,updated_at=now() WHERE id=$1 AND tenant_id=$2 RETURNING id,service,status',[id,a.tenant_id,status],'service.status_updated');}
}
export const reviewSchema=z.object({displayName:z.string().trim().min(2).max(40).regex(/^[\p{L}\p{M} .'-]+$/u),rating:z.number().int().min(1).max(5),service:z.enum(['personal','business','tax','platform']),body:z.string().trim().min(15).max(1500),publicationConsent:z.literal(true)}).strict();
export const moderationSchema=z.object({action:z.enum(['publish','reject']),reason:z.enum(['privacy','spam','not_firsthand','duplicate']).optional()}).strict().refine(x=>x.action!=='reject'||!!x.reason,'A specific moderation reason is required');
export class ReviewStore {
 constructor(private store:Store){}
 async publicReviews(){
  const summary=(await this.store.db.query("SELECT count(*)::int AS count,avg(rating) AS average FROM reviews WHERE status='published' AND publication_consent=true")).rows[0];
  const rows=(await this.store.db.query("SELECT id,display_name,rating,service,body,published_at FROM reviews WHERE status='published' AND publication_consent=true ORDER BY published_at DESC,id LIMIT 50")).rows;
  return {count:Number(summary.count),average:summary.average===null?null:Number(Number(summary.average).toFixed(2)),reviews:rows};
 }
 async mine(a:Actor){return (await this.store.db.query('SELECT id,display_name,rating,service,body,status,moderation_reason FROM reviews WHERE owner_id=$1 AND tenant_id=$2',[a.id,a.tenant_id])).rows[0]||null;}
 async submit(a:Actor,input:z.infer<typeof reviewSchema>){if(!['individual_customer','business_customer'].includes(a.role))throw new Error('Customer account required');const x=reviewSchema.parse(input);return audited(this.store,a,'INSERT INTO reviews(id,tenant_id,owner_id,display_name,rating,service,body,publication_consent) VALUES($1,$2,$3,$4,$5,$6,$7,true) RETURNING id,status',[randomUUID(),a.tenant_id,a.id,x.displayName,x.rating,x.service,x.body],'review.submitted');}
 async pending(a:Actor){if(!['super_admin','compliance_admin','agency_owner'].includes(a.role))return null;return (await this.store.db.query("SELECT id,display_name,rating,service,body,status FROM reviews WHERE tenant_id=$1 AND status='pending' ORDER BY created_at LIMIT 100",[a.tenant_id])).rows;}
 async moderate(a:Actor,id:string,input:z.infer<typeof moderationSchema>){if(!['super_admin','compliance_admin','agency_owner'].includes(a.role))return undefined;const x=moderationSchema.parse(input);return audited(this.store,a,`UPDATE reviews SET status=$3,moderation_reason=$4,moderated_by=$5,published_at=CASE WHEN $3='published' THEN now() ELSE null END WHERE id=$1 AND tenant_id=$2 AND owner_id<>$5 AND publication_consent=true AND status='pending' RETURNING id,status`,[id,a.tenant_id,x.action==='publish'?'published':'rejected',x.reason||null,a.id],'review.moderated');}
 async withdraw(a:Actor){return audited(this.store,a,`UPDATE reviews SET status='withdrawn',publication_consent=false WHERE owner_id=$1 AND tenant_id=$2 RETURNING id`,[a.id,a.tenant_id],'review.withdrawn');}
}
export function publicReviews(store:Store|undefined,enabled:boolean):RequestHandler{return async(_req,res)=>{if(!store||!enabled)return res.json({count:0,average:null,reviews:[],collectionConfigured:false,note:'No reviews have been published. Review collection requires configured private accounts.'});res.json({...await new ReviewStore(store).publicReviews(),collectionConfigured:true,note:'Firsthand platform feedback published with consent. No purchased reviews or imported competitor testimonials.'});};}
/** Mount only after authentication and MFA middleware. */
export function hybridAccountRoutes(store:Store){const router=Router(),hybrid=new HybridStore(store),reviews=new ReviewStore(store);
 router.get('/service-requests',async(_req,res)=>res.json({requests:await hybrid.requests(res.locals.actor)}));
 router.post('/service-requests',async(req,res)=>res.status(201).json(await hybrid.request(res.locals.actor,intakeSchema.parse(req.body))));
 router.post('/service-requests/:id/status',async(req,res)=>{const id=z.uuid().parse(req.params.id);const x=z.object({status:z.enum(['requested','needs_documents','in_review','ready_for_consultation','closed'])}).strict().parse(req.body);const row=await hybrid.updateRequest(res.locals.actor,id,x.status);if(!row)return res.status(404).json({error:'Request not found or role not permitted'});res.json(row);});
 router.get('/reviews/mine',async(_req,res)=>res.json({review:await reviews.mine(res.locals.actor)}));
 router.post('/reviews',async(req,res)=>{if(!['individual_customer','business_customer'].includes(res.locals.actor.role))return res.status(403).json({error:'Customer account required'});try{res.status(201).json(await reviews.submit(res.locals.actor,reviewSchema.parse(req.body)));}catch(error){if((error as {code?:string}).code==='23505')return res.status(409).json({error:'One review per account; contact support for corrections or withdraw it.'});throw error;}});
 router.post('/reviews/withdraw',async(_req,res)=>res.json({withdrawn:!!await reviews.withdraw(res.locals.actor)}));
 router.get('/reviews/moderation',async(_req,res)=>{const rows=await reviews.pending(res.locals.actor);if(!rows)return res.status(403).json({error:'Role not permitted'});res.json({reviews:rows});});
 router.post('/reviews/:id/moderate',async(req,res)=>{const id=z.uuid().parse(req.params.id);const row=await reviews.moderate(res.locals.actor,id,moderationSchema.parse(req.body));if(!row)return res.status(404).json({error:'Review not found or moderation not permitted'});res.json(row);});
 return router;
}
