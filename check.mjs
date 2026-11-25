// Test po buildzie: daty, kwoty, linki, prywatność. Uruchom: node check.mjs
import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
const DIR=dirname(new URL(import.meta.url).pathname);
const files=[...readdirSync(DIR).filter(f=>f.endsWith('.html')&&!f.includes('artifact')&&!/ 2\.html$/.test(f)),...readdirSync(join(DIR,'days')).filter(f=>f.endsWith('.html')&&!/ 2\.html$/.test(f)).map(f=>'days/'+f)];
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
    if(h==='/api/rezerwacje') continue; // Dynamic authenticated endpoint tested separately.
    const t=!h?join(DIR,f):h.startsWith('/')?join(DIR,h):resolve(join(DIR,dirname(f)),h);
    if(!existsSync(t)) errs.push(`${f}: brak pliku ${h}`);
    else if(anchor&&t.endsWith('.html')&&!new RegExp(`id="${esc(anchor)}"`).test(readFileSync(t,'utf8'))) errs.push(`${f}: brak kotwicy #${anchor} w ${h||f}`);
  }
  if(f.startsWith('days/')){ const d=f.slice(5,15), want=`<span>${d.slice(8,10)}.${d.slice(5,7)}</span>`; if(!html.includes(want)) errs.push(`${f}: pigułka dnia nie pokazuje ${d.slice(8,10)}.${d.slice(5,7)}`); }
}
const src=readFileSync(join(DIR,'build.mjs'),'utf8');
const {DAYS,HOTELS,BOOKINGS,DEADLINES,F}=await import('./data/index.mjs'); const {UNIKALNE}=await import('./data/fakty.mjs');
// Słownik faktów: żaden token nie może zostać w wyniku, każdy fakt musi być użyty, a wartości unikalne nie mogą być wpisane ręcznie.
const sources=['data/dni.mjs','data/sprawy.mjs','data/hotele.mjs','data/atrakcje.html','build.mjs'].map(f=>[f,readFileSync(join(DIR,f),'utf8')]);
for(const f of files) if(/\{\{|\}\}/.test(strip(readFileSync(join(DIR,f),'utf8')))) errs.push(`${f}: niepodstawiony token {{…}}`);
// Tryb „dziś” w src/app.js ma chwile lotów wpisane w UTC; muszą odpowiadać godzinom z fakty.mjs (ZEA +4, Japonia +9, Polska +2).
{ const app=readFileSync(join(DIR,'src/app.js'),'utf8'), hm=k=>F[k].split(':').map(Number);
  const want=[['lot.auh.przylot',`Date.UTC(2027,3,27,${hm('lot.auh.przylot')[0]-4},${hm('lot.auh.przylot')[1]})`],['lot.auh.odlot',`Date.UTC(2027,3,28,${hm('lot.auh.odlot')[0]-4},${hm('lot.auh.odlot')[1]})`],
    ['lot.nrt.odlot',`Date.UTC(2027,4,7,${hm('lot.nrt.odlot')[0]-9},${hm('lot.nrt.odlot')[1]})`],['lot.waw.przylot',`Date.UTC(2027,4,8,${hm('lot.waw.przylot')[0]-2},${hm('lot.waw.przylot')[1]})`]];
  for(const [k,code] of want) if(!app.includes(code)) errs.push(`src/app.js: tryb „dziś” nie zgadza się z faktem ${k} (oczekiwane ${code})`); }
const allSrc=sources.map(x=>x[1]).join('\n');
for(const k of Object.keys(F)) if(!allSrc.includes('{{'+k+'}}')&&!allSrc.includes('{{'+k+'|h}}')) errs.push(`fakty: ${k} nie jest nigdzie użyty`);
for(const k of UNIKALNE) for(const [f,txt] of sources) if(txt.includes(F[k])) errs.push(`${f}: wartość „${F[k]}” wpisana ręcznie, użyj {{${k}}}`);
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
    if(kind&&!['lot','zarezerwowane','rezerwacja','opcja','bufor'].includes(kind)) errs.push(`${d.date}: nieznany status ${kind}`);
  }
}
// Dodatki do kroków (mapa, kartka dla taksówkarza) muszą wskazywać istniejący krok osi czasu.
{ const {STEPX}=await import('./data/index.mjs');
  for(const [date,o] of Object.entries(STEPX)){ const day=DAYS.find(d=>d.date===date);
    if(!day){errs.push(`STEPX: nieznany dzień ${date}`);continue;}
    for(const [time,x] of Object.entries(o)){ if(!day.tl.some(s=>s[0]===time)) errs.push(`STEPX ${date}: brak kroku o ${time}`);
      if(x.taxi&&x.taxi.length!==3) errs.push(`STEPX ${date} ${time}: kartka taksówkowa wymaga trzech pól`); } } }
