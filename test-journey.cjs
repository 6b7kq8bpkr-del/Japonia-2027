const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {F}=require('./lib/facts.cjs'),{railRows}=require('./lib/rail.cjs'),B=require('./data/budget.cjs');
(async()=>{
 const {DAYS,BOOKINGS,DEADLINES}=await import('./data/index.mjs');
 assert.equal(B.total(B.OUR_RAIL),112580);assert.equal(B.total(B.OTHER_RAIL),96510);
 assert.equal(B.total(B.OUR_HOTELS),500443);
 const pairs=[['29.04','n51.odj','n51.przyj'],['3.05','n6.odj','n6.przyj'],['7.05','kodama.odj','kodama.przyj']];
 for(const [date,start,end] of pairs){const row=railRows.find(r=>r[0]===date&&/Nozomi|Kodama/.test(r[2]));assert(row[2].includes(F[start])&&row[2].includes(F[end]));assert.equal(row[3],'done');}
 assert(railRows.find(r=>r[0]==='1.05'&&r[1]==='Kintetsu-Nara → Kioto')[5].includes('15:30'));
 assert(BOOKINGS.find(b=>b.id==='hanaori-transfer-v5').when.includes('20.04'));
 assert(DEADLINES.some(d=>d.id==='hanaori-transfer-reconfirm'&&d.utc==='2027-05-06T07:00:00Z'));
 for(const d of DAYS){for(const file of ['days/'+d.date+'.html','druk.html','druk-skrot.html','pokaz.html']){
  const html=fs.readFileSync(file,'utf8');assert(html.includes(d.brief.start),file+' start '+d.date);
  if(d.date==='2027-05-05')assert(html.includes('Wariant Pokémon jeszcze nierozstrzygnięty'),file+' Pokemon');
 }}
 // Execute the real service worker against isolated in-memory caches, never production.
 const root='https://local.test/';const key=r=>new URL(typeof r==='string'?r:r.url,root).href;
 let stores=new Map(),handlers={},deleted=[],failInstall=false,serverDown=false;
 const cache=name=>{if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);return {
  add:async r=>{if(failInstall&&r==='index.html')throw Error('offline');data.set(key(r),new Response('saved '+r));},
  match:async r=>data.get(key(r))?.clone(),put:async(r,v)=>data.set(key(r),v.clone())};};
 const caches={open:async n=>cache(n),keys:async()=>[...stores.keys()],delete:async n=>{deleted.push(n);return stores.delete(n)},match:async r=>{for(const n of stores.keys()){const v=await cache(n).match(r);if(v)return v;}}};
 const self={skipWaiting(){},clients:{claim:async()=>{}},addEventListener:(type,fn)=>handlers[type]=fn};
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{self,caches,Response,URL,AbortController,setTimeout,clearTimeout,location:{origin:'https://local.test'},fetch:async()=>new Response('server error',{status:serverDown?503:200})});
 const event=async(type,extra={})=>{let work;handlers[type]({...extra,waitUntil:p=>work=p});await work;};
 failInstall=true;await event('install');let metadata=await (await caches.match('/offline-status.json')).json();assert.equal(metadata.ready,false);
 failInstall=false;await event('install');metadata=await (await caches.match('/offline-status.json')).json();assert.equal(metadata.ready,true);
 cache('unrelated-site');cache('jp2027-old');await event('activate');assert(!deleted.includes('unrelated-site'));assert(deleted.includes('jp2027-old'));
 serverDown=true;let response;handlers.fetch({request:{method:'GET',url:root+'index.html',mode:'navigate',destination:'document'},respondWith:p=>response=p});assert.equal(await (await response).text(),'saved index.html');
 let intercepted=false;handlers.fetch({request:{method:'GET',url:root+'api/rezerwacje',mode:'navigate'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
 handlers.fetch({request:{method:'GET',url:root+'rezerwacje.html',mode:'navigate'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
 console.log('PASS: wspólne godziny i kwoty, 4 wersje agendy, terminy, cache offline i awaria HTTP 503');
})();
