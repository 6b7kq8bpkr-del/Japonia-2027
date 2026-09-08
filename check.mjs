// Test po buildzie: daty, kwoty, linki, prywatność. Uruchom: node check.mjs
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
const DIR=dirname(new URL(import.meta.url).pathname);
const files=[...readdirSync(DIR).filter(f=>f.endsWith('.html')&&!f.includes('artifact')),...readdirSync(join(DIR,'days')).filter(f=>f.endsWith('.html')).map(f=>'days/'+f)];
const errs=[]; const strip=s=>s.replace(/<script[\s\S]*?<\/script>/g,'');
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
for(const f of files){
  const html=readFileSync(join(DIR,f),'utf8'), body=strip(html);
  if(/\bundefined\b|\bNaN\b/.test(body)) errs.push(`${f}: 'undefined'/'NaN' w treści`);
  if(/EYH\d{6}|gq-[a-z0-9]{16}|#\d{7}\b|HMSHT\d+/.test(body)) errs.push(`${f}: numer rezerwacji/sprawy w publicznym HTML`);
  for(const m of body.matchAll(/(?:href|src)="([^"#?]+)(?:#([^"]*))?"/g)){
    const h=m[1]; if(/^(https?:|data:|mailto:|tel:|\/\/)/.test(h)) continue;
    const t=h.startsWith('/')?join(DIR,h):resolve(join(DIR,dirname(f)),h);
    if(!existsSync(t)) errs.push(`${f}: brak pliku ${h}`);
    else if(m[2]&&t.endsWith('.html')&&!new RegExp(`id="${esc(m[2])}"`).test(readFileSync(t,'utf8'))) errs.push(`${f}: brak kotwicy #${m[2]} w ${h}`);
  }
  if(f.startsWith('days/')){ const d=f.slice(5,15), want=`<span>${d.slice(8,10)}.${d.slice(5,7)}</span>`; if(!html.includes(want)) errs.push(`${f}: pigułka dnia nie pokazuje ${d.slice(8,10)}.${d.slice(5,7)}`); }
}
const src=readFileSync(join(DIR,'build.mjs'),'utf8');
for(const m of src.matchAll(/\{date:'(\d{4}-\d\d-\d\d)'[\s\S]*?tl:\[([\s\S]*?)\],\s*facts:/g)){
  const t=[...m[2].matchAll(/\['(\d\d):(\d\d)'/g)].map(x=>+x[1]*60+ +x[2]);
  for(let i=1;i<t.length;i++) if(t[i]<t[i-1]&&!(m[1]==='2027-05-07'&&i===t.length-1)) errs.push(`${m[1]}: godziny nie rosną przy pozycji ${i+1}`);
}
const calc=JSON.parse(src.match(/const CALC = (\{[^}]*\})/)[1].replace(/(\w+):/g,'"$1":'));
const ticket=+src.match(/const TICKET = \{[^}]*total:(\d+)/)[1];
const sum=ticket+calc.nights*calc.nightRate+calc.transport+calc.days*calc.foodRate+calc.attractions+calc.extras, k=Math.round(sum/1000);
if(!readFileSync(join(DIR,'index.html'),'utf8').includes(`<b>~${k}<small>tys zł</small></b>`)) errs.push(`index: budżet w nagłówku ≠ ~${k} tys. (suma ${sum} zł)`);
if(!readFileSync(join(DIR,'druk.html'),'utf8').includes(`<b>~${k}<i>tys. zł</i></b>`)) errs.push(`druk: budżet ≠ ~${k} tys.`);
if(!readFileSync(join(DIR,'index.html'),'utf8').includes(`~${k} tys. zł`)) errs.push(`index: lista „Budżet” ≠ ~${k} tys.`);
if(errs.length){console.error(`CHECK: ${errs.length} problem(ów)`);errs.forEach(e=>console.error(' - '+e));process.exit(1);}
console.log(`CHECK OK: ${files.length} stron, budżet ~${k} tys. zł (${sum} zł)`);