if(new Set(BOOKINGS.map(x=>x.id)).size!==BOOKINGS.length) errs.push('Checklista: niestabilne/powtórzone identyfikatory');
if(DEADLINES.some(x=>!Number.isFinite(Date.parse(x.date)))) errs.push('Terminy: błędna data');
for(const d of DEADLINES) if(d.taskIds?.some(id=>!BOOKINGS.some(b=>b.id===id))) errs.push(`Termin ${d.id}: nieznane zadanie powiązane`);
const compact=readFileSync(join(DIR,'druk-skrot.html'),'utf8');
if((compact.match(/class="travel-day"/g)||[]).length!==DAYS.length) errs.push('Skrócony wydruk: brak dnia');
for(const d of DAYS) if(!compact.includes(`days/${d.date}.html`)) errs.push(`Skrócony wydruk: brak odsyłacza dnia ${d.date}`);

const calc=JSON.parse(src.match(/const CALC = (\{[^}]*\})/)[1].replace(/(\w+):/g,'"$1":'));
if(DAYS.filter(d=>d.stay&&d.stay!=='auh').length!==calc.nights) errs.push('Liczba nocy w Japonii nie zgadza się z kalkulatorem');
const ticket=+src.match(/const TICKET = \{[^}]*total:(\d+(?:\.\d+)?)/)[1];
const sum=ticket+calc.nights*calc.nightRate+calc.transport+calc.days*calc.foodRate+calc.attractions+calc.extras, k=Math.round(sum/1000);
const {DP_TOTALS}=await import('./data/druga-para.mjs');
const groupSum=sum+Object.values(DP_TOTALS).reduce((total,n)=>total+n,0);
// Kategorie obu rodzin muszą dawać te same sumy w zestawieniu i wydruku.
const {DP_KOSZTY,DP_KUPIONE,DP_KOLEJ}=await import('./data/druga-para.mjs');
const categories=['flights','hotels','transport','food','attractions','extras'];
if(categories.some(key=>!Number.isFinite(DP_TOTALS[key]))||DP_KOSZTY.some(item=>!categories.includes(item.category))) errs.push('Budżet drugiej rodziny: brak lub nieznana kategoria');
const second=DP_KUPIONE.total+DP_KOSZTY.reduce((n,item)=>n+item.zl,0);
if(Math.abs(second-Object.values(DP_TOTALS).reduce((n,v)=>n+v,0))>0.01) errs.push('Budżet drugiej rodziny: błędna suma kategorii');
if(DP_KOSZTY.filter(item=>item.co.startsWith('Shinkansen')).length!==1 || (DP_KOLEJ.totalJPY!==2*DP_KOLEJ.perTripJPY || DP_KOLEJ.paidTotalJPY!==DP_KOLEJ.totalJPY+DP_KOLEJ.kodamaJPY)) errs.push('Shinkanseny drugiej rodziny: zdublowanie lub niezgodne odcinki');
const money=n=>Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' zł';
for(const f of ['index.html','druga-para.html','druk.html']) {
 const html=readFileSync(join(DIR,f),'utf8');
 if(/Łączny budżet|budżet siedmiu osób|data-our-budget|group-our-total/.test(html)) errs.push(`${f}: publiczne porównanie budżetów`);
}
// Prywatność: nazwiska gości i numery rezerwacji z private/reservations.json nie mogą trafić do plików publicznych.
// Plik prywatny jest poza git i Vercel; bez niego test się pomija. Komunikat nie pokazuje samej wartości.
{
  const privPath=join(DIR,'private','reservations.json');
  if(existsSync(privPath)){
    const priv=JSON.parse(readFileSync(privPath,'utf8')), PUBLIC_NAMES=new Set(['Urban','Marcel','Martyna','Joanna','Marcin','Tomasz','Adult','Adults','Child','Children','Dorosły','Dorośli','Dziecko','Dzieci']);
    const secrets=[];
    for(const g of priv.groups||[]) for(const it of g.items||[]) for(const [k,v] of Object.entries(it.details||{})){
      if(/Goście/.test(k)) for(const w of String(v).match(/\p{Lu}[\p{Ll}\p{Lu}]{2,}/gu)||[]) if(!PUBLIC_NAMES.has(w)) secrets.push([k,w]);
      if(/Numer|ID|Potwierdzenie/.test(k)) for(const w of String(v).match(/[A-Za-z0-9-]*\d{4,}[A-Za-z0-9-]*/g)||[]) if(w.length>=6) secrets.push([k,w]); // krótsze numery dają fałszywe trafienia (daty, współrzędne)
    }
    const pub=[]; const walk=d=>{for(const f of readdirSync(d)){ if(/^(private|node_modules|data|src|\.git|\.vercel)$/.test(f)||/ 2\./.test(f)) continue; const q=join(d,f); if(statSync(q).isDirectory()) walk(q); else if(/\.(html|ics|js|webmanifest|json|css)$/.test(f)) pub.push(q);}};
    walk(DIR);
    const texts=pub.map(f=>[f,readFileSync(f,'utf8')]);
    for(const [k,w] of secrets) for(const [f,t] of texts) if(t.includes(w)) errs.push(`${f.slice(DIR.length+1)}: wartość z pola „${k}” z prywatnych rezerwacji w pliku publicznym`);
  }
}
if(errs.length){console.error(`CHECK: ${errs.length} problem(ów)`);errs.forEach(e=>console.error(' - '+e));process.exit(1);}
console.log(`CHECK OK: ${files.length} stron, budżet ~${k} tys. zł (${sum} zł)`);
