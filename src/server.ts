import {initializeDatabase} from './startup.js';
/** Hostinger's lsnode loader requires an ESM graph without top-level await. */
async function start(){
 await initializeDatabase();
 const {app}=await import('./app.js');
 const port=Number(process.env.PORT||3000);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be an integer from 1 to 65535');
 const server=app.listen(port,'0.0.0.0',()=>console.log(`Credit Champion private staging listening on port ${port}`));
 for(const signal of ['SIGTERM','SIGINT'] as const)process.once(signal,()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),10000).unref();});
}
start().catch(()=>{console.error('Credit Champion startup failed. Check database configuration and migration logs.');process.exit(1);});
