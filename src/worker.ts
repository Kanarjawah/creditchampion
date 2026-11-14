import {configuredStore} from './store.js';
import {configuredSender,deliverOutbox} from './leads.js';
const store=configuredStore(),sender=configuredSender();
if(!store)throw new Error('Worker requires a configured database');
if(process.env.EMAIL_WORKER_ENABLED==='true'){if(!sender||!process.env.DATA_ENCRYPTION_KEY||!process.env.APP_ORIGIN||!process.env.MAIL_POSTAL_ADDRESS)throw new Error('Complete sender configuration required');console.log(await deliverOutbox(store,process.env.DATA_ENCRYPTION_KEY,process.env.APP_ORIGIN,sender,process.env.MAIL_POSTAL_ADDRESS));}
const expired=await store.db.query('DELETE FROM vault_documents WHERE expires_at<=now()');console.log({expiredDocumentsRemoved:expired.rowCount||0});
process.exit(0);
