// Test po buildzie: daty, kwoty, linki, prywatność. Uruchom: node check.mjs
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {runInNewContext} from 'node:vm';
const DIR=dirname(new URL(import.meta.url).pathname);
const files=[...readdirSync(DIR).filter(f=>f.endsWith('.html')&&!f.includes('artifact')),...readdirSync(join(DIR,'days')).filter(f=>f.endsWith('.html')).map(f=>'days/'+f)];
const errs=[]; const strip=s=>s.replace(/<script[\s\S]*?<\/script>/g,'');
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
for(const f of files){
  const html=readFileSync(join(DIR,f),'utf8'), body=strip(html);
  if(/\bundefined\b|\bNaN\b/.test(body)) errs.push(`${f}: 'undefined'/'NaN' w treści`);
  if(/EYH\d{6}|gq-[a-z0-9]{16}|#\d{7}\b|HMSHT\d+/.test(body)) errs.push(`${f}: numer rezerwacji/sprawy w publicznym HTML`);
  const ids=[...body.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  if(new Set(ids).size!==ids.length) errs.push(`${f}: powtórzone id`);
  for(const m of body.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(/^(https?:|data:|mailto:|tel:|\/\/)/.test(m[1])) continue;
    const [path,anchor]=m[1].split('#'),h=path.split('?')[0];
    const t=!h?join(DIR,f):h.startsWith('/')?join(DIR,h):resolve(join(DIR,dirname(f)),h);
    if(!existsSync(t)) errs.push(`${f}: brak pliku ${h}`);
    else if(anchor&&t.endsWith('.html')&&!new RegExp(`id="${esc(anchor)}"`).test(readFileSync(t,'utf8'))) errs.push(`${f}: brak kotwicy #${anchor} w ${h||f}`);
  }
  if(f.startsWith('days/')){ const d=f.slice(5,15), want=`<span>${d.slice(8,10)}.${d.slice(5,7)}</span>`; if(!html.includes(want)) errs.push(`${f}: pigułka dnia nie pokazuje ${d.slice(8,10)}.${d.slice(5,7)}`); }
}
const src=readFileSync(join(DIR,'build.mjs'),'utf8');
// Odczyt tylko deklaracji danych. Generator i zapis plików nie są uruchamiane.
const modelSource=src.slice(src.indexOf('const DAYS = ['),src.indexOf('const gmapsQ ='));
const {DAYS,HOTELS}=runInNewContext('const A=(id,label)=>({id,label});'+modelSource+';({DAYS,HOTELS})',{}, {timeout:1000});
const hotelIds=new Set(HOTELS.map(h=>h.id));
const dows=['niedziela','poniedziałek','wtorek','środa','czwartek','piątek','sobota'];
let previousDate=null;
for(const d of DAYS){
  const epoch=Date.parse(d.date+'T00:00:00Z');
  if(previousDate!==null&&epoch-previousDate!==86400000) errs.push(`${d.date}: przerwa lub powtórzenie dnia`);
  previousDate=epoch;
  if(d.dow!==dows[new Date(epoch).getUTCDay()]) errs.push(`${d.date}: błędny dzień tygodnia`);
  if(!['g','y','r'].includes(d.level)) errs.push(`${d.date}: brak poziomu tempa`);
  for(const field of ['start','end','focus','must','cut','check']) if(!d.brief?.[field]?.trim()) errs.push(`${d.date}: brak podsumowania ${field}`);
  if(d.stay&&!hotelIds.has(d.stay)) errs.push(`${d.date}: nieznany nocleg ${d.stay}`);
  let previousTime=epoch;
  for(const [time,title,,kind] of d.tl){
    const m=time.match(/^(?:(\d{1,2})\.(\d{2})\s+)?(\d{2}):(\d{2})$/);
    if(!m){errs.push(`${d.date}: niejednoznaczna godzina ${time}`);continue;}
    const base=m[1]?Date.UTC(+d.date.slice(0,4),+m[2]-1,+m[1]):epoch;
    const now=base+(+m[3]*60+ +m[4])*60000;
    if(+m[3]>23||+m[4]>59||now<previousTime) errs.push(`${d.date}: niespójna chronologia przy ${title}`);
    previousTime=now;
    if(kind&&!['lot','rezerwacja','opcja','bufor'].includes(kind)) errs.push(`${d.date}: nieznany status ${kind}`);
  }
}
const idsSource=src.slice(src.indexOf('const BOOKINGS = ['),src.indexOf('/* Dni zamknięcia atrakcji'));
const {BOOKINGS,DEADLINES}=runInNewContext(idsSource+';({BOOKINGS,DEADLINES})',{}, {timeout:1000});
if(new Set(BOOKINGS.map(x=>x.id)).size!==BOOKINGS.length) errs.push('Checklista: niestabilne/powtórzone identyfikatory');
if(DEADLINES.some(x=>!Number.isFinite(Date.parse(x.date)))) errs.push('Terminy: błędna data');
for(const m of src.matchAll(/\{date:'(\d{4}-\d\d-\d\d)'[\s\S]*?tl:\[([\s\S]*?)\],\s*facts:/g)){
  const t=[...m[2].matchAll(/\['(\d\d):(\d\d)'/g)].map(x=>+x[1]*60+ +x[2]);
  for(let i=1;i<t.length;i++) if(t[i]<t[i-1]&&!(m[1]==='2027-05-07'&&i===t.length-1)) errs.push(`${m[1]}: godziny nie rosną przy pozycji ${i+1}`);
}
const calc=JSON.parse(src.match(/const CALC = (\{[^}]*\})/)[1].replace(/(\w+):/g,'"$1":'));
if(DAYS.filter(d=>d.stay&&d.stay!=='auh').length!==calc.nights) errs.push('Liczba nocy w Japonii nie zgadza się z kalkulatorem');
const ticket=+src.match(/const TICKET = \{[^}]*total:(\d+)/)[1];
const sum=ticket+calc.nights*calc.nightRate+calc.transport+calc.days*calc.foodRate+calc.attractions+calc.extras, k=Math.round(sum/1000);
if(!readFileSync(join(DIR,'index.html'),'utf8').includes(`<b>~${k}<small>tys zł</small></b>`)) errs.push(`index: budżet w nagłówku ≠ ~${k} tys. (suma ${sum} zł)`);
if(!readFileSync(join(DIR,'druk.html'),'utf8').includes(`<b>~${k}<i>tys. zł</i></b>`)) errs.push(`druk: budżet ≠ ~${k} tys.`);
if(!readFileSync(join(DIR,'index.html'),'utf8').includes(`~${k} tys. zł`)) errs.push(`index: lista „Budżet” ≠ ~${k} tys.`);
if(errs.length){console.error(`CHECK: ${errs.length} problem(ów)`);errs.forEach(e=>console.error(' - '+e));process.exit(1);}
console.log(`CHECK OK: ${files.length} stron, budżet ~${k} tys. zł (${sum} zł)`);
