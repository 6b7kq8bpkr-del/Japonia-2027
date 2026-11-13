const { scryptSync, timingSafeEqual } = require('node:crypto');
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const frame = content => `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Prywatne rezerwacje · Japonia 2027</title><style>body{margin:0;background:#f5f1e8;color:#1c2530;font:1rem/1.6 system-ui}main{max-width:68rem;margin:auto;padding:2rem 1rem}h1,h2{font-family:Georgia,serif}a{color:#1b3a6b}article{padding:1.3rem;background:white;border:1px solid #ddd6c8;border-radius:.7rem;margin:1rem 0}dl{display:grid;grid-template-columns:10rem 1fr;gap:.5rem}dt{color:#62676b}dd{margin:0;overflow-wrap:anywhere}.note{color:#62676b}.row{display:flex;flex-wrap:wrap;gap:1rem}.row a{padding:.5rem 0}input,button{font:inherit;padding:.7rem;border:1px solid #999;border-radius:.3rem}button{background:#1b3a6b;color:white;cursor:pointer}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:.6rem;border-bottom:1px solid #ddd}.scroll{overflow:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}@media(max-width:36rem){dl{grid-template-columns:1fr;gap:.1rem}dd{margin-bottom:.6rem}}@media print{.row,form{display:none}body{background:white}article{break-inside:avoid}}</style></head><body><main>${content}</main></body></html>`;
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
    const groups=data.groups.map((g,i)=>`<section id="rodzina-${i}"><h2>${esc(g.name)}</h2>${g.items.map(r=>`<article><h3>${esc(r.title)}</h3><dl>${Object.entries(r.details).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></article>`).join('')}</section>`).join('');
    return res.status(200).send(frame(`<div class="row"><a href="/index.html">← Agenda / zamknij rezerwacje</a>${data.groups.map((g,i)=>`<a href="#rodzina-${i}">${esc(g.name)}</a>`).join('')}</div><h1>Rezerwacje obu rodzin</h1><p class="note">Aktualizacja: ${esc(data.updated)}. Dane prywatne. Nie zapisujemy ich w pamięci offline. Aby wydrukować, użyj funkcji drukowania przeglądarki.</p><p>${esc(data.summary)}</p>${groups}<h2>Pozostałe potwierdzenia i ustalenia</h2><pre>${esc(data.notes)}</pre><p class="note">Kwoty w JPY są podstawą rozliczenia. PLN zależą od kursu banku i prowizji. Nie zapisujemy danych karty ani kodów PIN Booking.</p><a href="/rezerwacje.html">Zamknij widok i wróć do logowania</a>`));
  }catch{return fail(503,'Nie można teraz odczytać rezerwacji. Spróbuj ponownie później.');}
};
