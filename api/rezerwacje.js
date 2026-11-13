const { scryptSync, timingSafeEqual } = require('node:crypto');
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const qrLinks = require('../lib/reservation-links.json');
const stateNames={done:'Potwierdzone',waiting:'Oczekujemy',todo:'Do załatwienia'};
const badge = state => `<span class="badge ${state in stateNames?state:'todo'}">${esc(stateNames[state]||stateNames.todo)}</span>`;
const linkBox = key => {const item=qrLinks[key];return item?`<figure class="qr">${item.svg}<figcaption><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.label)} ↗</a><small>QR otwiera link. To nie bilet ani voucher.</small></figcaption></figure>`:'';};
const frame = content => `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Prywatne rezerwacje · Japonia 2027</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f1e8;color:#1c2530;font:1rem/1.55 system-ui}main{max-width:72rem;margin:auto;padding:1.5rem}h1,h2,h3{line-height:1.2}h1,h2{font-family:Georgia,serif}h1{font-size:clamp(2rem,5vw,3rem)}a{color:#1b3a6b;text-underline-offset:.2em}section{scroll-margin-top:1rem}article{padding:1.25rem;background:white;border:1px solid #ddd6c8;border-radius:.65rem;margin:1rem 0}article header{display:flex;justify-content:space-between;gap:1rem;align-items:start}h3{margin:0 0 .75rem;font-size:1.15rem}.badge{display:inline-block;white-space:nowrap;font-size:.78rem;font-weight:700;border:1px solid;padding:.2rem .55rem;border-radius:1rem}.done{color:#246047;background:#eef8f1}.waiting{color:#825607;background:#fff6da}.todo{color:#505c6b;background:#f0f3f6}.note,small{color:#62676b}.row{display:flex;flex-wrap:wrap;gap:.7rem}.row a{padding:.45rem .7rem;border:1px solid #cdc8bd;border-radius:.3rem;text-decoration:none}.overview{display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem;margin:1.5rem 0}.overview a{display:block;border:1px solid #cdc8bd;padding:1rem;color:inherit;text-decoration:none;border-radius:.5rem}.overview b{display:block;font-size:1.7rem}.cards{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.cards article{margin:0}.code{font:700 1.55rem/1.3 ui-monospace,monospace;letter-spacing:.04em;user-select:all;overflow-wrap:anywhere;margin:.3rem 0 1rem}.code-label{font-size:.75rem;text-transform:uppercase;letter-spacing:.06em}.next{padding:.75rem;border-left:3px solid #b98a34;background:#faf7ef}.qr{display:flex;align-items:center;gap:1rem;margin:1rem 0 0}.qr svg{width:116px;height:116px;flex:0 0 116px;background:#fff}.qr small{display:block;font-size:.72rem;max-width:22rem;margin-top:.35rem}dl{display:grid;grid-template-columns:9rem 1fr;gap:.4rem}dt{color:#62676b}dd{margin:0;overflow-wrap:anywhere}details{margin:1rem 0}summary{cursor:pointer;font-weight:600}input,button{font:inherit;padding:.7rem}footer{margin:2rem 0;border-top:1px solid #ccc;padding-top:1rem}.task{border-left:4px solid #b98a34}.contact{overflow-wrap:anywhere}.summary{background:#fff;padding:1rem;border-radius:.5rem}a:focus-visible,summary:focus-visible{outline:3px solid #b98a34;outline-offset:3px}@media(max-width:640px){main{padding:1rem}.cards{grid-template-columns:1fr}article header{display:block}.badge{margin-bottom:.6rem}.overview a{padding:.65rem;font-size:.8rem}dl{grid-template-columns:1fr}dd{margin-bottom:.5rem}}@media print{.row,.overview{display:none}body{background:white}main{padding:0}.cards{display:block}article{break-inside:avoid}details{display:block}details>*{display:block}h2{break-after:avoid}.qr svg{width:100px;height:100px;flex-basis:100px}}
</style></head><body><main>${content}</main></body></html>`;
function dashboard(data){
 const items=data.groups.flatMap(g=>g.items), tasks=data.tasks||[];
 const counts={done:items.filter(r=>r.state==='done').length,waiting:tasks.filter(t=>t.state==='waiting').length,todo:tasks.filter(t=>t.state!=='waiting').length};
 const card=r=>`<article><header><h3>${esc(r.title)}</h3>${badge(r.state||'todo')}</header>${r.details['Termin']?`<p>${esc(r.details['Termin'])}</p>`:''}${r.details['Numer rezerwacji']?`<div class="code-label">Numer rezerwacji</div><p class="code">${esc(r.details['Numer rezerwacji'])}</p>`:''}<p>${esc(r.details.Status||'Status wymaga sprawdzenia')}</p>${r.next?`<p class="next"><b>Następny krok:</b> ${esc(r.next)}</p>`:''}${r.details['Bezpłatne anulowanie']?`<p><b>Anuluj bez opłaty do:</b><br>${esc(r.details['Bezpłatne anulowanie'])}</p>`:''}${r.details['Płatność']?`<p><b>Płatność:</b> ${esc(r.details['Płatność'])}</p>`:''}<details><summary>Szczegóły i koszt</summary><dl>${Object.entries(r.details).filter(([k])=>!['Numer rezerwacji','Status','Termin','Bezpłatne anulowanie','Płatność'].includes(k)).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></details>${linkBox(r.link)}</article>`;
 const groupSections=data.groups.map((g,i)=>`<section id="rodzina-${i}"><h2>${esc(g.name)}</h2><div class="cards">${g.items.map(card).join('')}</div></section>`).join('');
 const taskSection=(state,title)=>`<section id="${state}"><h2>${title}</h2>${tasks.filter(t=>(t.state==='waiting'?'waiting':'todo')===state).map(t=>`<article class="task"><header><h3>${esc(t.title)}</h3>${badge(t.state)}</header><p>${esc(t.note)}</p>${t.due?`<p><b>Kiedy:</b> ${esc(t.due)}</p>`:''}${linkBox(t.link)}</article>`).join('')||'<p>Brak pozycji.</p>'}</section>`;
 return `<nav class="row" aria-label="Prywatne rezerwacje"><a href="/index.html">← Agenda</a>${data.groups.map((g,i)=>`<a href="#rodzina-${i}">${esc(g.name)}</a>`).join('')}<a href="#waiting">Oczekujemy</a><a href="#todo">Do załatwienia</a><a href="/rezerwacje.html">Zamknij</a></nav><h1>Co mamy gotowe na podróż</h1><p class="note">Stan zapisany ${esc(data.updated)}. To zestawienie potwierdzeń, nie automatyczny odczyt od przewoźników.</p><div class="overview"><a href="#potwierdzenia"><b>${counts.done}</b>potwierdzonych rezerwacji</a><a href="#waiting"><b>${counts.waiting}</b>spraw oczekujących</a><a href="#todo"><b>${counts.todo}</b>rzeczy do załatwienia</a></div><p class="summary"><b>Zarezerwowane ≠ opłacone.</b> Hotele mają własne terminy płatności. Długie shinkanseny są opłacone, ale finalne miejsca i bilety do wejścia trzeba jeszcze odebrać. Numery można zaznaczyć i skopiować.</p>${taskSection('waiting','Czekamy na potwierdzenie')}<div id="potwierdzenia">${groupSections}</div>${taskSection('todo','Pozostało do załatwienia')}<details><summary>Rozliczenie noclegów obu rodzin</summary><p>${esc(data.summary)}</p></details><section id="na-miejscu"><h2>Na miejscu</h2><p><b>Hotel:</b> pokaż paszport i numer rezerwacji. <b>Pociąg:</b> użyj właściwego QR biletu lub przypisanej karty IC; sam numer rezerwacji nie otwiera bramki. Kody QR poniżej i na kartach prowadzą do map lub systemów obsługi.</p><p class="contact">Hanaori: <a href="tel:+81460838739">+81 460 83 8739</a><br>Stopover: <a href="mailto:AbuDhabiStopover@etihad.com">AbuDhabiStopover@etihad.com</a></p></section><footer class="note">Dane prywatne. Brak zapisu w pamięci offline i brak kodów PIN Booking. Wydruk: menu przeglądarki → Drukuj / Zapisz jako PDF. Zapisany plik zawiera dane prywatne.</footer>`;
}
module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control','no-store');
  res.setHeader('Vercel-CDN-Cache-Control','no-store');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader('Content-Type','text/html; charset=utf-8');
  const fail=(status,message)=>res.status(status).send(frame(`<h1>Rezerwacje prywatne</h1><p>${message}</p><a href="/rezerwacje.html">Wróć do logowania</a>`));
  // Only POST can return private content. Even an older service worker never caches POST.
  if(req.method!=='POST'){res.setHeader('Allow','POST');return fail(405,'Otwórz zakładkę rezerwacji i podaj hasło.');}
  const origin=req.headers.origin;
  if(origin && origin!==`https://${req.headers.host}` && origin!==`http://${req.headers.host}`)return fail(403,'Otwórz formularz na stronie planu.');
  if(Number(req.headers['content-length']||0)>2048)return fail(413,'Formularz jest zbyt duży.');
  let body=req.body;
  if(typeof body==='string')body=Object.fromEntries(new URLSearchParams(body));
  const password=body?.password;
  const config=process.env.RESERVATIONS_PASSWORD_HASH;
  const raw=process.env.RESERVATIONS_DATA;
  if(!config||!raw)return fail(503,'Zakładka nie jest jeszcze skonfigurowana. Spróbuj ponownie później.');
  if(typeof password!=='string'||password.length>256)return fail(401,'Nieprawidłowe hasło.');
  try{
    const [salt,hash]=config.split(':');
    const expected=Buffer.from(hash,'hex');
    const actual=scryptSync(password,salt,32);
    if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return fail(401,'Nieprawidłowe hasło.');
    const data=JSON.parse(raw);
    return res.status(200).send(frame(dashboard(data)));
  }catch{return fail(503,'Nie można teraz odczytać rezerwacji. Spróbuj ponownie później.');}
};
