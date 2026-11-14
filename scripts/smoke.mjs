const base=process.env.STAGING_URL||'https://darkgoldenrod-shrew-304046.hostingersite.com';
if(!base.startsWith('https://'))throw new Error('HTTPS staging URL required');
for(const [path,status] of [['/',200],['/health',200],['/ready',200],['/api/platform',200],['/api/guides',200],['/api/funding',200],['/api/hybrid',200],['/api/reviews',200],['/site.js',200],['/site.css',200],['/agency.js',200],['/api/activation',200],['/api/providers',200],['/api/demo/plan/1',200],['/api/demo/plan/90',200],['/api/demo/plan/91',400],['/api/account/cases',503]]){
 const r=await fetch(base+path,{signal:AbortSignal.timeout(15000)});
 if(r.status!==status)throw new Error(`${path}: expected ${status}, received ${r.status}`);
 const body=await r.text();
 if(path==='/health'){const h=JSON.parse(body);if(h.ok!==true||h.realCreditDataEnabled!==false)throw new Error('Unexpected live-data state');}
 if(path==='/api/platform'){const p=JSON.parse(body);if(p.version!=='0.5.0'||p.accountsConfigured||p.features.liveCredit||p.features.taxFiling)throw new Error('Unexpected platform boundary');}
 if(path==='/'&&!body.includes('CREDIT CHAMPION'))throw new Error('Homepage is not Credit Champion');
 console.log(JSON.stringify({path,status:r.status,checkedAt:new Date().toISOString()}));
}
