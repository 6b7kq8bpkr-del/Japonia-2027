import fs from 'node:fs';
const DIR = '/Users/urban/Desktop/Piaskownica/japonia-2027';
fs.mkdirSync(DIR + '/days', { recursive: true });
fs.mkdirSync(DIR + '/assets', { recursive: true });

/* ===================== CENY LOTÓW — JEDYNE ŹRÓDŁO PRAWDY =====================
   Aktualizowane automatycznie przez zadanie `japonia-cena-lotu` (co tydzień).
   Ręcznie: dopisz nowy obiekt NA KOŃCU tablicy CHECKS i uruchom `node build.mjs`.
   Ceny: zł za 1 DOROSŁEGO, w obie strony, WAW→Tokio, wylot 3.05 / powrót 15.05.2027. */
const AIRLINES = {
  etihad:   {name:'Etihad',        via:'Abu Zabi', dur:'17 h 55 min', stops:1, hotel:true, col:'#c8402c', star:true, q:40, qpos:'#10 na świecie',
             note:'Trasa z planu — w cenie darmowy nocleg 4★ w Abu Zabi (stopover)'},
  emirates: {name:'Emirates',      via:'Dubaj',    dur:'19 h 25 min', stops:1, col:'#1b3a6b', q:60, qpos:'#8 na świecie',
             note:'Solidna alternatywa, ale bez darmowego stopoveru'},
  finnair:  {name:'Finnair / JAL', via:'Helsinki', dur:'17 h 5 min',  stops:1, col:'#2f6d4f', q:20, qpos:'#7 wśród hybrydowych',
             note:'Najkrótsza przesiadka i najniższa emisja wśród przesiadkowych'},
  lot:      {name:'LOT',           via:'bezpośredni', dur:'12 h 40 min', stops:0, col:'#b98a34', q:0, qpos:'#25 na świecie',
             note:'Najszybszy, bez przesiadki — dopłata za wygodę ok. 1 000 zł/os.'},
  qatar:    {name:'Qatar Airways', via:'Doha',     dur:'20 h',        stops:1, col:'#6b4b8a', q:100, qpos:'#1 na świecie',
             note:'Bywa mocno przeceniany w Travel Festival (grudzień)'},
  turkish:  {name:'Turkish',       via:'Stambuł',  dur:'15 h 50 min', stops:1, col:'#7a8087', q:80, qpos:'#7 na świecie',
             note:'Rzadko konkurencyjny cenowo na tej trasie'},
};
/* SYSTEM SCORINGOWY — trzy kryteria, każde punktowane 0–100, wynik = średnia ważona.
   Kwoty służą WYŁĄCZNIE do wyliczenia WAG (nie doliczamy złotówek do ceny biletu):
   • reguła użytkownika: 8 h w drodze ≡ 800 zł na bilecie  → 100 zł za godzinę,
   • wygoda: brak przesiadki + darmowy nocleg stopover ≈ 750 zł ekwiwalentu.
   Wagi wynikają z rozpiętości każdego kryterium w danym zestawieniu przeliczonej na złotówki. */
const SCORE = {plnPerHour:100, comfortPln:750};
/* wygoda liczona obiektywnie: 100 pkt bazowo, −30 za przesiadkę, +20 za darmowy nocleg w pakiecie */
const comfortOf = A => 100 - (A.stops||0)*30 + (A.hotel?20:0);
const hrsOf = s => {const m=String(s).match(/(\d+)\s*h(?:\s*(\d+))?/); return m ? (+m[1] + (+(m[2]||0))/60) : 0;};
const hm = h => `${Math.floor(h)} h ${String(Math.round((h%1)*60)).padStart(2,'0')}`;
const CHECKS = [
  {date:'2026-07-26', p:{etihad:3910, emirates:4262, finnair:4928, lot:5288, qatar:5465, turkish:6423}},
  {date:'2026-07-27', p:{etihad:4228, emirates:4262, finnair:4727, lot:5248}},
  {date:'2026-07-29', p:{etihad:4225, emirates:4257, finnair:4723, lot:5249, qatar:5219, turkish:6938}},
];
/* Siatka dat z Google Flights — cena 12-dniowej podróży wg DNIA WYLOTU (1 dorosły) */
const DATEGRID = {src:'2026-07-26', days:[[1,4400],[2,4420],[3,3910],[4,4260],[5,4150],[6,4150],[7,4260],
  [8,4260],[9,4150],[10,4260],[11,4050],[12,3940],[13,4150],[14,4260],[15,4260],[16,4150]]};
/* Porównanie realnych wariantów terminu (ceny Etihad, sprawdzone na żywo) */
const PERIODS = [
  {label:'3–15 maja', sub:'obecny plan', price:3910, best:true,
   pros:['Najniższy punkt w całej siatce dat','Powrót w SOBOTĘ — niedziela na reset przed szkołą','Start w majówkę (1–3.05) oszczędza dni urlopu','Przylot 5.05 — Golden Week właśnie się kończy'],
   cons:['Pierwsze 2 dni w Tokio jeszcze w ogonie Golden Week']},
  {label:'2–15 maja', sub:'dzień wcześniej', price:4520,
   pros:['Druga noc w Abu Zabi gratis (pakiet stopover)','Łagodniejszy reset przed lotem do Tokio'],
   cons:['Wyższa taryfa — wylot wpada w ogon Golden Week','Dodatkowa doba ląduje w Abu Zabi, nie w Japonii','Druga pełna doba w 35–40°C z dziećmi']},
  {label:'7–19 maja', sub:'cały po Golden Week', price:4657,
   pros:['Zero Golden Week','Więcej dni turnieju sumo do wyboru (9–23.05)'],
   cons:['Najdroższy z trzech wariantów','Powrót w ŚRODĘ — jet lag prosto w szkołę i pracę','Traci majówkę = więcej dni urlopu']},
];
const FLIGHT = {airline:'Etihad'};
FLIGHT.history = CHECKS.filter(c=>c.p.etihad!=null).map(c=>[c.date, c.p.etihad]);
FLIGHT.adult   = FLIGHT.history[FLIGHT.history.length-1][1];
FLIGHT.checked = FLIGHT.history[FLIGHT.history.length-1][0];
FLIGHT.prev    = FLIGHT.history.length > 1 ? FLIGHT.history[FLIGHT.history.length-2][1] : null;
// rodzina 2+2 = 3 taryfy dorosłe + 1 dziecięca (młodsze <11 lat, ~20% taniej)
FLIGHT.family  = Math.round((FLIGHT.adult*3 + FLIGHT.adult*0.8)/100)*100;
FLIGHT.band    = FLIGHT.adult <= 3500 ? 'okazja' : (FLIGHT.adult < 4600 ? 'typowa' : 'górka');
// własny formatter — Node w tym środowisku ma okrojone ICU i ignoruje locale pl-PL
const plz  = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' zł';
const dpl  = iso => {const [y,m,d]=iso.split('-');return `${+d}.${m}.${y}`;};
/* wykres trendu — rysuje się sam z tablicy CHECKS, rośnie z każdym odczytem */
const priceChart = () => {
  const keys = Object.keys(AIRLINES).filter(k => CHECKS.some(c => c.p[k] != null));
  const all  = CHECKS.flatMap(c => Object.values(c.p));
  const lo = Math.floor((Math.min(...all) - 250)/500)*500;
  const hi = Math.ceil ((Math.max(...all) + 250)/500)*500;
  const W=760,H=300,L=62,R=16,T=14,B=50, single = CHECKS.length===1;
  const x = i => single ? (L+(W-L-R)/2) : L + i*(W-L-R)/(CHECKS.length-1);
  const y = v => T + (hi-v)*(H-T-B)/(hi-lo);
  const ticks = [0,1,2,3,4].map(i => lo + i*(hi-lo)/4);
  const grid = ticks.map(v=>`<line x1="${L}" y1="${y(v).toFixed(1)}" x2="${W-R}" y2="${y(v).toFixed(1)}" stroke="rgba(28,37,48,.10)" stroke-width="1"/>`+
    `<text x="${L-10}" y="${(y(v)+4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6a7078">${plz(v).replace(' zł','')}</text>`).join('');
  const xlab = CHECKS.map((c,i)=>`<text x="${x(i).toFixed(1)}" y="${H-B+22}" text-anchor="middle" font-size="11" fill="#6a7078">${dpl(c.date).slice(0,5)}</text>`).join('');
  const lines = keys.map(k=>{
    const pts = CHECKS.map((c,i)=> c.p[k]!=null ? [x(i), y(c.p[k])] : null).filter(Boolean);
    if(!pts.length) return '';
    const path = pts.map(p=>`${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const dots = pts.map(p=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.5" fill="#fffdf8" stroke="${AIRLINES[k].col}" stroke-width="2.5"/>`).join('');
    return (pts.length>1?`<polyline points="${path}" fill="none" stroke="${AIRLINES[k].col}" stroke-width="${AIRLINES[k].star?3.2:2}" stroke-linejoin="round" stroke-linecap="round"${AIRLINES[k].star?'':' stroke-dasharray="5 4" opacity=".8"'}/>`:'')+dots;
  }).join('');
  const legend = keys.map(k=>`<span class="lgd"><i style="background:${AIRLINES[k].col}"></i>${AIRLINES[k].name}${AIRLINES[k].star?' ★':''}</span>`).join('');
  return `<div class="chartwrap"><svg viewBox="0 0 ${W} ${H}" width="100%" height="auto" role="img" aria-label="Wykres cen lotów w czasie">
    ${grid}${xlab}${lines}
  </svg></div><div class="lgds">${legend}</div>
  <p class="note" style="margin-top:8px">Ceny za 1 dorosłego, w obie strony, WAW→Tokio (3–15.05.2027). Linia ciągła = Etihad (trasa z planu). Wykres rozbudowuje się przy każdym cotygodniowym sprawdzeniu.</p>`;
};
const trend = () => {
  if(FLIGHT.prev==null) return '';
  const d = FLIGHT.adult - FLIGHT.prev;
  if(d===0) return ' <b style="color:var(--muted)">→ bez zmian</b>';
  return d<0 ? ` <b style="color:var(--success)">▼ ${plz(Math.abs(d))} taniej</b>`
             : ` <b style="color:var(--shu)">▲ ${plz(d)} drożej</b>`;
};

/* ============================ SHARED CSS ============================ */
const WAVE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='24' viewBox='0 0 48 24'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.07' stroke-width='1'%3E%3Cpath d='M0 24a24 24 0 0148 0'/%3E%3Cpath d='M0 24a17 17 0 0148 0'/%3E%3Cpath d='M0 24a10 10 0 0148 0'/%3E%3C/g%3E%3C/svg%3E";

const CSS = `:root{
  --paper:#f5f1e8; --panel:#fffdf8; --ink:#1c2530; --muted:#6a7078;
  --line:rgba(28,37,48,.13); --ai:#1b3a6b; --ai-dark:#122740; --shu:#c8402c;
  --sakura:#f0e6df; --kin:#b98a34; --success:#2f6d4f;
  --shadow:0 22px 60px rgba(20,30,45,.12); --shadow-sm:0 2px 10px rgba(20,30,45,.07);
  --radius:22px; --serif:Georgia,"Times New Roman",serif;
  --sans:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  color-scheme:light;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);
  line-height:1.6;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
img{max-width:100%}
a{color:var(--ai)}
.wrap{max-width:880px;margin:0 auto;padding:0 20px}

/* top nav */
.topbar{position:sticky;top:0;z-index:50;backdrop-filter:blur(8px);
  background:linear-gradient(var(--paper),rgba(245,241,232,.86));padding:12px 0}
.topbar .navrow{max-width:880px;margin:0 auto;background:var(--ai-dark);border-radius:999px;
  display:flex;align-items:center;gap:8px;padding:9px 12px 9px 20px;box-shadow:var(--shadow-sm);
  flex-wrap:wrap;min-height:44px}
.brand{font-family:var(--serif);color:#fff;font-weight:500;font-size:16px;letter-spacing:.06em;
  text-decoration:none;margin-right:auto;white-space:nowrap}
.brand b{color:var(--kin);font-weight:500}
.tabs{display:flex;gap:6px;flex-wrap:wrap}
.tabs a{color:rgba(255,255,255,.82);text-decoration:none;font-size:13.5px;font-weight:600;
  padding:7px 14px;border-radius:999px;white-space:nowrap;transition:.15s}
.tabs a:hover{background:rgba(255,255,255,.12);color:#fff}
.tabs a.on{background:var(--paper);color:var(--ai-dark)}
  @media(max-width:640px){
    .topbar{padding:10px 0}
    .topbar .navrow{flex-wrap:nowrap;gap:8px;padding:8px 10px 8px 16px}
    .brand{font-size:14px;margin-right:8px;flex:0 0 auto}
    .tabs{flex:1 1 auto;min-width:0;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
    .tabs::-webkit-scrollbar{display:none}
    .tabs a{padding:7px 12px}
  }

/* day pills */
.pills{max-width:880px;margin:14px auto 0;padding:0 20px;display:flex;gap:8px;overflow-x:auto;
  scrollbar-width:none;padding-bottom:4px}
.pills::-webkit-scrollbar{display:none}
.pills a{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;
  width:52px;height:52px;border-radius:15px;background:var(--panel);border:1px solid var(--line);
  text-decoration:none;color:var(--muted);box-shadow:var(--shadow-sm);transition:.15s}
.pills a:hover{border-color:var(--ai);color:var(--ink)}
.pills a b{font-size:16px;font-weight:800;color:var(--ink);line-height:1}
.pills a span{font-size:10px;margin-top:2px}
.pills a.on{background:var(--ai);border-color:var(--ai)}
.pills a.on b,.pills a.on span{color:#fff}

/* hero */
.hero{position:relative;overflow:hidden;color:#fff;border-radius:var(--radius);
  margin:20px 0 0;padding:44px 34px 38px;box-shadow:var(--shadow)}
.hero::after{content:"";position:absolute;inset:0;background-image:url("${WAVE}");
  background-size:56px;opacity:.5;pointer-events:none}
.hero>*{position:relative;z-index:1}
.hero .eyebrow,.hero h1,.hero .lead{text-shadow:0 1px 16px rgba(0,0,0,.5),0 1px 3px rgba(0,0,0,.4)}
.eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:12px;font-weight:700;
  opacity:.95;margin:0 0 12px}
.hero h1{font-family:var(--serif);font-weight:500;letter-spacing:-.01em;line-height:1.02;
  margin:0;font-size:clamp(34px,7vw,72px);text-wrap:balance}
.hero .lead{margin:16px 0 0;font-size:clamp(15px,2.3vw,18px);max-width:60ch;opacity:.95}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}
.chip{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);
  border-radius:999px;padding:6px 13px;font-size:12.5px;font-weight:600;backdrop-filter:blur(3px)}

/* ---- home hero (cinematic) ---- */
.hero.home{min-height:clamp(450px,66vh,620px);display:flex;flex-direction:column;justify-content:center;
  padding:56px 42px 62px;background:none}
.hero.home .hbg{position:absolute;top:-15%;left:-5%;width:110%;height:130%;z-index:0;overflow:hidden;will-change:transform}
.hero.home .hbg-img{position:absolute;inset:0;background-size:cover;background-position:center 42%;
  animation:kenburns 30s ease-in-out infinite alternate;will-change:transform}
.hero.home .hgrad{position:absolute;inset:0;z-index:0;
  background:linear-gradient(118deg,rgba(20,45,88,.52),rgba(138,43,35,.30) 62%),
             linear-gradient(180deg,rgba(10,18,30,.14) 0%,transparent 30%,transparent 50%,rgba(8,14,26,.62) 100%)}
.hero.home::after{opacity:.3}
.hero.home .hero-inner{position:relative;z-index:2}
.hero.home h1{font-size:clamp(42px,8.6vw,88px)}
.hero.home .eyebrow{animation:hup .8s .05s both}
.hero.home h1{animation:hup .9s .16s both}
.hero.home .lead{animation:hup .9s .3s both}
.hero.home .chips{animation:hup .9s .42s both}
.scrollcue{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:2;color:rgba(255,255,255,.92);
  animation:bob 1.9s ease-in-out infinite;filter:drop-shadow(0 1px 5px rgba(0,0,0,.5));transition:opacity .3s}
@keyframes kenburns{from{transform:scale(1.05)}to{transform:scale(1.17)}}
@keyframes hup{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@keyframes bob{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(7px)}}
/* ---- secondary heroes: ken-burns + entrance (no parallax) ---- */
.hero.kb .hbg{position:absolute;inset:0;z-index:0;overflow:hidden}
.hero.kb .hbg-img{position:absolute;inset:0;animation:kenburns 34s ease-in-out infinite alternate;will-change:transform}
.hero.kb .hero-inner{position:relative;z-index:2}
.hero.kb .eyebrow{animation:hup .7s .05s both}
.hero.kb h1{animation:hup .8s .14s both}
.hero.kb .lead{animation:hup .8s .26s both}
.hero.kb .chips{animation:hup .8s .36s both}
@media(prefers-reduced-motion:reduce){
  .hero.home .hbg-img,.scrollcue,
  .hero.home .eyebrow,.hero.home h1,.hero.home .lead,.hero.home .chips,
  .hero.kb .hbg-img,.hero.kb .eyebrow,.hero.kb h1,.hero.kb .lead,.hero.kb .chips{animation:none}
}

/* sections */
main{padding-bottom:40px}
section{margin-top:34px}
.stitle{font-family:var(--serif);font-weight:500;font-size:clamp(21px,3.6vw,27px);
  margin:0 0 16px;letter-spacing:-.01em}
.card{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);
  box-shadow:var(--shadow);padding:22px 24px}
.lead-p{color:var(--muted);font-size:15.5px;margin:0 0 18px;max-width:66ch}

/* timeline */
.tline{list-style:none;margin:0;padding:0}
.tline li{display:grid;grid-template-columns:64px 1fr;gap:14px;position:relative}
.tline .tm{font-weight:800;font-size:13px;color:var(--ai);text-align:right;padding-top:3px;
  font-variant-numeric:tabular-nums;white-space:nowrap}
.tline .bd{border-left:2px solid var(--line);padding:0 0 24px 22px;position:relative}
.tline li:last-child .bd{border-color:transparent}
.tline .bd::before{content:"";position:absolute;left:-8px;top:5px;width:13px;height:13px;
  border-radius:50%;background:var(--shu);border:3px solid var(--panel);box-shadow:0 0 0 1px var(--line)}
.tline .h{font-weight:700;font-size:16px;margin:0}
.tline .d{color:var(--muted);font-size:14px;margin:3px 0 0}

/* facts */
.facts{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:var(--line);
  border-radius:16px;overflow:hidden;border:1px solid var(--line)}
.facts div{background:var(--panel);padding:13px 16px}
.facts .fv{font-weight:800;font-size:15.5px}
.facts .fk{font-size:11.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-top:1px}

/* tips + pros-cons + more */
.tips{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.tips li{display:flex;gap:10px;font-size:14.5px}
.tips li::before{content:"›";color:var(--shu);font-weight:800}
.pc{border:1px solid var(--line);border-radius:16px;padding:14px 16px;margin-top:14px;background:var(--sakura)}
.pc .pch{font-family:var(--serif);font-weight:500;font-size:17px;margin-bottom:8px}
.pc .row{font-size:14px;margin:5px 0}
.pc .opt{font-weight:800}
.pc .plus{color:var(--success);font-weight:700}
.pc .minus{color:var(--shu);font-weight:700}
.more details{border-top:1px solid var(--line);padding:14px 0}
.more details:first-of-type{border-top:none}
.more summary{font-family:var(--serif);font-size:17px;cursor:pointer;list-style:none;font-weight:500}
.more summary::-webkit-details-marker{display:none}
.more summary::before{content:"＋";color:var(--shu);margin-right:10px;font-weight:700}
.more details[open] summary::before{content:"−"}
.more p{color:var(--muted);font-size:14.5px;margin:10px 0 0}
.linklist{display:flex;flex-wrap:wrap;gap:8px}
.linklist a{font-size:13px;font-weight:700;text-decoration:none;color:var(--ai);
  background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:6px 13px}
.linklist a:hover{border-color:var(--ai)}
.gmap{display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:14px;font-weight:700;
  color:var(--ai);text-decoration:none}

/* day nav */
.daynav{display:flex;justify-content:space-between;align-items:stretch;gap:12px;margin-top:36px}
.daynav a{flex:1;text-decoration:none;color:var(--ink);background:var(--panel);border:1px solid var(--line);
  border-radius:16px;padding:14px 18px;box-shadow:var(--shadow-sm);transition:.15s}
.daynav a:hover{border-color:var(--ai)}
.daynav .dir{font-size:11.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}
.daynav .ttl{font-weight:700;margin-top:3px}
.daynav .home{flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:22px}
.daynav .nx{text-align:right}
.kbd{color:var(--muted);font-size:12.5px;text-align:center;margin-top:14px}

/* index day grid */
.dgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
@media(max-width:620px){.dgrid{grid-template-columns:1fr}}
.dcard{text-decoration:none;color:#fff;border-radius:var(--radius);padding:20px;position:relative;
  overflow:hidden;box-shadow:var(--shadow);min-height:150px;display:flex;flex-direction:column;justify-content:flex-end}
.dcard::after{content:"";position:absolute;inset:0;background-image:url("${WAVE}");background-size:52px;opacity:.45}
.dcard>*{position:relative;z-index:1}
.dcard .dn,.dcard .dd,.dcard .dt{text-shadow:0 1px 12px rgba(0,0,0,.6),0 1px 2px rgba(0,0,0,.45)}
.dcard .dn{position:absolute;top:16px;left:20px;font-family:var(--serif);font-size:30px;opacity:.92;z-index:1}
.dcard .dd{font-size:12.5px;opacity:.9;text-transform:uppercase;letter-spacing:.08em}
.dcard .dt{font-family:var(--serif);font-weight:500;font-size:20px;line-height:1.12;margin-top:3px;text-wrap:balance}
.quick{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:14px}
@media(max-width:620px){.quick{grid-template-columns:1fr}}
.qcard{text-decoration:none;color:var(--ink);background:var(--panel);border:1px solid var(--line);
  border-radius:var(--radius);padding:20px;box-shadow:var(--shadow-sm);transition:.15s}
.qcard:hover{border-color:var(--ai)}
.qcard .qi{font-size:26px}
.qcard .qh{font-family:var(--serif);font-size:19px;margin-top:6px}
.qcard .qd{color:var(--muted);font-size:13.5px;margin-top:2px}

/* calculator (koszty) */
.calc table{width:100%;border-collapse:collapse}
.calc th,.calc td{padding:11px 6px;text-align:left;border-bottom:1px solid var(--line);vertical-align:middle}
.calc th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.calc td.cat{font-weight:700}.calc td.cat .hint{display:block;font-size:12px;color:var(--muted);font-weight:400}
.calc td.num{text-align:right;white-space:nowrap}
.calc input{width:96px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--paper);
  color:var(--ink);font-size:15px;text-align:right;font-variant-numeric:tabular-nums;font-family:var(--sans)}
.calc input.sm{width:60px}.calc .x{color:var(--muted);padding:0 5px}
.calc .tot td{border-bottom:none;border-top:2px solid var(--line);font-size:17px;font-weight:800;padding-top:14px}
.calc .tot .big{color:var(--shu);font-size:23px;text-align:right}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}
@media(max-width:620px){.stats{grid-template-columns:1fr}}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:14px 16px;box-shadow:var(--shadow-sm)}
.stat .k{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.stat .v{font-size:23px;font-weight:800;margin-top:3px}
.bar{height:15px;border-radius:999px;background:var(--sakura);overflow:hidden;margin:12px 0 6px}
.bar .fill{height:100%;border-radius:999px;transition:width .3s}
.barlab{display:flex;justify-content:space-between;font-size:12px;color:var(--muted)}
.reset{background:transparent;border:1px solid var(--line);color:var(--muted);border-radius:10px;
  padding:8px 14px;cursor:pointer;font-size:13px;margin-top:14px;font-family:var(--sans)}
.pflag{display:inline-flex;gap:6px;background:var(--sakura);border:1px dashed var(--shu);border-radius:12px;
  padding:9px 13px;font-size:13.5px;margin-bottom:14px}

/* attractions */
.toc{display:flex;flex-wrap:wrap;gap:8px}
.toc a{font-size:13px;font-weight:700;color:var(--ai);text-decoration:none;background:var(--panel);
  border:1px solid var(--line);border-radius:999px;padding:6px 13px}
.agrid{display:grid;grid-template-columns:1fr 1fr;gap:13px}
@media(max-width:680px){.agrid{grid-template-columns:1fr}}
.acard{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:16px 17px;
  box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:6px;scroll-margin-top:80px}
.acard h3{margin:0;font-family:var(--serif);font-weight:500;font-size:18px}
.acard .desc{font-size:13.5px}
.acard .meta{font-size:13px;color:var(--muted);display:flex;flex-direction:column;gap:2px}
.acard .meta b{color:var(--ink);font-weight:600}
.acard .links{margin-top:auto;padding-top:6px;display:flex;flex-wrap:wrap;gap:8px}
.acard .links a{font-size:12.5px;font-weight:700;text-decoration:none;color:var(--ai);
  border:1px solid var(--line);border-radius:999px;padding:5px 12px;background:var(--paper)}
.rezerwuj{display:inline-block;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;
  background:var(--shu);color:#fff;border-radius:6px;padding:2px 8px;width:fit-content}

/* misc */
.wxwrap{overflow-x:auto;border:1px solid var(--line);border-radius:16px}
.wxwrap table{width:100%;border-collapse:collapse}
.wxwrap th,.wxwrap td{padding:11px 14px;text-align:left;border-bottom:1px solid var(--line);font-size:14px}
.wxwrap th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.wxwrap tr:last-child td{border-bottom:none}
.wxwrap td.cat{font-weight:700}.wxwrap td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.note{color:var(--muted);font-size:13px}
footer{margin-top:44px;padding:26px 0;border-top:1px solid var(--line);color:var(--muted);
  font-size:13px;text-align:center;line-height:1.7}
footer a{font-weight:700;text-decoration:none}
/* hotels */
.hotelbox{display:flex;gap:10px;align-items:center;margin-top:14px;text-decoration:none;color:var(--ink);
  background:var(--panel);border:1px dashed var(--kin);border-radius:16px;padding:13px 16px;
  font-size:14px;box-shadow:var(--shadow-sm);transition:.15s}
.hotelbox:hover{border-color:var(--ai)}
.hlist{display:flex;flex-direction:column;gap:14px}
.hcard{display:flex;gap:18px;background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);
  padding:20px 22px;box-shadow:var(--shadow);scroll-margin-top:80px}
.hcard .hmain{flex:1;min-width:0}
.hcard .hstay{font-size:11.5px;text-transform:uppercase;letter-spacing:.09em;color:var(--shu);font-weight:800}
.hcard h3{font-family:var(--serif);font-weight:500;font-size:21px;margin:4px 0 8px}
.hcard .desc{font-size:14px;margin:0 0 10px}
.hcard .meta{font-size:13px;color:var(--muted);display:flex;flex-direction:column;gap:3px}
.hcard .meta b{color:var(--ink)}
.hcard .links{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px}
.hcard .links a{font-size:12.5px;font-weight:700;text-decoration:none;color:var(--ai);
  border:1px solid var(--line);border-radius:999px;padding:5px 12px;background:var(--paper)}
.hcard .hphoto{flex:0 0 auto;width:184px;text-decoration:none;display:flex;flex-direction:column;gap:6px}
.hcard .hphoto img{width:184px;height:128px;object-fit:cover;border-radius:14px;border:1px solid var(--line);display:block}
.hcard .hphoto:hover img{border-color:var(--ai)}
.hcard .plab{font-size:12px;font-weight:700;color:var(--ai);text-align:center}
@media(max-width:560px){.hcard{flex-direction:column}.hcard .hphoto{width:100%}.hcard .hphoto img{width:100%;height:180px}}
.maphold{position:relative}
.mapbtn{width:100%;padding:15px;border:1px dashed var(--line);background:var(--paper);border-radius:16px;
  font-weight:700;color:var(--ai);cursor:pointer;font-family:var(--sans);font-size:14.5px}
.mapbtn:hover{border-color:var(--ai)}
.map{display:none;height:340px;border-radius:16px;overflow:hidden;background:var(--sakura)}
.leaflet-container{font-family:var(--sans)}
.mk{background:var(--shu);color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;
  justify-content:center;font-weight:800;font-size:13px;border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35)}
.maplegend{margin:14px 0 6px;padding:0;list-style:none;display:flex;flex-direction:column;gap:7px;font-size:14px}
.maplegend li{display:flex;align-items:center;gap:10px}
.maplegend .mn{flex:0 0 auto;width:22px;height:22px;border-radius:50%;background:var(--ai);color:#fff;
  display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800}
.flex{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.flex span{font-size:12.5px;border-radius:10px;padding:8px 11px;border:1px solid var(--line);flex:1 1 240px;line-height:1.4}
.flex .fxlock{background:var(--panel)}
.flex .fxcut{background:var(--sakura)}
.flex b{font-weight:800}
.rhythm{width:100%;border-collapse:collapse;font-size:14px}
.rhythm td,.rhythm th{padding:9px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
.rhythm tr:last-child td{border-bottom:none}
.rhythm th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.rhythm .dcol{font-weight:800;white-space:nowrap}
.ipill{display:inline-block;font-size:11.5px;font-weight:800;border-radius:999px;padding:2px 11px;color:#fff;white-space:nowrap}
.ipill.g{background:var(--success)}.ipill.y{background:var(--kin)}.ipill.r{background:var(--shu)}
.twocol{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:620px){.twocol{grid-template-columns:1fr}}
.totop{position:fixed;right:18px;bottom:18px;width:46px;height:46px;border-radius:50%;background:var(--ai-dark);
  color:#fff;border:none;font-size:20px;cursor:pointer;box-shadow:var(--shadow);opacity:0;pointer-events:none;
  transition:.25s;z-index:60}
.totop.show{opacity:1;pointer-events:auto}

/* ---- loty: wykres, tabela linii, warianty terminu ---- */
.chartwrap{overflow-x:auto;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:14px 10px}
.chartwrap svg{min-width:520px;display:block}
.lgds{display:flex;flex-wrap:wrap;gap:12px;margin-top:12px}
.lgd{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:600;color:var(--muted)}
.lgd i{width:14px;height:4px;border-radius:2px;display:inline-block}
.alist{display:flex;flex-direction:column;gap:10px}
.arow{display:grid;grid-template-columns:1fr auto;gap:6px 14px;align-items:center;background:var(--panel);
  border:1px solid var(--line);border-radius:14px;padding:13px 16px}
.arow.top{border-color:var(--shu);box-shadow:var(--shadow-sm)}
.arow .an{font-weight:800;font-size:15px;display:flex;align-items:center;gap:8px}
.arow .an i{width:10px;height:10px;border-radius:50%;flex:0 0 auto}
.arow .am{font-size:12.5px;color:var(--muted);grid-column:1}
.arow .ap{font-weight:800;font-size:17px;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.arow .asc{text-align:right;white-space:nowrap}
.arow .asc b{display:block;font-family:var(--serif);font-weight:500;font-size:30px;line-height:1;color:var(--ai);
  font-variant-numeric:tabular-nums}
.arow.top .asc b{color:var(--shu)}
.arow .asc i{display:block;font-style:normal;font-size:9.5px;text-transform:uppercase;letter-spacing:.07em;
  color:var(--muted);margin-top:3px}
.arow .crit{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr);gap:10px 18px;margin-top:4px}
.cr{min-width:0}
.cr i{display:block;font-style:normal;font-size:9.5px;text-transform:uppercase;letter-spacing:.09em;color:var(--muted)}
.cr .crb{display:block;height:5px;border-radius:999px;background:var(--sakura);margin:4px 0 3px;overflow:hidden}
.cr .crb b{display:block;height:100%;border-radius:999px}
.cr u{text-decoration:none;font-size:11px;color:var(--ink);font-weight:600}
.wtab{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.wtab span{flex:1 1 150px;border:1px solid var(--line);border-radius:10px;padding:9px 12px;background:var(--panel);
  font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}
.wtab b{display:block;font-family:var(--serif);font-weight:500;font-size:21px;color:var(--ink);
  text-transform:none;letter-spacing:0;margin-bottom:1px}
@media(max-width:620px){.arow .crit{grid-template-columns:1fr}}
.rezerwuj.alt{background:var(--ai)}
@media(max-width:620px){
  .arow{grid-template-columns:1fr}
  .arow .anums{justify-content:flex-start;gap:14px}
  .arow .ad{text-align:left}
}
.arow .ad{font-size:12px;font-weight:700;text-align:right;white-space:nowrap}
.pcards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px}
.pcard{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:18px 18px 16px;position:relative}
.pcard.win{border-color:var(--success);box-shadow:var(--shadow-sm)}
.pcard .ph{font-family:var(--serif);font-size:20px;font-weight:500}
.pcard .psub{font-size:11.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-top:2px}
.pcard .pp{font-size:24px;font-weight:800;margin:10px 0 2px;font-variant-numeric:tabular-nums}
.pcard .pdiff{font-size:12.5px;font-weight:700;margin-bottom:10px}
.pcard ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px;font-size:13px}
.pcard li{display:flex;gap:7px;line-height:1.35}
.pcard .yes::before{content:"✓";color:var(--success);font-weight:800;flex:0 0 auto}
.pcard .no::before{content:"✗";color:var(--shu);font-weight:800;flex:0 0 auto}
.pcard .badge{position:absolute;top:-10px;right:14px;background:var(--success);color:#fff;font-size:10.5px;
  font-weight:800;text-transform:uppercase;letter-spacing:.07em;border-radius:999px;padding:4px 11px}
.gridbars{display:flex;align-items:flex-end;gap:3px;height:120px;margin-top:6px}
.gridbars div{flex:1;border-radius:4px 4px 0 0;background:var(--ai);opacity:.55;position:relative;min-width:0}
.gridbars div.lowest{background:var(--success);opacity:1}
.gridbars div.plan{background:var(--shu);opacity:1}
.gridlabs{display:flex;gap:3px;margin-top:5px}
.gridlabs span{flex:1;text-align:center;font-size:10px;color:var(--muted);min-width:0}
/* ---- modern polish ---- */
.progress{position:fixed;top:0;left:0;height:3px;width:0;z-index:100;
  background:linear-gradient(90deg,var(--kin),var(--shu));transition:width .12s linear}
.hero::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(0,0,0,.06) 0%,transparent 34%,transparent 58%,rgba(0,0,0,.34) 100%)}
.qcard,.dcard,.hcard,.acard,.hotelbox,.stt,.daynav a{
  transition:transform .32s cubic-bezier(.2,.7,.2,1),box-shadow .32s ease,border-color .15s ease,filter .32s ease}
.qcard:hover,.hcard:hover,.acard:hover,.stt:hover,.daynav a:hover{transform:translateY(-4px);box-shadow:var(--shadow)}
.dcard:hover{transform:translateY(-4px);box-shadow:0 30px 70px rgba(20,30,45,.22);filter:brightness(1.05)}
.js main>section{opacity:0;transform:translateY(22px);
  transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}
.js main>section.in{opacity:1;transform:none}
/* intensity dot on day cards */
.dcard .idot{position:absolute;top:17px;right:18px;width:12px;height:12px;border-radius:50%;z-index:1;
  box-shadow:0 0 0 3px rgba(255,255,255,.4),0 1px 3px rgba(0,0,0,.35)}
.idot.g{background:var(--success)}.idot.y{background:var(--kin)}.idot.r{background:var(--shu)}
/* stat band */
.statband{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:12px;margin-top:22px}
.stt{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:18px 14px;text-align:center;box-shadow:var(--shadow-sm)}
.stt b{display:block;font-family:var(--serif);font-weight:500;font-size:clamp(26px,4.4vw,38px);color:var(--ai);line-height:1;letter-spacing:-.01em}
.stt b small{font-size:.4em;color:var(--muted);font-family:var(--sans);font-weight:700;margin-left:3px}
.stt span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);margin-top:8px}
.stt.hl{background:linear-gradient(160deg,var(--ai),var(--ai-dark));border-color:transparent}
.stt.hl b{color:#fff}.stt.hl b small{color:rgba(255,255,255,.72)}.stt.hl span{color:rgba(255,255,255,.85)}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .js main>section{opacity:1;transform:none;transition:none}
  .qcard,.dcard,.hcard,.acard,.hotelbox,.stt,.daynav a{transition:border-color .15s ease}
  .qcard:hover,.dcard:hover,.hcard:hover,.acard:hover,.stt:hover,.daynav a:hover{transform:none}
}

/* ---- ranking wg wag ---- */
.wgrow{margin-bottom:16px}
.wgrow label{display:block;margin-bottom:8px;font-weight:700;color:var(--ai)}
.wgrow input[type=range]{width:100%;accent-color:var(--shu)}
.wghint{display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-top:2px}
.scorelist{display:grid;gap:8px}
.scrow{display:grid;grid-template-columns:30px minmax(0,1.5fr) minmax(0,1fr) minmax(0,1.2fr);gap:12px;align-items:center;padding:11px 13px;border-radius:14px;background:var(--sakura)}
.scrow.win{background:#e8f0e9;box-shadow:inset 0 0 0 2px var(--success)}
.scpos{font-family:var(--serif);font-size:20px;color:var(--muted);text-align:center}
.scname{font-weight:800;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.scname i{width:11px;height:11px;border-radius:50%;flex:0 0 auto}
.scmeta{margin-top:2px;font-size:12px;color:var(--muted);line-height:1.4}
.scprice{font-weight:800;text-align:right}
.scprice span{display:block;font-size:11.5px;font-weight:500;color:var(--muted)}
.scbarwrap{display:flex;align-items:center;gap:8px}
.scbar{height:9px;border-radius:99px;min-width:3px}
.scbarwrap b{font-size:12.5px;color:var(--muted);white-space:nowrap}
@media(max-width:640px){.scrow{grid-template-columns:26px 1fr auto;row-gap:6px}.scbarwrap{grid-column:2/-1}}

/* ---- pogoda na żywo (wzorzec z planu Madery) ---- */
.wxwrap{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.wxcard{min-width:0;padding:16px 18px;border:1px solid var(--line);border-radius:var(--radius);background:var(--panel);box-shadow:var(--shadow-sm)}
.wxcard h3{margin:0 0 6px;font-size:15px;color:var(--ai)}
.wxnow{margin:0;font-size:23px;font-weight:800;line-height:1.15}
.wxnow span{display:block;margin-top:2px;font-size:12.5px;font-weight:600;color:var(--muted)}
.wxdays{display:flex;gap:7px;margin-top:13px;overflow-x:auto;padding-bottom:3px;min-width:0}
.wxd{flex:0 0 auto;min-width:56px;display:grid;gap:3px;padding:9px 6px;border-radius:11px;background:var(--sakura);text-align:center}
.wxd span{font-size:11.5px;font-weight:800;color:var(--ai);text-transform:capitalize}
.wxd em{font-size:18px;font-style:normal;line-height:1}
.wxd b{font-size:12.5px}
.wxd i{font-style:normal;font-weight:500;color:var(--muted)}
.wxerr{margin:0;padding:16px;color:var(--muted);line-height:1.6}
`;
fs.writeFileSync(DIR + '/assets/style.css', CSS);

/* ============================ APP JS ============================ */
const APP = `document.addEventListener('keydown',function(e){
  if(e.target.matches('input,textarea')) return;
  if(e.key==='ArrowRight'){var n=document.getElementById('navNext'); if(n&&n.href) location.href=n.href;}
  if(e.key==='ArrowLeft'){var p=document.getElementById('navPrev'); if(p&&p.href) location.href=p.href;}
});
var bt=document.getElementById('totop');
if(bt){addEventListener('scroll',function(){bt.classList.toggle('show',scrollY>500);});
  bt.addEventListener('click',function(){scrollTo({top:0,behavior:'smooth'});});}
var on=document.querySelector('.pills a.on'); if(on&&on.scrollIntoView) on.scrollIntoView({inline:'center',block:'nearest'});
// scroll reveal (runs early so a later error can't leave sections hidden)
(function(){
  var secs=[].slice.call(document.querySelectorAll('main>section'));
  if(!('IntersectionObserver' in window)){ secs.forEach(function(s){s.classList.add('in');}); return; }
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  },{rootMargin:'0px 0px -6% 0px'});
  secs.forEach(function(s){ if(s.querySelector('#map')){ s.classList.add('in'); return; } io.observe(s); });
  // bezpiecznik: przy skoku scrolla (kotwica, przywrócona pozycja) obserwator potrafi nie zdążyć
  setTimeout(function(){ secs.forEach(function(s){ s.classList.add('in'); }); }, 2500);
})();
// reading progress bar
var pg=document.getElementById('progress');
if(pg){var upd=function(){var h=document.documentElement,m=h.scrollHeight-h.clientHeight;
  pg.style.width=(m>0?(h.scrollTop/m*100):0)+'%';};addEventListener('scroll',upd,{passive:true});upd();}
// countdown to departure
var cd=document.getElementById('cd');
if(cd){var days=Math.max(0,Math.ceil((new Date('2027-05-03T00:00:00')-new Date())/86400000));cd.textContent=days;}
// home hero: parallax bg + fading scroll cue
(function(){
  var hbg=document.querySelector('.hero.home .hbg'), cue=document.querySelector('.scrollcue');
  if(!hbg&&!cue) return;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches, raf=null;
  function frame(){ var y=scrollY||pageYOffset||0;
    if(hbg&&!reduce) hbg.style.transform='translate3d(0,'+(y*0.22)+'px,0)';
    if(cue) cue.style.opacity=Math.max(0,1-y/240);
    raf=null;
  }
  addEventListener('scroll',function(){ if(raf==null) raf=requestAnimationFrame(frame); },{passive:true});
  frame();
})();
(function(){
  var geoEl=document.getElementById('geo'); if(!geoEl) return;
  var btn=document.getElementById('mapActivate'), mapDiv=document.getElementById('map');
  if(!btn||!mapDiv) return;
  var done=false;
  function activate(){
    if(done) return; done=true;
    btn.style.display='none'; mapDiv.style.display='block';
    ensureLeaflet(function(){ render(JSON.parse(geoEl.textContent)); });
  }
  btn.addEventListener('click',activate);
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ activate(); io.disconnect(); } });
    },{rootMargin:'200px 0px'});
    io.observe(btn.parentNode||mapDiv);
  } else { activate(); }
  function ensureLeaflet(cb){
    if(window.L) return cb();
    var c=document.createElement('link'); c.rel='stylesheet';
    c.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(c);
    var s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    s.onload=cb; s.onerror=function(){mapDiv.innerHTML='<p style="padding:16px">Nie udało się załadować mapy — użyj linku do Google Maps.</p>';};
    document.head.appendChild(s);
  }
  function render(stops){
    var map=L.map(mapDiv,{scrollWheelZoom:false});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(map);
    var pts=[];
    stops.forEach(function(s,i){ var ll=[s[0],s[1]]; pts.push(ll);
      L.marker(ll,{icon:L.divIcon({className:'',iconSize:[26,26],iconAnchor:[13,13],html:'<div class="mk">'+(i+1)+'</div>'})})
        .addTo(map).bindPopup((i+1)+'. '+s[2]);
    });
    if(pts.length>1) L.polyline(pts,{color:'#c8402c',weight:3,dashArray:'6 6',opacity:.85}).addTo(map);
    map.fitBounds(pts,{padding:[34,34]});
    setTimeout(function(){map.invalidateSize();},80);
  }
})();

/* ---- ranking wg wag: cena vs jakość ---- */
(function(){
  var host=document.getElementById('scorelist'), src=document.getElementById('scoredata'), sl=document.getElementById('wprice');
  if(!host||!src||!sl) return;
  var D=JSON.parse(src.textContent||'[]'); if(!D.length) return;
  var min=Math.min.apply(null,D.map(function(a){return a.price;})), max=Math.max.apply(null,D.map(function(a){return a.price;}));
  function plz(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' zł';}
  function draw(){
    var w=+sl.value/100;
    document.getElementById('wlab').textContent=Math.round(w*100)+'%';
    document.getElementById('wlab2').textContent=Math.round((1-w)*100)+'%';
    var rows=D.map(function(a){
      var pp=max===min?100:(max-a.price)/(max-min)*100;
      return {a:a, pp:pp, sc:w*pp+(1-w)*a.q};
    }).sort(function(x,y){return y.sc-x.sc;});
    var best=rows[0].sc;
    host.innerHTML=rows.map(function(r,i){
      var a=r.a, fam=Math.round((a.price*3+a.price*0.8)/100)*100;
      return '<div class="scrow'+(i===0?' win':'')+'">'+
        '<div class="scpos">'+(i+1)+'</div>'+
        '<div class="scmain"><div class="scname"><i style="background:'+a.col+'"></i>'+a.name+(a.star?' ★':'')+(i===0?' <span class="rezerwuj">wygrywa</span>':'')+'</div>'+
        '<div class="scmeta">'+(a.via==='bezpośredni'?'lot bezpośredni':'przez '+a.via)+' · '+a.dur+' · jakość '+a.qpos+'</div></div>'+
        '<div class="scprice">'+plz(a.price)+'<span>rodzina ~'+plz(fam)+'</span></div>'+
        '<div class="scbarwrap"><div class="scbar" style="width:'+(best>0?(r.sc/best*100):0).toFixed(1)+'%;background:'+a.col+'"></div><b>'+r.sc.toFixed(1)+'</b></div>'+
      '</div>';
    }).join('');
  }
  sl.addEventListener('input',draw); draw();
})();

/* ---- pogoda na żywo (Open-Meteo) — wzorzec z planu Madery ---- */
(function(){
  var host=document.getElementById('livewx');
  if(!host) return;
  var LOC=[
    {n:'🏙️ Tokio',la:35.6762,lo:139.6503,tz:'Asia/Tokyo'},
    {n:'♨️ Hakone',la:35.2324,lo:139.1069,tz:'Asia/Tokyo'},
    {n:'⛩️ Kioto',la:35.0116,lo:135.7681,tz:'Asia/Tokyo'},
    {n:'🏯 Osaka',la:34.6937,lo:135.5023,tz:'Asia/Tokyo'},
    {n:'🕌 Abu Zabi',la:24.4539,lo:54.3773,tz:'Asia/Dubai'}
  ];
  function ico(c){return c===0?'☀️':c<=3?'⛅':(c===45||c===48)?'🌫️':(c>=51&&c<=57)?'🌦️':(c>=61&&c<=67)?'🌧️':(c>=71&&c<=77)?'🌨️':(c>=80&&c<=82)?'🌦️':(c>=85&&c<=86)?'🌨️':c>=95?'⛈️':'☁️';}
  function lbl(c){return c===0?'Bezchmurnie':c<=3?'Częściowe zachmurzenie':(c===45||c===48)?'Mgła':(c>=51&&c<=57)?'Mżawka':(c>=61&&c<=67)?'Deszcz':(c>=71&&c<=77)?'Śnieg':(c>=80&&c<=82)?'Przelotny deszcz':(c>=85&&c<=86)?'Przelotny śnieg':c>=95?'Burza':'Zachmurzenie';}
  Promise.all(LOC.map(function(l){
    var u='https://api.open-meteo.com/v1/forecast?latitude='+l.la+'&longitude='+l.lo+
      '&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone='+encodeURIComponent(l.tz)+'&forecast_days=4';
    return fetch(u).then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(d){return {l:l,d:d};});
  })).then(function(res){
    host.innerHTML=res.map(function(x){
      var c=x.d.current,dd=x.d.daily;
      var days=dd.time.map(function(t,i){
        return '<div class="wxd"><span>'+(i===0?'dziś':new Date(t+'T12:00:00').toLocaleDateString('pl',{weekday:'short'}))+'</span>'+
          '<em title="'+lbl(dd.weather_code[i])+'">'+ico(dd.weather_code[i])+'</em>'+
          '<b>'+Math.round(dd.temperature_2m_max[i])+'° <i>'+Math.round(dd.temperature_2m_min[i])+'°</i></b></div>';
      }).join('');
      return '<article class="wxcard"><h3>'+x.l.n+'</h3><p class="wxnow">'+ico(c.weather_code)+' '+Math.round(c.temperature_2m)+'°C <span>'+lbl(c.weather_code)+'</span></p><div class="wxdays">'+days+'</div></article>';
    }).join('');
  }).catch(function(){
    host.innerHTML='<p class="wxerr">Nie udało się pobrać pogody na żywo. Aktualne prognozy: <a href="https://www.jma.go.jp/bosai/forecast/" target="_blank" rel="noopener">JMA</a> (Japonia).</p>';
  });
})();
`;
fs.writeFileSync(DIR + '/assets/app.js', APP);

/* ============================ DATA ============================ */
const IMG = {
  sensoji:'/assets/img/sensoji.jpg', shibuya:'/assets/img/shibuya.jpg', akihabara:'/assets/img/akihabara.jpg',
  fuji:'/assets/img/fuji.jpg', yasaka:'/assets/img/yasaka.jpg', fushimi:'/assets/img/fushimi.jpg',
  kinkakuji:'/assets/img/kinkakuji.jpg', todaiji:'/assets/img/todaiji.jpg', bamboo:'/assets/img/bamboo.jpg',
  dotonbori:'/assets/img/dotonbori.jpg', sumo:'/assets/img/sumo.jpg', tokyostation:'/assets/img/tokyostation.jpg',
  abudhabi:'/assets/img/abudhabi.jpg', mosque:'/assets/img/mosque.jpg',
};
// one distinct photo per day
const DAYIMG = {
  '2027-05-03':IMG.abudhabi, '2027-05-04':IMG.mosque, '2027-05-05':IMG.sensoji, '2027-05-06':IMG.shibuya,
  '2027-05-07':IMG.fuji, '2027-05-08':IMG.yasaka, '2027-05-09':IMG.fushimi,
  '2027-05-10':IMG.kinkakuji, '2027-05-11':IMG.todaiji, '2027-05-12':IMG.bamboo,
  '2027-05-13':IMG.dotonbori, '2027-05-14':IMG.sumo, '2027-05-15':IMG.tokyostation,
};
const CITY = {
  tokio:{c1:'20,32,64',c2:'14,39,67',photo:IMG.shibuya},
  hakone:{c1:'20,58,58',c2:'15,54,52',photo:IMG.fuji},
  kioto:{c1:'120,40,32',c2:'120,72,30',photo:IMG.fushimi},
  nara:{c1:'45,74,42',c2:'32,54,29',photo:IMG.todaiji},
  osaka:{c1:'58,32,84',c2:'124,45,85',photo:IMG.dotonbori},
  abudhabi:{c1:'110,74,20',c2:'40,60,80',photo:IMG.abudhabi},
};
// hero: light tint so the PHOTO is the star; card: bottom-weighted for a legible title
const heroBg = (c,ph) => `linear-gradient(120deg,rgba(${CITY[c].c1},.58),rgba(${CITY[c].c2},.34)),url('${ph}') center/cover`;
const cardBg = (c,ph) => `linear-gradient(to top,rgba(${CITY[c].c1},.92),rgba(${CITY[c].c1},.10)),url('${ph}') center/cover`;
const JPSTOPS = [
  [35.6804,139.7690,'Tokio — start (2 noce) i finał na turnieju sumo'],
  [35.2323,139.1069,'Hakone — ryokan z prywatnym onsenem (1 noc)'],
  [34.9853,135.7581,'Kioto — baza na 4 noce (stąd Nara i Arashiyama)'],
  [34.6937,135.5023,'Osaka — Dōtonbori i kuchnia (2 noce)'],
];
const GEO = {
  '2027-05-03':[[52.1657,20.9671,'Lotnisko Chopina (wylot 11:50)'],[24.4330,54.6511,'Lotnisko Abu Zabi (19:35)'],[24.4539,54.3773,'Hotel stopover (centrum)']],
  '2027-05-04':[[24.4128,54.4750,'Wielki Meczet Szejka Zajida'],[24.5333,54.3981,'Luwr Abu Zabi'],[24.4330,54.6511,'Lotnisko (wylot 21:50)']],
  '2027-05-05':[[35.772,140.393,'Narita (przylot 12:45)'],[35.681,139.767,'Tokyo Station'],[35.7148,139.7967,'Asakusa / Sensō-ji']],
  '2027-05-06':[[35.6654,139.7707,'Targ Tsukiji'],[35.7295,139.7190,'Pokémon Center (Ikebukuro)'],[35.6817,139.7740,'Pokémon Café (Nihombashi)'],[35.6595,139.7005,'Shibuya + Shibuya Sky']],
  '2027-05-07':[[35.6896,139.7006,'Shinjuku'],[35.2503,139.0503,'Gōra'],[35.2445,139.0197,'Ōwakudani'],[35.2044,139.0247,'Jezioro Ashi / Hakone-jinja']],
  '2027-05-08':[[35.2564,139.1553,'Odawara'],[34.9858,135.7588,'Kioto'],[35.0037,135.7756,'Gion'],[35.0043,135.7707,'Pontocho']],
  '2027-05-09':[[34.9671,135.7727,'Fushimi Inari'],[34.9948,135.7850,'Kiyomizu-dera'],[35.0050,135.7649,'Nishiki Market']],
  '2027-05-10':[[35.0394,135.7292,'Kinkaku-ji'],[35.0037,135.7756,'Warsztaty / Gion']],
  '2027-05-11':[[34.6851,135.8430,'Park Nara'],[34.6889,135.8398,'Tōdai-ji'],[34.6819,135.8483,'Kasuga Taisha']],
  '2027-05-12':[[35.0170,135.6716,'Arashiyama (bambus)'],[35.0110,135.6770,'Małpy Iwatayama'],[34.6687,135.5013,'Osaka / Dōtonbori']],
  '2027-05-13':[[34.6656,135.5062,'Kuromon Ichiba'],[34.6873,135.5259,'Zamek w Osace'],[34.6545,135.4289,'Kaiyukan'],[34.6524,135.5063,'Shinsekai']],
  '2027-05-14':[[34.7333,135.5000,'Shin-Ōsaka'],[35.6970,139.7933,'Ryōgoku Kokugikan (sumo)']],
  '2027-05-15':[[35.681,139.767,'Tokio'],[35.772,140.393,'Narita → wylot']],
};
const A = (id,label)=>({id,label}); // attraction link helper

const DAYS = [
{date:'2027-05-03',dow:'poniedziałek',dd:'3 maja',city:'abudhabi',title:'Wylot i wieczór w Abu Zabi',
 lead:'Startujemy z Warszawy, a zamiast nocnej przesiadki — hotel 4★ gratis od Etihadu i spokojny sen po pierwszym locie.',
 chips:['Stopover Etihad','Hotel gratis','Tylko 6 h lotu'],
 tl:[
  ['08:45','Wyjazd na Lotnisko Chopina',''],
  ['09:20','Check-in Etihad','Bilet ze stopoverem (multi-city); odprawa online 30 h wcześniej.'],
  ['11:50','Wylot WAW → Abu Zabi','~6 h lotu.'],
  ['19:35','Lądowanie w Abu Zabi','Czas lokalny (+2 h vs Polska).'],
  ['20:30','Transfer do hotelu','Hotel z pakietu stopover — w cenie biletu.'],
  ['21:30','Sen w prawdziwym łóżku','Zamiast nocy w samolocie — jet lag rozbity na raty.'],
 ],
 facts:[['Łagodna','Intensywność'],['Lot 6 h','Przejazdy'],['Minimalne','Chodzenie'],['Łatwy etap','Dla dzieci'],['Abu Zabi (gratis)','Nocleg']],
 tips:['Pakiet hotelowy stopover rezerwuje się na etihad.com najpóźniej 3 dni przed wylotem — zróbcie to od razu po kupnie biletów.','Do walizki podręcznej: stroje na jeden gorący dzień (35–40°C) — duże bagaże można nadać od razu do Tokio.'],
 links:[A('stopover','Pakiet stopover Etihad')],
 more:[['Dlaczego stopover','Postój trwa ~26 h, więc łapie się na darmowy hotel (program Etihadu dla ekonomii i biznesu). Podróż dzieli się na 6 + 10 godzin lotu z pełną nocą snu pośrodku — z dziećmi to zupełnie inna jakość niż 18 godzin ciurkiem.']]},

{date:'2027-05-04',dow:'wtorek',dd:'4 maja',city:'abudhabi',title:'Dzień w Abu Zabi i nocny lot do Tokio',
 lead:'Poranek w jednym z najpiękniejszych meczetów świata, popołudnie w klimatyzowanym Luwrze — wieczorem lecimy dalej.',
 chips:['Wielki Meczet','35–40°C!','Wylot 21:50'],
 tl:[
  ['08:00','Śniadanie w hotelu','Bez pośpiechu — bagaże zostają w przechowalni.'],
  ['09:00','Wielki Meczet Szejka Zajida','82 kopuły, największy dywan świata; wstęp darmowy, stroje zakrywające (abaje do wypożyczenia na miejscu).'],
  ['12:00','Klimatyzowany azyl','Luwr Abu Zabi (kopuła-deszcz światła) albo pałac Qasr Al Watan — w środku dnia na zewnątrz jest 35–40°C.'],
  ['15:30','Powrót do hotelu','Prysznic, odbiór bagaży, chwila przy basenie.'],
  ['18:30','Transfer na lotnisko',''],
  ['21:50','Wylot Abu Zabi → Tokio','~10 h; kolacja na pokładzie i spać — zegarki na czas japoński (+5 h).'],
 ],
 facts:[['Łagodna','Intensywność'],['Taxi + lot 10 h','Przejazdy'],['Umiarkowane','Chodzenie'],['Meczet robi „wow"','Dla dzieci'],['Nocny lot','Nocleg']],
 tips:['Meczet zwiedzajcie RANO — najmniejszy upał i tłum; rezerwacja wejścia online (darmowa) z wyprzedzeniem.','Kobiety i dziewczynki: zakryte ramiona i kolana; abaje wypożyczają bezpłatnie przy wejściu.'],
 links:[A('mosque','Wielki Meczet'),A('louvread','Luwr Abu Zabi')],
 more:[['Kontekst','Meczet Szejka Zajida mieści 40 tysięcy wiernych; marmur, złoto i kryształowe żyrandole robią wrażenie niezależnie od wieku. Luwr AD to filia paryskiego Luwru pod słynną kopułą Jeana Nouvela — „deszcz światła" nad galeriami.']]},

{date:'2027-05-05',dow:'środa',dd:'5 maja',city:'tokio',title:'Przylot do Tokio w Dzień Dziecka',
 lead:'Lądujemy wypoczęci po nocy w łóżku, a Tokio wita nas karpiami koinobori — dziś Kodomo no hi.',
 chips:['Dzień Dziecka','Łagodny start','NEX z lotniska'],
 tl:[
  ['12:45','Lądowanie na Narcie','Imigracja z kodem QR Visit Japan Web (wypełnić w samolocie), odbiór bagaży.'],
  ['14:18','Narita Express do miasta','~55 min do centrum, miejsca rezerwowane.'],
  ['15:30','Zameldowanie','Zostawiamy bagaże, chwila oddechu.'],
  ['16:30','Asakusa','Brama Kaminarimon i deptak Nakamise; nad rzeką karpie koinobori na Dzień Dziecka.'],
  ['18:00','Sensō-ji o zmroku','Podświetlona pagoda, gdy tłumy już maleją.'],
  ['19:00','Kolacja','Ramen albo izakaya; potem kombini po zapasy i karty Suica.'],
  ['21:30','Wczesny sen','Domykamy jet lag.'],
 ],
 facts:[['Łagodna','Intensywność'],['Narita Express','Przejazdy'],['Umiarkowane','Chodzenie'],['Ich święto!','Dla dzieci'],['Tokio (1/2)','Nocleg']],
 tips:['Visit Japan Web wypełnijcie dla całej czwórki jeszcze w samolocie — na lotnisku pokazujecie kod QR.','Suica w Apple/Google Pay płaci za metro i w sklepach; dzieciom fizyczne karty kodomo (−50%).'],
 links:[A('sensoji','Sensō-ji'),A('nex','Narita Express + Suica'),A('vjw','Visit Japan Web')],
 more:[['Dobrze wiedzieć','To ostatni dzień Golden Week — Asakusa będzie odświętna, ale wieczorem tłumy maleją. Od jutra Japonia wraca do normalnego rytmu i mamy ją dla siebie.']]},

{date:'2027-05-06',dow:'czwartek',dd:'6 maja',city:'tokio',title:'Wielki dzień Tokio: sushi, Pokémony i widok z dachu',
 lead:'Jeden gęsty, najlepszy dzień w stolicy: śniadanie na targu, świat Pokémonów i zachód słońca 229 metrów nad Shibuyą.',
 chips:['Dla dzieci','Pokémon Café','Shibuya Sky'],
 tl:[
  ['09:00','Targ Tsukiji','Świeże sushi i tamagoyaki na patyku prosto ze straganów.'],
  ['10:45','Metro do Ikebukuro',''],
  ['11:15','Pokémon Center Mega Tokyo','Największy sklep Pokémon w Japonii (Sunshine City).'],
  ['12:30','Pokémon Café','Tematyczny lunch z wizytą Pikachu — rezerwacja z góry (Nihombashi).'],
  ['15:00','Shibuya','Słynne skrzyżowanie, pomnik Hachikō, Mega Don Quijote.'],
  ['17:45','Shibuya Sky','Otwarty taras na zachód słońca — rezerwacja online.'],
  ['19:30','Kolacja','Kaiten-zushi (sushi z taśmy) albo yakiniku w Shibuyi.'],
 ],
 facts:[['Wyższa','Intensywność'],['Metro','Przejazdy'],['Sporo','Chodzenie'],['Ich dzień','Dla dzieci'],['Tokio (2/2)','Nocleg']],
 tips:['Rezerwacja Pokémon Café otwiera się 31 dni wcześniej o 18:00 czasu japońskiego — łapcie slot punktualnie.','Bilety na Shibuya Sky o zachodzie znikają pierwszego dnia sprzedaży (4 tyg. wcześniej); ustalcie limit na gachapon z góry 😉'],
 links:[A('tsukiji','Tsukiji'),A('pokemon','Pokémon Center + Café'),A('shibuya-sky','Shibuya Sky')],
 more:[['Co wypadło przez stopover','Ten dzień łączy dawne dwa: odpuściliśmy Meiji Jingū, Harajuku i Akihabarę/teamLab na rzecz nocy w Abu Zabi. Jeśli zostanie energia, krótki skok do Akihabary da się wcisnąć 15.05 przed odbiorem bagaży.'],['Plan B na deszcz','Shibuya Sky rezerwujcie tylko przy dobrej prognozie — taras jest odkryty, a w deszczu recenzenci zgodnie uznają go za stratę pieniędzy. Awaryjnie: Round1 w Ikebukuro (gry, bowling) albo godzina rodzinnego karaoke (Big Echo / Karaoke Kan — przed 22:00 z nieletnimi).']]},

{date:'2027-05-07',dow:'piątek',dd:'7 maja',city:'hakone',title:'W góry Hakone — onsen i Fudżi',
 lead:'Pętla wulkaniczna, jezioro z bramą torii i pierwsza noc po japońsku: yukata, kaiseki i gorące źródła.',
 chips:['Ryokan + onsen','Widok na Fudżi','Kolejki i statek'],
 tl:[
  ['08:00','Walizki kurierem','Takkyūbin z recepcji prosto do Kioto (dojdą jutro) — do Hakone jedziemy z plecakami.'],
  ['09:00','Romancecar z Shinjuku','Wygodny ekspres z rezerwowanymi miejscami (~1,5 h).'],
  ['10:30','Kolejka górska do Gōry',''],
  ['11:30','Kolej linowa nad Ōwakudani','Pola siarkowe i czarne jajka kuro-tamago (+7 lat życia od sztuki).'],
  ['13:00','Lunch z widokiem',''],
  ['14:30','Rejs po jeziorze Ashi','Stylizowany „piracki" galeon; przy dobrej pogodzie Fudżi nad wodą.'],
  ['15:30','Hakone-jinja','Czerwona brama torii stojąca w jeziorze.'],
  ['16:30','Ryokan','Zameldowanie, yukaty.'],
  ['17:30','Onsen','Prywatny rotenburo (odkryta kąpiel) na tarasie pokoju — do dyspozycji o każdej porze.'],
  ['18:30','Kolacja kaiseki','Wielodaniowa, sezonowa; wieczorem druga kąpiel dla chętnych.'],
 ],
 facts:[['Średnia','Intensywność'],['Romancecar + kolejki','Przejazdy'],['Umiarkowane','Chodzenie'],['Frajda z kolejek','Dla dzieci'],['Ryokan','Nocleg']],
 tips:['Fudżi najczęściej widać rano — trzymajcie kciuki przy porannej kolejce linowej i na jeziorze.','Nadanie dużych walizek kurierem (~2 500 ¥/szt.) oszczędza taszczenia po górach i przesiadkach.'],
 links:[A('hakone-pass','Hakone Free Pass + Romancecar'),A('owakudani','Ōwakudani'),A('ashi','Jezioro Ashi'),A('takkyubin','Takkyūbin')],
 more:[['Kontekst','Ryokan to nie tylko nocleg, ale całe doświadczenie: śpi się na futonach na tatami, chodzi w yukacie, a kolacja kaiseki i onsen są częścią wieczoru. To najspokojniejszy punkt całego wyjazdu.'],['Plan B na wiatr i chmury','Kolejka linowa nad Ōwakudani bywa zawieszana przy silnym wietrze lub alertach wulkanicznych — rano sprawdźcie status na hakonenavi.jp. Awaryjnie: Hakone Open-Air Museum (rzeźby do wspinania, pawilon Picassa, kąpiel stóp) plus rejs po Ashi, który pływa niemal zawsze.']]},

{date:'2027-05-08',dow:'sobota',dd:'8 maja',city:'kioto',title:'Z gór do dawnej stolicy',
 lead:'Poranny onsen, shinkansen do Kioto i pierwszy wieczór w dzielnicy gejsz.',
 chips:['Shinkansen','Gion o zmroku','Machiya lub aparthotel'],
 tl:[
  ['08:00','Poranny onsen + śniadanie',''],
  ['09:30','Zejście do Odawary',''],
  ['11:00','Shinkansen do Kioto','~2 h; miejsca D/E — okno E od strony Fudżi.'],
  ['13:15','Kioto','Bagaże z Tokio już czekają (takkyūbin).'],
  ['15:00','Spacer po Gion','Hanamikoji, świątynia Yasaka, park Maruyama.'],
  ['17:30','Pontocho','Wąska uliczka latarni nad rzeką Kamo.'],
  ['18:30','Kolacja obanzai','Domowa kuchnia Kioto.'],
  ['20:00','Wieczorne Gion','Szansa minąć maiko w drodze na występ.'],
 ],
 facts:[['Łagodna','Intensywność'],['Shinkansen','Przejazdy'],['Umiarkowane','Chodzenie'],['Spokojny wieczór','Dla dzieci'],['Kioto (1/4)','Nocleg']],
 tips:['W Kioto noście buty łatwe do zdejmowania — świątynie, tatami i warsztaty tego wymagają.','Na uliczkach Gion obowiązuje zakaz fotografowania na prywatnych zaułkach (są kary) — róbcie zdjęcia na głównych deptakach.','Opcja przed odjazdem: Hakone Open-Air Museum (otwarte od 9:00, 5 min kolejką od Gōry) — godzina wśród rzeźb do wspinania i shinkansen o ~12:00 zamiast 11:00.'],
 links:[A('gion','Gion i Pontocho'),A('smartex','Rezerwacja shinkansenów')],
 pc:{q:'Nocleg w Kioto: aparthotel czy machiya?',opts:[
   ['Aparthotel (Mimaru)','łóżka, kuchnia, winda, pralnia — bezstresowo z dziećmi (~820 zł/noc)','mniej „japońskiego" klimatu'],
   ['Machiya','futony na tatami w drewnianym domku, dużo klimatu','schody i mniej udogodnień (~890 zł/noc)']]},
 more:[]},

{date:'2027-05-09',dow:'niedziela',dd:'9 maja',city:'kioto',title:'Kioto wschodnie: torii i tarasy',
 lead:'Tysiące bram Fushimi Inari, taras Kiyomizu-dera i uliczki, które wyglądają jak sprzed wieków.',
 chips:['Świątynie','Trochę pod górę','Nishiki Market'],
 tl:[
  ['08:30','Pociąg do Inari',''],
  ['09:00','Fushimi Inari','Tysiące cynobrowych bram torii; im wyżej (do rozdroża Yotsutsuji), tym luźniej.'],
  ['11:15','Przejazd pod Kiyomizu',''],
  ['11:45','Kiyomizu-dera','Drewniany taras nad doliną i wodospad Otowa — trzy strumienie życzeń.'],
  ['13:15','Sannenzaka i Ninenzaka','Zabytkowe uliczki, lunch po drodze.'],
  ['15:00','Lody matcha','Ewentualnie świątynia Kōdai-ji.'],
  ['16:00','Nishiki Market','„Spiżarnia Kioto" — przekąski, tsukemono, wagashi.'],
  ['17:30','Odpoczynek',''],
  ['19:00','Kolacja',''],
 ],
 facts:[['Wyższa','Intensywność'],['Pociąg + pieszo','Przejazdy'],['Sporo, pod górę','Chodzenie'],['Lisy i tarasy','Dla dzieci'],['Kioto (2/4)','Nocleg']],
 tips:['O 9:00 w bramach jest już tłoczniej niż o świcie — ale spokojny start wygrywa; im wyżej podejdziecie, tym mniej ludzi.','Na Kiyomizu z wodospadu Otowa pije się tylko z jednego strumienia — wybór trzech naraz uchodzi za zachłanność.','Plan B na deszcz w Kioto: Kyoto Railway Museum (symulator shinkansena!) albo teamLab Biovortex przy dworcu — oba kryte i uwielbiane przez dzieci.'],
 links:[A('fushimi','Fushimi Inari'),A('kiyomizu','Kiyomizu-dera'),A('nishiki','Nishiki Market')],
 more:[]},

{date:'2027-05-10',dow:'poniedziałek',dd:'10 maja',city:'kioto',title:'Dzień kultury: herbata, pędzel, kwiaty',
 lead:'Złoty Pawilon o poranku, a po południu rzemiosło Kioto w rękach — ceremonia herbaty, kaligrafia i ikebana.',
 chips:['Warsztaty','Spokojne tempo','Dla mamy'],
 tl:[
  ['09:00','Kinkaku-ji','Złoty Pawilon w porannym świetle, odbity w stawie.'],
  ['13:00','Ceremonia herbaty','Sesja rodzinna z objaśnieniem po angielsku (~60 min).'],
  ['14:30','Kaligrafia shodō','Każdy pisze swój znak pędzlem na pamiątkę.'],
  ['16:00','Ikebana','Warsztat układania kwiatów. Opcja równoległa: tata z dziećmi na 75-min klasie ninja (Samurai Ninja Museum) — shurikeny, dmuchawka, kostiumy.'],
  ['18:00','Spacer po Gion','W złotej godzinie.'],
  ['19:00','Kolacja','Yudōfu — tofu po kiotyjsku, albo lekkie kaiseki.'],
 ],
 facts:[['Łagodna','Intensywność'],['Pieszo + autobus','Przejazdy'],['Niewiele','Chodzenie'],['Kaligrafia wciąga','Dla dzieci'],['Kioto (3/4)','Nocleg']],
 tips:['Warsztaty (Maikoya, Camellia, studia w Gion) rezerwować 1–2 miesiące wcześniej — sloty rodzinne schodzą pierwsze.','Z całego zestawu dzieci najbardziej wciąga kaligrafia — mokry pędzel i własny znak to świetna pamiątka.'],
 links:[A('kinkakuji','Kinkaku-ji'),A('culture','Warsztaty kultury'),A('ninja','Klasa ninja (opcja)')],
 more:[['Kontekst','Kioto przez tysiąc lat było stolicą cesarską i to tutaj wykuwały się sztuki, które dziś kojarzymy z Japonią: droga herbaty (chadō), kaligrafia (shodō) i ikebana. Dzień jest pomyślany tak, by nie tylko je zobaczyć, ale spróbować własnymi rękami.']]},

{date:'2027-05-11',dow:'wtorek',dd:'11 maja',city:'nara',title:'Nara: jelenie i Wielki Budda',
 lead:'Wycieczka do pierwszej stolicy Japonii — kłaniające się jelenie i 15-metrowy Budda z brązu.',
 chips:['Wycieczka','Dla dzieci','Pieszo po parku'],
 tl:[
  ['09:15','Kintetsu Express do Nary','~35 min z Kioto, miejsca rezerwowane.'],
  ['10:00','Jelenie w parku','~1200 oswojonych jeleni sika kłania się za krakersy shika-senbei.'],
  ['10:45','Tōdai-ji','Wielki Budda z brązu; dzieci przeciskają się przez „nozdrze Buddy" w filarze.'],
  ['12:00','Kasuga Taisha','Aleja tysięcy kamiennych lampionów.'],
  ['13:00','Lunch','Higashimuki — udon i street food.'],
  ['14:30','Pokaz ubijania mochi','Nakatanidō — dwóch mistrzów wali młotami w rytmie; degustacja na ciepło.'],
  ['15:30','Powrót do Kioto',''],
  ['17:00','Czas wolny',''],
  ['19:00','Kolacja',''],
 ],
 facts:[['Średnia','Intensywność'],['Pociąg + pieszo','Przejazdy'],['Sporo','Chodzenie'],['Jelenie = hit','Dla dzieci'],['Kioto (4/4)','Nocleg']],
 tips:['Jelenie bywają nachalne: krakersy trzymajcie wysoko, karmcie po jednym — a ukłon przed jeleniem naprawdę działa.','Pokaz mochi w Nakatanidō bywa nieregularny (mniej więcej co 30 min) — warto zapytać obsługę o najbliższy.','Dla graczy (opcja): wracając, można wysiąść w Ujī — Nintendo Museum (bilety w loterii ~3 miesiące wcześniej, paszporty całej czwórki). Odpuściliśmy je wcześniej świadomie, ale topowe biura stawiają je najwyżej dla dzieci w tym wieku — decyzja Wasza.'],
 links:[A('nara-park','Park Nara'),A('todaiji','Tōdai-ji'),A('kasuga','Kasuga Taisha'),A('mochi','Nakatanidō'),A('nintendomuseum','Nintendo Museum (opcja)')],
 more:[]},

{date:'2027-05-12',dow:'środa',dd:'12 maja',city:'osaka',title:'Bambusy Arashiyamy i neony Osaki',
 lead:'Poranny spacer wśród bambusów i między małpami, a wieczorem zderzenie z kuchnią i neonami Osaki.',
 chips:['Las bambusowy','Przeprowadzka','Dōtonbori'],
 tl:[
  ['08:45','Pociąg do Saga-Arashiyama','~15 min z Kioto.'],
  ['09:15','Las bambusowy','Szumi i jest najspokojniejszy o poranku.'],
  ['10:00','Tenryū-ji','Ogrody zen wpisane na listę UNESCO.'],
  ['11:15','Małpy na Iwatayamie','20 min wspinaczki, panorama Kioto i makaki przy siatce.'],
  ['12:30','Lunch w Arashiyamie',''],
  ['14:00','Po bagaże',''],
  ['15:30','Przejazd do Osaki','~40 min pociągiem.'],
  ['16:30','Namba','Zameldowanie.'],
  ['18:00','Dōtonbori','Neon Glico, takoyaki i okonomiyaki z ulicy.'],
 ],
 facts:[['Średnia','Intensywność'],['Pociągi','Przejazdy'],['Sporo, pod górę','Chodzenie'],['Małpy i neony','Dla dzieci'],['Osaka (1/2)','Nocleg']],
 tips:['Przy małpach na Iwatayamie nie noście jedzenia w widocznych torbach; automat z wodą jest na szczycie.','Las bambusowy o 9:15 nie jest już pusty jak o świcie, ale wciąż robi wrażenie — idźcie w głąb, dalej od wejścia.'],
 links:[A('arashiyama','Arashiyama'),A('monkeys','Monkey Park Iwatayama')],
 more:[]},

{date:'2027-05-13',dow:'czwartek',dd:'13 maja',city:'osaka',title:'Osaka: luz, targ i kuchnia',
 lead:'Najspokojniejszy dzień — targ owoców morza, zamek albo akwarium i wieczór w retro-dzielnicy.',
 chips:['Luźne tempo','Jedzenie','Elastyczny plan'],
 tl:[
  ['09:00','Targ Kuromon Ichiba','„Kuchnia Osaki" — owoce morza, sushi, truskawki mochi.'],
  ['11:00','Zamek w Osace lub Kaiyukan','Panorama z zamku albo rekin wielorybi w jednym z największych akwariów świata.'],
  ['13:30','Lunch',''],
  ['15:00','Shinsekai','Retro-Osaka: wieża Tsūtenkaku i kushikatsu (nie maczać dwa razy!).'],
  ['16:30','Opcja: Round1 Sennichimae','7 pięter gier: purikura, bowling, rytmiczne automaty — ulubieniec nastolatków w recenzjach.'],
  ['17:30','Odpoczynek',''],
  ['19:00','Dōtonbori runda 2','Albo 20-minutowy rejs po kanale Tombori między neonami.'],
 ],
 facts:[['Łagodna','Intensywność'],['Metro','Przejazdy'],['Umiarkowane','Chodzenie'],['Akwarium = hit','Dla dzieci'],['Osaka (2/2)','Nocleg']],
 tips:['To celowo luźny dzień po intensywnym Kioto — przetasujcie punkty wedle nastroju i pogody.','W kushikatsu obowiązuje jedna zasada: wspólnego sosu nie maczamy dwa razy tym samym szaszłykiem.','Wieczorne hity z tourów rodzinnych do wyboru: godzina karaoke boxu (~2 000 ¥/pokój) albo warsztat taiko — bębny japońskie, zero bariery językowej.','Kaiyukan w deszczu pęka w szwach — kupcie e-bilet z godziną i celujcie w późne popołudnie.'],
 links:[A('kuromon','Kuromon Ichiba'),A('osaka-castle','Zamek w Osace'),A('kaiyukan','Akwarium Kaiyukan'),A('shinsekai','Shinsekai'),A('tombori','Rejs Tombori'),A('round1','Round1 i karaoke'),A('taiko','Warsztat taiko')],
 more:[]},

{date:'2027-05-14',dow:'piątek',dd:'14 maja',city:'tokio',title:'Powrót do Tokio i turniej sumo',
 lead:'Shinkansen z widokiem na Fudżi, a po południu prawdziwy turniej sumo w hali Ryōgoku.',
 chips:['Sumo — dzień 6','Shinkansen','Chanko-nabe'],
 tl:[
  ['09:00','Wykwaterowanie','Metro na Shin-Ōsakę.'],
  ['09:33','Shinkansen Nozomi do Tokio','2 h 25; Fudżi za oknem (miejsca D/E) ~40 min przed metą.'],
  ['12:00','Bagaże','Do hotelu albo do schowków na dworcu Ryōgoku.'],
  ['12:45','Lunch w Ryōgoku',''],
  ['13:30','Wejście na halę','Ryōgoku Kokugikan — niższe dywizje przy jeszcze pustej hali, można usiąść bliżej.'],
  ['14:15','Jūryō','Rytuały wejścia, sól, tupanie shiko.'],
  ['15:45','Makuuchi','Najwyższa liga, ceremonia dohyō-iri i finałowa ceremonia łuku.'],
  ['18:15','Chanko-nabe','Kocioł zapaśników w knajpie prowadzonej przez byłego sumitę.'],
  ['20:00','Powrót do hotelu',''],
 ],
 facts:[['Średnia','Intensywność'],['Shinkansen','Przejazdy'],['Umiarkowane','Chodzenie'],['Sumo robi wrażenie','Dla dzieci'],['Tokio (finał)','Nocleg']],
 tips:['Bilety na sumo ruszają ~początek kwietnia na sumo.or.jp i wyprzedają się w godziny — kupujcie w dniu startu.','Lornetka bardzo się przyda; walki najwyższej ligi to ostatnie ~2 godziny turnieju.'],
 links:[A('sumo','Turniej sumo'),A('chanko','Chanko-nabe')],
 pc:{q:'Miejsca na sumo: arena B/C czy box przy ringu?',opts:[
   ['Arena B/C (krzesełka)','wygodne, dobry widok z góry, taniej (~620 zł/4 os.), łatwo wyjść z dziećmi','dalej od ringu'],
   ['Box przy ringu (masu-seki)','100% klimatu, tuż przy akcji','siedzenie na poduszkach po turecku 3–4 h, drożej (~1 170 zł)']]},
 more:[['Kontekst','Majowy turniej Natsu Basho trwa 15 dni (9–23 maja 2027). Traficie na dzień 6 — środek turnieju, gdy walki mają już stawkę, a hala żyje. To sport z 1500-letnią historią i pełną oprawą rytuału.']]},

{date:'2027-05-15',dow:'sobota',dd:'15 maja',city:'tokio',title:'Ostatnie zakupy i droga do domu',
 lead:'Spokojny poranek na pamiątki i wieczorny lot do Warszawy.',
 chips:['Zakupy','Tax-free','Wylot 18:00'],
 tl:[
  ['08:30','Śniadanie i pakowanie','Kontrola wagi walizek.'],
  ['10:00','Ostatnie zakupy','Don Quijote i Tokyo Character Street na dworcu.'],
  ['12:00','Lekki lunch',''],
  ['13:45','Odbiór bagaży z hotelu',''],
  ['14:18','Narita Express na lotnisko','~55 min; na Narcie 3 h przed wylotem.'],
  ['16:00','Odprawa i kontrola','Ewentualny zwrot tax-free.'],
  ['18:00','Wylot','NRT → Abu Zabi (przesiadka 2 h 30).'],
  ['06:50','Warszawa','Lądowanie w niedzielę 16.05 — okaeri!'],
 ],
 facts:[['Łagodna','Intensywność'],['NEX na lotnisko','Przejazdy'],['Niewiele','Chodzenie'],['Spokojny dzień','Dla dzieci'],['Lot nocny','Nocleg']],
 tips:['Zostawcie ~5 kg zapasu w walizkach na pamiątki; paragony tax-free trzymajcie razem z paszportami.','Na Character Street (Tokyo Station) są sklepy Pokémon, Ghibli i Hello Kitty — dobre miejsce na ostatnie prezenty.'],
 links:[A('nex','Narita Express')],
 more:[]},
];

/* ============================ HOTELS ============================ */
const HOTELS = [
{id:'auh',name:'Hotel stopover w Abu Zabi',stay:'Abu Zabi · 1 noc (3–4.05) · GRATIS',noqr:true,
 desc:'Hotel 4★ w cenie biletu Etihad (program stopover, także w ekonomii). Konkretny obiekt wybiera się z listy Etihadu przy rezerwacji pakietu — najpóźniej 3 dni przed wylotem, najlepiej od razu po kupnie biletów.',
 price:'0 zł (pakiet stopover Etihad)',near:'centrum Abu Zabi; transfer we własnym zakresie (taxi ~60–80 AED)',
 site:'https://www.etihad.com/en/book/stopover'},
{id:'tokio1',name:'MIMARU Tokyo Ueno EAST',stay:'Tokio · 2 noce (5–7.05)',
 desc:'Aparthotel projektowany pod rodziny: apartament dla 4 osób z aneksem kuchennym i osobną sypialnią. Spokojna okolica Ueno, ~10 min metrem do Asakusy, wygodny start po przylocie.',
 price:'~750–950 zł/noc (apartament 4-os.)',near:'metro Inarichō / JR Ueno',
 site:'https://mimaruhotels.com/en/hotel/ueno-east/'},
{id:'hakone',name:'Hakone Kowakien Ten-yu',stay:'Hakone · 1 noc (7–8.05) · prywatny onsen',
 desc:'Wyższa półka na jedyną noc, gdy nocleg JEST atrakcją: nowoczesny luksusowy ryokan, w którym KAŻDY pokój ma prywatną odkrytą kąpiel onsen (rotenburo) na tarasie — kąpiel o dowolnej porze, bez wspólnych łaźni. Dla 2+2 bierzcie pokój typu „Maisonette" (do 4 osób). Wielodaniowe kaiseki, przyjazny rodzinom, w rejonie Ninotairy/Gōry. WAŻNE: 7.05 to piątek, a pokoi 4-osobowych jest mało — rezerwujcie od razu, gdy tylko otworzą się terminy (na maj 2027 mogą jeszcze nie być dostępne — patrz „Kalendarz przygotowań"). Alternatywy dla 4 osób z prywatnym rotenburo: Hakone Kowakien Mikawaya (typy willowe) lub Ajisai Onsen Ryokan (pokoje rodzinne, darmowe anulowanie na Booking). Zdjęcie: przykładowy rotenburo.',
 price:'~2 400–3 200 zł/noc z HB dla 4 os. (wyższa półka)',near:'Ninotaira, rejon Gōra, na pętli Hakone',
 mapsq:'Hakone Kowakien Ten-yu, Ninotaira, Hakone',
 book:'https://www.booking.com/hotel/jp/hakone-kowakien-tenyu.html',
 site:'https://www.ten-yu.com/en/'},
{id:'kioto',name:'MIMARU Kyoto STATION',stay:'Kioto · 4 noce (8–12.05)',
 desc:'Ta sama rodzinna formuła co w Tokio, tuż przy dworcu Kioto — idealna baza wypadowa na Narę (Kintetsu) i Arashiyamę (JR), a walizki z takkyūbin czekają w recepcji.',
 price:'~800–1 000 zł/noc (apartament 4-os.)',near:'3 min pieszo od dworca Kyoto',
 site:'https://mimaruhotels.com/en/hotel/kyoto-station/'},
{id:'osaka',name:'MIMARU Osaka NAMBA North',stay:'Osaka · 2 noce (12–14.05)',
 desc:'Apartamenty rodzinne w sercu Namby — ~8 minut spacerem od neonów Dōtonbori i 10 od targu Kuromon. Wieczorne wyjścia na street food bez logistyki.',
 price:'~750–950 zł/noc (apartament 4-os.)',near:'metro Nippombashi / Namba',
 site:'https://mimaruhotels.com/en/hotel/namba-north/'},
{id:'tokio2',name:'MIMARU Tokyo GINZA EAST',stay:'Tokio · 1 noc (14–15.05)',
 desc:'Nocleg na finał: spokojna wschodnia Ginza, prosto metrem na Ryōgoku (sumo) i rzut kamieniem od Tokyo Station, skąd rano odjeżdża Narita Express. Alternatywa przy samej hali: APA Ryōgoku Eki Tower (ale pokoje 2-os. — trzeba brać dwa).',
 price:'~850–1 050 zł/noc (apartament 4-os.)',near:'metro Shintomichō / Tokyo Station',
 site:'https://mimaruhotels.com/en/hotel/ginza-east/'},
];
const gmapsQ = name => 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name);
// day date -> hotel id (check-in days)
const DAYHOTEL = {'2027-05-03':'auh','2027-05-05':'tokio1','2027-05-07':'hakone','2027-05-08':'kioto','2027-05-12':'osaka','2027-05-14':'tokio2'};
const DAYINT = {
  '2027-05-03':['g','Wylot z Warszawy + hotel w Abu Zabi'],
  '2027-05-04':['y','Wielki Meczet + Luwr + nocny lot'],
  '2027-05-05':['g','Przylot do Tokio, wieczór w Asakusie'],
  '2027-05-06':['r','Tsukiji + Pokémony + Shibuya Sky'],
  '2027-05-07':['y','Pętla Hakone + ryokan (reset)'],
  '2027-05-08':['g','Onsen → Kioto, wieczór w Gion'],
  '2027-05-09':['r','Fushimi + Kiyomizu + Nishiki (dużo pod górę)'],
  '2027-05-10':['y','Złoty Pawilon + warsztaty kultury'],
  '2027-05-11':['y','Nara — jelenie i Wielki Budda'],
  '2027-05-12':['r','Arashiyama + małpy + przejazd do Osaki'],
  '2027-05-13':['g','Osaka — dzień luzu (bufor)'],
  '2027-05-14':['y','Shinkansen + turniej sumo'],
  '2027-05-15':['g','Ostatnie zakupy + lot do domu'],
};
const DAYFLEX = {
  '2027-05-03':['lot z Warszawy','dzień tranzytowy — nic do wycięcia'],
  '2027-05-04':['nocny lot 21:50 do Tokio','Luwr (opcjonalny); meczet zostawić'],
  '2027-05-05':['przylot + Narita Express','wieczorną Asakusę można skrócić'],
  '2027-05-06':['Pokémon Café i Shibuya Sky (rezerwacje!)','Tsukiji, gdy rano ciężko'],
  '2027-05-07':['ryokan + pętla Hakone','Open-Air Museum (opcja)'],
  '2027-05-08':['shinkansen do Kioto','wieczór w Gion / Pontocho'],
  '2027-05-09':['Fushimi Inari','Nishiki, ewentualnie Kiyomizu'],
  '2027-05-10':['warsztaty kultury (rezerwacja)','Kinkaku-ji'],
  '2027-05-11':['— (cała Nara to opcja, ale hit)','Kasuga Taisha; całość można skrócić'],
  '2027-05-12':['przejazd Kioto → Osaka','małpy na Iwatayamie'],
  '2027-05-13':['nic — cały dzień to bufor','wybierzcie zamek LUB akwarium'],
  '2027-05-14':['SUMO + shinkansen do Tokio','nic — kotwica dnia'],
  '2027-05-15':['lot 18:00 + Narita Express','zakupy dowolnie'],
};

/* ============================ TEMPLATES ============================ */
const TABS = [['index.html','Plan'],['decyzje.html','Dlaczego'],['atrakcje.html','Atrakcje'],['hotele.html','Hotele'],['loty.html','Loty'],['koszty.html','Koszty'],['pogoda.html','Pogoda']];
function nav(active,prefix){
  const t = TABS.map(([h,l])=>`<a href="${prefix}${h}"${(h===active?' class="on"':'')}>${l}</a>`).join('');
  return `<div class="topbar"><div class="navrow"><a class="brand" href="${prefix}index.html">JAPONIA <b>·</b> 2027</a><nav class="tabs">${t}</nav></div></div>`;
}
function pills(curIdx){
  const items = DAYS.map((d,i)=>{
    const [dd] = d.dd.split(' ');
    return `<a href="${d.date}.html"${(i===curIdx?' class="on"':'')}><b>${i+1}</b><span>${dd}.05</span></a>`;
  }).join('');
  return `<div class="pills">${items}</div>`;
}
function shell({title,desc,prefix,active,inner,pillsIdx}){
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="${desc}">
<title>${title}</title>
<link rel="stylesheet" href="${prefix}assets/style.css">
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<div class="progress" id="progress"></div>
${nav(active,prefix)}
${pillsIdx!=null?pills(pillsIdx):''}
<main class="wrap">
${inner}
</main>
<button class="totop" id="totop" aria-label="Do góry">↑</button>
<script src="${prefix}assets/app.js"></script>
</body>
</html>`;
}
function footer(prefix){
  return `<footer>Plan rodzinny · Japonia 3–15 maja 2027 · strona prywatna (noindex)<br>
  Godziny pociągów, ceny biletów, warunki pogodowe i dostępność atrakcji potwierdźcie przed wyjazdem.<br>
  Zdjęcia: Wikimedia Commons (licencje CC) · mapy: © OpenStreetMap · <a href="${prefix}index.html">Strona główna</a></footer>`;
}

function dayPage(d,i){
  const prefix='../';
  const prev=DAYS[i-1], next=DAYS[i+1];
  const tl = d.tl.map(x=>`<li><div class="tm">${x[0]}</div><div class="bd"><p class="h">${x[1]}</p>${x[2]?`<p class="d">${x[2]}</p>`:''}</div></li>`).join('');
  const facts = d.facts.map((f,idx)=>{
    const span=(d.facts.length%2===1 && idx===d.facts.length-1)?' style="grid-column:1/-1"':'';
    return `<div${span}><div class="fv">${f[0]}</div><div class="fk">${f[1]}</div></div>`;
  }).join('');
  const tips = d.tips.map(t=>`<li>${t}</li>`).join('');
  const links = d.links.length?`<div class="linklist">${d.links.map(l=>`<a href="${prefix}atrakcje.html#${l.id}">🎟️ ${l.label}</a>`).join('')}</div>`:'';
  const pc = d.pc?`<div class="pc"><div class="pch">⚖️ ${d.pc.q}</div>${d.pc.opts.map(o=>`<div class="row"><span class="opt">${o[0]}</span> — <span class="plus">za:</span> ${o[1]}; <span class="minus">przeciw:</span> ${o[2]}.</div>`).join('')}</div>`:'';
  const more = d.more.length?`<section class="more"><h2 class="stitle">Więcej o tym dniu</h2><div class="card">${d.more.map(m=>`<details><summary>${m[0]}</summary><p>${m[1]}</p></details>`).join('')}</div></section>`:'';
  const fx = DAYFLEX[d.date];
  const flexNote = fx ? `<div class="flex"><span class="fxlock"><b>🔒 Nie ruszać:</b> ${fx[0]}</span><span class="fxcut"><b>✂️ Można odpuścić:</b> ${fx[1]}</span></div>` : '';
  const hid = DAYHOTEL[d.date];
  const hotelBox = hid ? (()=>{const H=HOTELS.find(h=>h.id===hid);
    return `<a class="hotelbox" href="../hotele.html#${H.id}">🏨 <span><b>Nocleg: ${H.name}</b> — szczegóły, cena i link do mapy →</span></a>`;})() : '';
  const geo = GEO[d.date]||[];
  const gdir = geo.length?`https://www.google.com/maps/dir/${geo.map(g=>g[0]+','+g[1]).join('/')}`:'#';
  const legend = geo.map((g,idx)=>`<li><span class="mn">${idx+1}</span> ${g[2]}</li>`).join('');
  const mapSec = geo.length?`
  <section>
    <h2 class="stitle">Trasa dnia</h2>
    <div class="card">
      <div class="maphold"><button class="mapbtn" id="mapActivate">🗺️ Aktywuj mapę</button><div id="map" class="map"></div></div>
      <ol class="maplegend">${legend}</ol>
      <a class="gmap" href="${gdir}" target="_blank" rel="noopener">📍 Otwórz trasę w Google Maps ↗</a>
      <p class="note" style="margin-top:6px">Orientacyjna trasa — linia łączy główne punkty; dokładny przebieg dróg sprawdź w Google Maps.</p>
      <script type="application/json" id="geo">${JSON.stringify(geo)}</script>
    </div>
  </section>`:'';
  const inner = `
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:${heroBg(d.city, DAYIMG[d.date])}"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Dzień ${i+1} z ${DAYS.length} · ${d.dow} · ${d.dd}</p>
    <h1>${d.title}</h1>
    <p class="lead">${d.lead}</p>
    <div class="chips">${d.chips.map(c=>`<span class="chip">${c}</span>`).join('')}</div>
  </div>
  </header>

  <section>
    <h2 class="stitle">Plan dnia</h2>
    <div class="card"><ul class="tline">${tl}</ul></div>
  </section>

  <section>
    <h2 class="stitle">W skrócie</h2>
    <div class="facts">${facts}</div>
    ${flexNote}
    ${hotelBox}
    ${pc}
  </section>
  ${mapSec}

  <section>
    <h2 class="stitle">Wskazówki praktyczne</h2>
    <div class="card"><ul class="tips">${tips}</ul>${links?'<div style="margin-top:14px">'+links+'</div>':''}</div>
  </section>
  ${more}

  <nav class="daynav">
    ${prev?`<a id="navPrev" href="${prev.date}.html"><div class="dir">← Poprzedni</div><div class="ttl">${prev.dd}</div></a>`:`<a id="navPrev" href="${prefix}index.html"><div class="dir">←</div><div class="ttl">Start</div></a>`}
    <a class="home" href="${prefix}index.html" title="Strona główna">⌂</a>
    ${next?`<a class="nx" id="navNext" href="${next.date}.html"><div class="dir">Następny →</div><div class="ttl">${next.dd}</div></a>`:`<a class="nx" id="navNext" href="${prefix}index.html"><div class="dir">→</div><div class="ttl">Koniec</div></a>`}
  </nav>
  <p class="kbd">Przełączaj dni strzałkami ← → na klawiaturze albo z paska u góry.</p>
  ${footer(prefix)}`;
  return shell({title:`Dzień ${i+1}: ${d.title} · Japonia 2027`,desc:d.lead,prefix,active:'index.html',inner,pillsIdx:i});
}

/* ---- index ---- */
function indexPage(){
  const intLbl={g:'Lekki',y:'Średni',r:'Intensywny'};
  const cards = DAYS.map((d,i)=>{const it=DAYINT[d.date];return `<a class="dcard" href="days/${d.date}.html" style="background:${cardBg(d.city, DAYIMG[d.date])}">
    <div class="dn">${i+1}</div>
    ${it?`<span class="idot ${it[0]}" title="${intLbl[it[0]]} dzień"></span>`:''}
    <div class="dd">${d.dow} · ${d.dd}</div>
    <div class="dt">${d.title}</div>
  </a>`;}).join('');
  const quick = `<div class="quick">
    <a class="qcard" href="decyzje.html"><div class="qi">🧭</div><div class="qh">Dlaczego tak?</div><div class="qd">Logika planu: rytm, decyzje i jak go modyfikować.</div></a>
    <a class="qcard" href="atrakcje.html"><div class="qi">🎟️</div><div class="qh">Atrakcje</div><div class="qd">Godziny, ceny i linki do rezerwacji — 32 miejsca.</div></a>
    <a class="qcard" href="hotele.html"><div class="qi">🏨</div><div class="qh">Hotele</div><div class="qd">5 baz na 11 nocy, pokoje rodzinne, zdjęcia i linki do map.</div></a>
    <a class="qcard" href="loty.html"><div class="qi">✈️</div><div class="qh">Loty</div><div class="qd">Ceny linii, trendy i kiedy nacisnąć „kup".</div></a>
    <a class="qcard" href="koszty.html"><div class="qi">💴</div><div class="qh">Budżet</div><div class="qd">Kalkulator kosztów, transport i widełki 40–60 tys.</div></a>
    <a class="qcard" href="pogoda.html"><div class="qi">☀️</div><div class="qh">Pogoda i pakowanie</div><div class="qd">Pogoda w maju, informacje praktyczne i co spakować.</div></a>
  </div>`;
  const inner = `
  <header class="hero home">
    <div class="hbg"><div class="hbg-img" style="background-image:url('${IMG.fuji}')"></div></div>
    <div class="hgrad"></div>
    <div class="hero-inner">
      <p class="eyebrow">Plan rodzinny · 2+2 · 13 dni</p>
      <h1>Japonia 2027</h1>
      <p class="lead">3–15 maja 2027 · Abu Zabi (stopover) – Tokio – Hakone – Kioto – Osaka. Klasyka pierwszego razu z odrobiną tradycyjnej kultury, Pokémonami dla dzieci i turniejem sumo na finał.</p>
      <div class="chips"><span class="chip">✈️ Etihad</span><span class="chip">🕌 noc w Abu Zabi gratis</span><span class="chip">🏨 11 nocy</span><span class="chip">🥋 turniej sumo</span><span class="chip">♨️ ryokan z onsenem</span></div>
    </div>
    <div class="scrollcue" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></div>
  </header>

  <section class="statband" aria-label="Podróż w liczbach">
    <div class="stt hl"><b id="cd">—</b><span>dni do wylotu</span></div>
    <div class="stt"><b>13</b><span>dni podróży</span></div>
    <div class="stt"><b>5</b><span>baz / miast</span></div>
    <div class="stt"><b>11</b><span>nocy w Japonii</span></div>
    <div class="stt"><b>~42<small>tys zł</small></b><span>budżet 2+2</span></div>
  </section>

  <section>
    <h2 class="stitle">Nasza trasa po Japonii</h2>
    <p class="lead-p">Cała podróż na jednej mapie: z Tokio w góry Hakone, dalej do Kioto (baza na Narę i Arashiyamę), potem Osaka — i szybką koleją z powrotem do Tokio na turniej sumo. Wszystkie większe przejazdy shinkansenem, już po szczycie Golden Week.</p>
    <div class="card">
      <div class="maphold"><button class="mapbtn" id="mapActivate">🗺️ Aktywuj mapę</button><div id="map" class="map"></div></div>
      <ol class="maplegend">${JPSTOPS.map(s=>`<li>${s[2]}</li>`).join('')}</ol>
      <a class="gmap" href="https://www.google.com/maps/dir/Tokyo,+Japan/Hakone/Kyoto/Osaka/Tokyo,+Japan" target="_blank" rel="noopener">📍 Otwórz trasę w Google Maps ↗</a>
      <p class="note" style="margin-top:6px">Linia pokazuje kierunek podróży (Tokio → Hakone → Kioto → Osaka); powrót do Tokio tą samą trasą koleją. Dzień w Abu Zabi (stopover) jest poza tą mapą.</p>
      <script type="application/json" id="geo">${JSON.stringify(JPSTOPS)}</script>
    </div>
  </section>

  <section>
    <h2 class="stitle">Dzień po dniu</h2>
    <p class="lead-p">Kliknij dowolny dzień, żeby zobaczyć plan godzinowy, wskazówki i „w skrócie". Golden Week kończy się 5 maja, więc główne przejazdy robimy już po szczycie tłumów.</p>
    <div class="dgrid">${cards}</div>
    <p class="note" style="margin-top:12px">Kropka na kafelku to obciążenie dnia: <b style="color:var(--success)">●</b> lekki · <b style="color:var(--kin)">●</b> średni · <b style="color:var(--shu)">●</b> intensywny. Więcej w <a href="decyzje.html">Dlaczego tak?</a></p>
  </section>

  <section>
    <h2 class="stitle">Do zaplanowania</h2>
    ${quick}
  </section>
  ${footer('')}`;
  return shell({title:'Japonia 2027 — rodzinny plan wyjazdu',desc:'Plan rodzinnego wyjazdu do Japonii 3–15 maja 2027: agenda dzień po dniu, atrakcje, koszty i pogoda.',prefix:'',active:'index.html',inner,pillsIdx:null});
}

/* ---- koszty (strategy + calculator) ---- */
function kosztyPage(){
  const seg = (t,items)=>`<div class="card" style="margin-bottom:14px"><h3 style="font-family:var(--serif);font-weight:500;font-size:19px;margin:0 0 10px">${t}</h3><ul class="tips">${items.map(i=>`<li>${i}</li>`).join('')}</ul></div>`;
  const inner = `
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(135deg,#122740,#2f6d4f)"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Bilety lotnicze i budżet</p>
    <h1>Bilety i koszty</h1>
    <p class="lead">Ceny Etihad WAW→Tokio falują o ±30% w skali tygodnia. Poniżej progi „kup / czekaj", kalendarz wyprzedaży i kalkulator budżetu dla całej rodziny.</p>
  </div>
  </header>

  <section>
    <h2 class="stitle">Bilety lotnicze</h2>
    <div class="pflag">✈️ <span><b>Ostatnie sprawdzenie ${dpl(FLIGHT.checked)}: ${plz(FLIGHT.adult)}/dorosły</b>${trend()} (${FLIGHT.airline}, WAW→Narita, 3–15.05.2027) — dla 2+2 ≈ <b>~${plz(FLIGHT.family)}</b>. Cena <b>${FLIGHT.band}</b>.</span></div>
    <div class="card"><ul class="tips">
      <li>Ta kwota zasila pole „Loty" w kalkulatorze poniżej i odświeża się automatycznie co tydzień.</li>
      <li>Porównanie linii, wykres trendu, progi „kup / czekaj", kalendarz wyprzedaży i wybór terminu — wszystko na osobnej zakładce.</li>
    </ul>
    <a class="gmap" href="loty.html">✈️ Zobacz ceny, trendy i strategię zakupu → </a></div>
  </section>

  <section>
    <h2 class="stitle">🚄 Transport w Japonii — zweryfikowane taryfy</h2>
    <p class="lead-p">Sprawdzone w lipcu 2026 (miejscówki; kurs ¥100 ≈ 2,33 zł). Młodsze dziecko (do 11 lat) płaci taryfę dziecięcą — na kolei dokładnie połowę.</p>
    ${seg('Pętla shinkansenów',['<b>Odawara → Kioto</b> (8.05): ¥12 300/dorosły · ¥6 140/dziecko','<b>Shin-Osaka → Tokio</b> (14.05, Nozomi): ¥14 720/dorosły · ¥7 360/dziecko','<b>Kioto → Osaka</b> (12.05): lokalny JR ~¥580 (to nie shinkansen)','<b>Razem dla 2+2 (3 dorosłych + 1 dziecko): ~¥96 600 ≈ 2 250 zł</b>','JR Pass 7-dniowy (~¥50 000/os.) się <b>nie opłaca</b> — bilety punktowe są ~2× tańsze'])}
  </section>

  <section>
    <h2 class="stitle">Kalkulator kosztów</h2>
    <p class="lead-p">Szacunek dla <b>2+2</b> na cały wyjazd. Młodsze dziecko (do 11 lat) = taryfa dziecięca: lot ~−15–25%, kolej −50%, wiele atrakcji taniej. Wszystkie pola możesz edytować — suma liczy się na bieżąco, a zmiany zapisują się w przeglądarce.</p>
    <div class="card calc">
      <table>
        <thead><tr><th>Kategoria</th><th style="text-align:right">Ilość / stawka</th><th style="text-align:right">Kwota (zł)</th></tr></thead>
        <tbody>
          <tr><td class="cat">✈️ Loty<span class="hint">Etihad, 3 dorosłych + 1 dziecko do 11 lat (+ bagaż)</span></td><td class="num">—</td><td class="num"><input type="number" id="flights" value="${FLIGHT.family}" min="0" step="100"></td></tr>
          <tr><td class="cat">🏨 Noclegi<span class="hint">średnia z 10 nocy: aparthotele ~820 zł + 1 noc ryokan z prywatnym onsenem ~2 700 zł (Abu Zabi gratis)</span></td><td class="num"><input type="number" id="nights" class="sm" value="10" min="0"><span class="x">×</span><input type="number" id="nightRate" class="sm" value="1000" min="0" step="10"></td><td class="num" id="hotelAmt">—</td></tr>
          <tr><td class="cat">🚄 Transport w Japonii<span class="hint">shinkanseny ~2 250 zł + NEX + metro + Hakone</span></td><td class="num">—</td><td class="num"><input type="number" id="transport" value="4000" min="0" step="100"></td></tr>
          <tr><td class="cat">🍜 Wyżywienie<span class="hint">dni × stawka na rodzinę (w tym dzień w Abu Zabi)</span></td><td class="num"><input type="number" id="days" class="sm" value="13" min="0"><span class="x">×</span><input type="number" id="foodRate" class="sm" value="500" min="0" step="10"></td><td class="num" id="foodAmt">—</td></tr>
          <tr><td class="cat">🎟️ Atrakcje i warsztaty<span class="hint">sumo, warsztaty, Pokémon Café, akwarium, Shibuya Sky</span></td><td class="num">—</td><td class="num"><input type="number" id="attractions" value="2600" min="0" step="100"></td></tr>
          <tr><td class="cat">🎁 Pamiątki + rezerwa<span class="hint">bufor na nieprzewidziane</span></td><td class="num">—</td><td class="num"><input type="number" id="extras" value="3000" min="0" step="100"></td></tr>
        </tbody>
        <tfoot><tr class="tot"><td class="cat">Suma całkowita</td><td></td><td class="num big" id="total">—</td></tr></tfoot>
      </table>
    </div>
    <div class="stats">
      <div class="stat"><div class="k">Na osobę</div><div class="v" id="perPerson">—</div></div>
      <div class="stat"><div class="k">Na dzień (4 os.)</div><div class="v" id="perDay">—</div></div>
      <div class="stat"><div class="k">Nocleg / noc</div><div class="v" id="perNight">—</div></div>
    </div>
    <div class="card" style="margin-top:14px">
      <div style="display:flex;justify-content:space-between"><strong>Budżet: 40 000 – 60 000 zł</strong><span id="budgetPct" style="font-weight:800"></span></div>
      <div class="bar"><div class="fill" id="barFill"></div></div>
      <div class="barlab"><span>0</span><span>40k</span><span>60k</span><span>70k</span></div>
      <div id="verdict" style="font-weight:700;margin-top:8px"></div>
      <div class="note" style="margin-top:10px">Orientacyjne kwoty w PLN. JR Pass zwykle się nie opłaca przy pętli Tokio–Kioto–Osaka.</div>
      <button class="reset" id="resetBtn" type="button">↺ Przywróć wartości domyślne</button>
    </div>
  </section>
  ${footer('')}
  <script>
  (function(){
    var D={flights:${FLIGHT.family},nights:10,nightRate:1000,transport:4000,days:13,foodRate:500,attractions:2600,extras:3000};
    var ids=Object.keys(D),KEY="jp2027.calc";
    var fmt=function(n){return Math.round(n).toLocaleString("pl-PL")+" zł";};
    function num(id){var v=parseFloat(document.getElementById(id).value);return isNaN(v)?0:v;}
    function css(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
    // Przywróć zapisane wartości, ALE nowa cena lotu ma pierwszeństwo:
    // jeśli użytkownik nie zmieniał pola "loty" ręcznie, wskocz na świeży kurs.
    var priceRefreshed=false;
    try{
      var s=JSON.parse(localStorage.getItem(KEY))||{};
      // s._fd==null => zapis sprzed wprowadzenia znacznika (stara, nieaktualna cena) => przyjmij świeżą
      var untouched = s._fd==null || Number(s.flights)===Number(s._fd);
      ids.forEach(function(id){
        if(id==="flights" && (untouched || s.flights==null)) return; // zostaw nowy domyślny
        if(s[id]!=null) document.getElementById(id).value=s[id];
      });
      if(untouched && Number(s._fd)!==D.flights) priceRefreshed=true;
    }catch(e){}
    if(priceRefreshed){
      var fl=document.getElementById("flights");
      fl.style.transition="background .6s"; fl.style.background="var(--sakura)";
      setTimeout(function(){fl.style.background="";},2400);
    }
    function calc(){
      var hotel=num("nights")*num("nightRate"),food=num("days")*num("foodRate");
      document.getElementById("hotelAmt").textContent=fmt(hotel);
      document.getElementById("foodAmt").textContent=fmt(food);
      var total=num("flights")+hotel+num("transport")+food+num("attractions")+num("extras");
      document.getElementById("total").textContent=fmt(total);
      document.getElementById("perPerson").textContent=fmt(total/4);
      document.getElementById("perDay").textContent=fmt(total/(num("days")||1));
      document.getElementById("perNight").textContent=fmt(hotel/(num("nights")||1));
      var pct=Math.max(0,Math.min(100,total/70000*100)),f=document.getElementById("barFill");f.style.width=pct+"%";
      var col,v,vc;
      if(total<40000){col=css("--ai");v="Poniżej widełek — jest zapas na lepsze hotele.";vc=css("--muted");}
      else if(total<=60000){col=css("--success");v="✅ Mieści się w budżecie 40–60 tys. zł.";vc=css("--success");}
      else if(total<=68000){col=css("--kin");v="⚠️ Nieco ponad budżet — przytnij atrakcje lub standard noclegów.";vc=css("--kin");}
      else{col=css("--shu");v="⛔ Wyraźnie ponad budżet.";vc=css("--shu");}
      f.style.background=col;var vd=document.getElementById("verdict");vd.textContent=v;vd.style.color=vc;
      document.getElementById("budgetPct").textContent=fmt(total);
      var o={};ids.forEach(function(id){o[id]=num(id);});o._fd=D.flights;try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}
    }
    ids.forEach(function(id){document.getElementById(id).addEventListener("input",calc);});
    document.getElementById("resetBtn").addEventListener("click",function(){ids.forEach(function(id){document.getElementById(id).value=D[id];});calc();});
    calc();
  })();
  </script>`;
  return shell({title:'Bilety i koszty · Japonia 2027',desc:'Strategia zakupu biletów lotniczych i kalkulator budżetu wyjazdu do Japonii.',prefix:'',active:'koszty.html',inner,pillsIdx:null});
}

/* ---- hotele ---- */
function hotelePage(){
  const cards = HOTELS.map(H=>`
    <div class="hcard" id="${H.id}">
      <div class="hmain">
        <div class="hstay">${H.stay}</div>
        <h3>${H.name}</h3>
        <p class="desc">${H.desc}</p>
        <div class="meta"><span>💴 <b>${H.price}</b> — orientacyjnie, maj = sprawdzić przy rezerwacji</span><span>📍 ${H.near}</span></div>
        <div class="links"><a href="${gmapsQ(H.mapsq||H.name)}" target="_blank" rel="noopener">Google Maps →</a><a href="${H.site}" target="_blank" rel="noopener">strona hotelu →</a>${H.book?`<a href="${H.book}" target="_blank" rel="noopener">Sprawdź dostępność →</a>`:''}</div>
      </div>
      <a class="hphoto" href="${H.id==='auh'?H.site:gmapsQ(H.mapsq||H.name)}" target="_blank" rel="noopener">
        <img src="assets/img/hotels/${H.id}.jpg" alt="${H.name}" loading="lazy">
        <span class="plab">📍 ${H.id==='auh'?'Etihad Stopover →':'Zobacz w Google Maps →'}</span>
      </a>
    </div>`).join('');
  const HOTELGEO=[
    [35.7108,139.7823,'MIMARU Tokyo Ueno EAST · Tokio (start)'],
    [35.2470,139.0530,'Hakone Kowakien Ten-yu · Hakone'],
    [34.9880,135.7590,'MIMARU Kyoto Station · Kioto'],
    [34.6680,135.5030,'MIMARU Osaka Namba North · Osaka'],
    [35.6708,139.7726,'MIMARU Tokyo Ginza EAST · Tokio (finał)'],
  ];
  const inner=`
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(120deg,rgba(27,58,107,.58),rgba(18,39,64,.40)),url('${IMG.tokyostation}') center/cover"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Noclegi · 10 nocy w Japonii + gratis Abu Zabi · pokoje rodzinne 4-os.</p>
    <h1>Hotele</h1>
    <p class="lead">Pięć baz w Japonii pod rodzinę 2+2 (aparthotele MIMARU i ryokan z onsenem) plus darmowa noc stopover w Abu Zabi od Etihadu. Kliknij zdjęcie hotelu, aby otworzyć jego lokalizację w Google Maps.</p>
  </div>
  </header>
  <section>
    <div class="hlist">${cards}</div>
  </section>
  <section>
    <h2 class="stitle">Mapa baz w Japonii</h2>
    <div class="card">
      <div class="maphold"><button class="mapbtn" id="mapActivate">🗺️ Aktywuj mapę</button><div id="map" class="map"></div></div>
      <ol class="maplegend">${HOTELGEO.map((g,i)=>`<li><span class="mn">${i+1}</span> ${g[2]}</li>`).join('')}</ol>
      <a class="gmap" href="https://www.google.com/maps/dir/${HOTELGEO.map(g=>g[0]+','+g[1]).join('/')}" target="_blank" rel="noopener">📍 Trasa baz w Google Maps ↗</a>
      <script type="application/json" id="geo">${JSON.stringify(HOTELGEO)}</script>
    </div>
  </section>
  <section>
    <div class="card"><ul class="tips">
      <li><b>Rezerwujcie wrzesień–październik 2026</b> z darmowym anulowaniem (Booking/strony hoteli) — pokoje 4-osobowe znikają pierwsze, a początek maja łapie ogon Golden Week.</li>
      <li>Ryokan w Hakone (wyższa półka): wybierzcie pokój z prywatnym rotenburo i potwierdźcie kaiseki + japońskie śniadanie w cenie.</li>
      <li>Ceny to widełki orientacyjne za pokój/apartament dla 4 osób; suma 10 płatnych nocy ≈ 8–10 tys. zł (w kalkulatorze liczymy 10 × 820 zł; noc w Abu Zabi gratis).</li>
      <li>Pakiet stopover (hotel w Abu Zabi) rezerwujcie na etihad.com od razu po kupnie biletów — popularne terminy znikają, a promocję trzeba potwierdzić dla maja 2027.</li>
      <li>Adresy dla taksówkarza najlepiej pokazywać z Google Maps po japońsku — kliknięcie zdjęcia hotelu otwiera właściwe miejsce od razu.</li>
    </ul></div>
  </section>
  ${footer('')}`;
  return shell({title:'Hotele · Japonia 2027',desc:'Noclegi wyjazdu do Japonii: aparthotele rodzinne i ryokan, z kodami QR do Google Maps.',prefix:'',active:'hotele.html',inner,pillsIdx:null});
}

/* ---- decyzje / dlaczego ---- */
function decyzjePage(){
  const pill={g:'Lekki',y:'Średni',r:'Intensywny'};
  const rows=DAYS.map((d,i)=>{const it=DAYINT[d.date]||['y',''];return `<tr><td class="dcol">${i+1} · ${d.dd}</td><td>${it[1]}</td><td><span class="ipill ${it[0]}">${pill[it[0]]}</span></td></tr>`;}).join('');
  const inner=`
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(120deg,rgba(27,58,107,.62),rgba(200,64,44,.5)),url('${IMG.fushimi}') center/cover"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Zrozum i zmień plan</p>
    <h1>Dlaczego tak?</h1>
    <p class="lead">Cała logika za tym planem w jednym miejscu — co jest stałe, co możesz ruszyć i jak. Żebyście modyfikowali go świadomie, nie na wyczucie.</p>
  </div>
  </header>

  <section>
    <h2 class="stitle">Rytm wyjazdu</h2>
    <p class="lead-p">Zmęczenie u rodzin przychodzi w 4.–5. dniu — dlatego reset (ryokan + najlżejszy dzień) wypada dokładnie tam, a zielone dni to bufory. Żaden intensywny dzień nie następuje po intensywnym.</p>
    <div class="card" style="overflow-x:auto"><table class="rhythm">
      <thead><tr><th>Dzień</th><th>Sedno</th><th style="text-align:right">Obciążenie</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <div class="dnote" style="margin-top:12px">💡 Dwa punkty nacisku: <b>6.05</b> — najcięższy dzień w drugiej dobie po locie (jeśli rano ciężko, odpuśćcie Tsukiji); <b>12→15.05</b> — trzy zmiany łóżka w cztery doby (cena za sumo, dlatego 13.05 jest pusty z założenia).</div>
  </section>

  <section>
    <h2 class="stitle">📅 Kalendarz przygotowań — deadline'y</h2>
    <p class="lead-p">Do kiedy co załatwić. Trzy alerty (loty, noclegi, pogoda) same przypomną się w aplikacji.</p>
    <div class="card"><ul class="tips">
      <li><b>✈️ Loty — twardy deadline: koniec stycznia 2027.</b> Cel: 11–13 tys. zł na Black Friday (20.11–2.12.2026) albo w styczniowej wyprzedaży Etihad/Qatar. Później tylko drożej (4 miejsca + ogon Golden Week). Alerty: 1.10, 20.11, 22.12.2026, 12.01, 25.01.2027. <a href="koszty.html">Progi i strategia →</a></li>
      <li><b>🏨 Noclegi — rezerwować wrzesień–październik 2026</b> z darmowym anulowaniem. Pokoje 4-osobowe i ryokan z prywatnym rotenburo znikają pierwsze, a początek maja to ogon Golden Week. Pakiet stopover w Abu Zabi: na etihad.com od razu po kupnie biletów (potwierdzić najpóźniej 3 dni przed wylotem). <span class="ipill y">alert: 15.09.2026</span></li>
      <li><b>🎟️ Rezerwacje czasowe:</b> Nintendo Museum — loteria ~luty 2027 · warsztaty kultury w Kioto — 1–2 miesiące wcześniej · bilety sumo — ~początek kwietnia 2027 (znikają 1. dnia) · Shibuya Sky — 4 tygodnie wcześniej (slot na zachód słońca) · Pokémon Café — 31 dni wcześniej o 18:00 czasu japońskiego.</li>
      <li><b>☔ Pogoda — dostrajać najpóźniej ~7 dni przed</b> (wcześniej prognoza jest niewiarygodna). Wtedy przełóżcie Shibuya Sky na najpogodniejszy wieczór i rezerwujcie slot tylko przy dobrej prognozie. <b>Rano danego dnia:</b> status kolejki w Hakone (hakonenavi.jp — wiatr/gaz), w razie czego Open-Air Museum; Fudżi to loteria. Dni z buforem (13.05) i plany B pochłaniają deszcz bez przebudowy. <span class="ipill y">alert: 26.04.2027</span></li>
    </ul></div>
  </section>

  <section>
    <h2 class="stitle">Kluczowe decyzje — i dlaczego</h2>
    <div class="card more">
      <details><summary>Daty 3–15 maja</summary><p>Najtańsza kombinacja w całej siatce cen (dziś ~13 900 zł/4 os.) i zarazem najdłuższa sensowna. Wyloty 30.04–2.05 są o 2,5–5 tys. droższe (ogon Golden Week) i wpadają w szczyt tłumów oraz droższych hoteli. Golden Week kończy się 5 maja.</p></details>
      <details><summary>Długość: 10 nocy w Japonii</summary><p>~59% budżetu to koszty stałe (loty, pętla shinkansenów), niezależne od długości. Skrócenie o 2 dni to ledwie −5% kosztu, ale −17% wyjazdu — i paradoksalnie DROŻSZY bilet (krótsze kombinacje w siatce są droższe). Wydłużenie w tym oknie oznacza wejście w Golden Week.</p></details>
      <details><summary>Stopover w Abu Zabi</summary><p>Darmowy hotel 4★ od Etihadu (postój &gt;24 h), przelot rozbity na 6 + 10 h z nocą snu — z dziećmi zupełnie inna jakość niż 18 h ciurkiem. Kosztuje 1 dzień w Tokio (start skrócony do 2 nocy). Możliwy wariant z 2 nocami (obie gratis) — patrz „Jak modyfikować".</p></details>
      <details><summary>Trasa i bazy: Tokio–Hakone–Kioto–Osaka</summary><p>To niemal 1:1 szkielet najlepiej ocenianych (4,9–5,0★) rodzinnych tourów: Kioto 4 noce jako hub z wycieczką do Nary, ryokan wciśnięty w środek jako „reset", 2–4 noce na bazę (każda przeprowadzka to pół dnia logistyki).</p></details>
      <details><summary>Ryokan w środku trasy — wyższa półka</summary><p>To jedyna noc, gdy nocleg JEST atrakcją (onsen, kaiseki, tatami). Dlatego tu — i tylko tu — warto dopłacić: pokój z prywatnym rotenburo to wspomnienie, nie tylko łóżko. Reszta hoteli (MIMARU) zostaje standardowa, bo pokój dla 4 i lokalizacja liczą się bardziej niż gwiazdki.</p></details>
      <details><summary>Sumo 14 maja — kotwica nie do ruszenia</summary><p>Traficie na dzień 6 turnieju Natsu Basho. Touroperatorzy oferują tylko pokazy i lekcje; prawdziwy turniej to przewaga, której nie kupicie w pakiecie. Cała końcówka trasy jest ułożona pod tę datę.</p></details>
    </div>
  </section>

  <section>
    <h2 class="stitle">Co jest stałe, a co możesz ruszyć</h2>
    <div class="twocol">
      <div class="card"><h3 style="font-family:var(--serif);font-weight:500;font-size:18px;margin:0 0 8px">⚓ Stałe (kotwice)</h3><ul class="tips">
        <li>Daty i godziny lotów Etihad</li>
        <li>Turniej sumo — 14.05 (dzień 6)</li>
        <li>Ryokan-reset w Hakone (środek trasy)</li>
        <li>Pętla shinkansenów Tokio→Kioto→Osaka→Tokio</li>
      </ul></div>
      <div class="card"><h3 style="font-family:var(--serif);font-weight:500;font-size:18px;margin:0 0 8px">🔧 Elastyczne</h3><ul class="tips">
        <li>Poszczególne atrakcje w każdym dniu</li>
        <li>Kolejność Nara ↔ Arashiyama</li>
        <li>Dzień luzu w Osace (13.05) — bufor</li>
        <li>Zakres warsztatów; opcje ninja / taiko / Round1</li>
      </ul></div>
    </div>
  </section>

  <section>
    <h2 class="stitle">Jak modyfikować</h2>
    <div class="card more">
      <details><summary>✂️ Chcę krócej / taniej o kilka dni</summary><p>Kolejność cięć bez psucia rytmu: <b>Nishiki (9.05) → Kinkaku-ji (10.05) → rejs Tombori (13.05)</b>. Wyrzucenie całej bazy (Osaka) tylko w ostateczności. Uwaga: każdy skrócony wariant ma WYŻSZY koszt jednostkowy dnia i droższy bilet — oszczędność ~1,4–1,5 tys./dzień, ale ~1,7 tys. traci się na samym bilecie. Progi i liczby: <a href="koszty.html">Bilety i koszty</a>.</p></details>
      <details><summary>➕ Chcę dłużej</summary><p>W tym oknie (30.04–15.05) dłużej = Golden Week (loty +2,5–5 tys., hotele +30–80%, tłumy). Jedyne sensowne wydłużenie: <b>2 noce w Abu Zabi „tam"</b> (start 2.05) — obie noce gratis z programu Etihad, drugi dzień to Yas Island (parki klimatyzowane, hit dla dzieci w 40°C). Koszt: +1 dzień urlopu. Postój w drodze powrotnej odpada — nie jest darmowy, łamie okno i kasuje sumo.</p></details>
      <details><summary>🎮 Chcę więcej frajdy dla dzieci</summary><p>W odwodzie (opcje, nie obowiązki): <b>klasa ninja</b> w Kioto (przy Nishiki), <b>warsztat taiko</b>, <b>Round1 + karaoke</b> w Osace, <b>Hakone Open-Air Museum</b> oraz <b>Nintendo Museum</b> w Ujī (loteria biletów ~luty 2027, paszporty). Karty i ceny: <a href="atrakcje.html">Atrakcje</a>.</p></details>
      <details><summary>😌 Chcę luźniej na miejscu</summary><p>Dni „Intensywne" (6, 9, 12.05) mają zawory bezpieczeństwa: 6.05 odpuśćcie Tsukiji; 9.05 skróćcie do Fushimi + Kiyomizu; 12.05 odpuśćcie małpy Iwatayama. Decyzja przy śniadaniu — nic nie trzeba zmieniać z góry.</p></details>
      <details><summary>🏨 Chcę wyższy standard hoteli</summary><p>Poza ryokanem — raczej nie warto. W Japonii „gwiazdki" bywają pułapką: droższe hotele często mają mniejsze pokoje mieszczące 3 os. (dwa pokoje = drożej i rozdziela rodzinę) i gorszą lokalizację. MIMARU (apartament dla 4) to wybór ekspercki, nie kompromis. Zapas budżetu lepiej wydać na przeżycia niż na łóżka.</p></details>
    </div>
  </section>

  <p class="kbd" style="margin-top:24px"><a href="index.html" style="font-weight:700">← wróć do planu dzień po dniu</a></p>
  ${footer('')}`;
  return shell({title:'Dlaczego tak? — decyzje i modyfikacja planu · Japonia 2027',desc:'Logika planu wyjazdu do Japonii: rytm, kluczowe decyzje, co stałe vs elastyczne i jak modyfikować.',prefix:'',active:'decyzje.html',inner,pillsIdx:null});
}

/* ---- pogoda ---- */
/* ============ PLAN DO DRUKU / PDF (wzorzec: PDF-y islandzkie) ============ */
function drukPage(){
  const IL = {g:'Lekki', y:'Średni', r:'Intensywny'};
  const toc = DAYS.map((d,i)=>{
    const it = DAYINT[d.date];
    return `<li><span class="tn">${i+1}</span><span class="td">${d.dd}</span><span class="tt">${d.title}</span><span class="ti ti-${it?it[0]:'g'}">${it?IL[it[0]]:''}</span></li>`;
  }).join('');

  const days = DAYS.map((d,i)=>{
    const it = DAYINT[d.date], fx = DAYFLEX[d.date], hid = DAYHOTEL[d.date];
    const H = hid ? HOTELS.find(h=>h.id===hid) : null;
    const rows = d.tl.map(([t,h,desc])=>`<tr><td class="t">${t}</td><td><b>${h}</b>${desc?`<span class="dsc">${desc}</span>`:''}</td></tr>`).join('');
    const facts = d.facts.map(([v,k])=>`<span><b>${v}</b>${k}</span>`).join('');
    return `<section class="pg day">
      <div class="dhead">
        <div class="dnum">Dzień ${i+1} <span>z ${DAYS.length}</span></div>
        <div class="dwhen">${d.dow} · ${d.dd} 2027${it?` · <b class="ti-${it[0]}">${IL[it[0]]}</b>`:''}</div>
      </div>
      <h2>${d.title}</h2>
      <p class="lead">${d.lead}</p>
      <table class="agenda">${rows}</table>
      <div class="facts">${facts}</div>
      ${fx?`<div class="flex"><p><b>🔒 Nie ruszać:</b> ${fx[0]}</p><p><b>✂️ Można odpuścić:</b> ${fx[1]}</p></div>`:''}
      ${H?`<p class="blk"><b>🏨 Nocleg:</b> ${H.name} — ${H.near}</p>`:''}
      ${d.tips&&d.tips.length?`<div class="blk"><b>Wskazówki</b><ul>${d.tips.map(t=>`<li>${t}</li>`).join('')}</ul></div>`:''}
      <div class="pfoot">Japonia 3–15 maja 2027 · Dzień ${i+1} — ${d.dd}</div>
    </section>`;
  }).join('');

  const hotels = HOTELS.map(H=>`<tr><td><b>${H.name}</b><span class="dsc">${H.stay}</span></td><td class="r">${H.price}</td></tr>`).join('');

  const inner = `<div class="sheet">

  <section class="pg cover">
    <div class="band"></div>
    <div class="ctitle">
      <p class="keyb">Plan podróży</p>
      <h1>Japonia 2027</h1>
      <p class="csub">3–15 maja 2027 · rodzina 2+2 (dzieci 11 i 13 lat)</p>
      <p class="csub2">Abu Zabi · Tokio · Hakone · Kioto · Nara · Osaka</p>
      <div class="rule"></div>
    </div>
    <div class="cfacts">
      <div><b>13</b>dni podróży</div><div><b>11</b>nocy w Japonii</div>
      <div><b>5</b>baz noclegowych</div><div><b>~42<i>tys. zł</i></b>budżet 2+2</div>
    </div>
    <h3 class="toch">Spis treści</h3>
    <ol class="toc">${toc}</ol>
    <p class="cnote">Godziny pociągów, ceny biletów, warunki pogodowe i dostępność atrakcji potwierdźcie przed wyjazdem.
    Wersja online zawiera mapy tras, zdjęcia i kalkulator kosztów: <b>japonia-2027.vercel.app</b></p>
    <div class="pfoot">Japonia 3–15 maja 2027 · Plan podróży</div>
  </section>

  ${days}

  <section class="pg">
    <div class="dhead"><div class="dnum">Aneks</div><div class="dwhen">Noclegi, terminy i praktyka</div></div>
    <h2>Informacje praktyczne</h2>

    <h3>Noclegi</h3>
    <table class="agenda">${hotels}</table>
    <p class="note">Nocleg w Abu Zabi jest bezpłatny w ramach pakietu Etihad Stopover — rezerwuje się go osobno na etihad.com, najpóźniej 3 dni przed wylotem.</p>

    <h3>Terminy, których nie można przegapić</h3>
    <table class="agenda">
      <tr><td class="t">do I 2027</td><td><b>Bilety lotnicze</b><span class="dsc">Twardy deadline: koniec stycznia 2027. Najlepsze okna: Black Friday (20.11–2.12.2026) i styczniowa wyprzedaż Etihad.</span></td></tr>
      <tr><td class="t">IX–X 2026</td><td><b>Noclegi</b><span class="dsc">Rezerwować z darmowym anulowaniem — pokoje 4-osobowe i ryokan z prywatnym onsenem znikają pierwsze.</span></td></tr>
      <tr><td class="t">~II 2027</td><td><b>Nintendo Museum</b><span class="dsc">Loteria biletowa (opcja na dzień w Narze).</span></td></tr>
      <tr><td class="t">~IV 2027</td><td><b>Bilety na sumo</b><span class="dsc">Sprzedaż ~początek kwietnia na sumo.or.jp — wyprzedają się w godziny. Turniej: 9–23.05.2027.</span></td></tr>
      <tr><td class="t">4 tyg.</td><td><b>Shibuya Sky</b><span class="dsc">Slot na zachód słońca; rezerwować tylko przy dobrej prognozie.</span></td></tr>
      <tr><td class="t">31 dni</td><td><b>Pokémon Café</b><span class="dsc">Rezerwacja otwiera się 31 dni wcześniej o 18:00 czasu japońskiego.</span></td></tr>
      <tr><td class="t">~7 dni</td><td><b>Dostrojenie do pogody</b><span class="dsc">Wcześniej prognoza jest niewiarygodna. Rano danego dnia: status kolejki w Hakone (hakonenavi.jp).</span></td></tr>
    </table>

    <h3>Transport w Japonii</h3>
    <table class="agenda">
      <tr><td class="t">8.05</td><td><b>Odawara → Kioto</b><span class="dsc">Shinkansen Hikari · ¥12 300 dorosły / ¥6 140 dziecko</span></td></tr>
      <tr><td class="t">12.05</td><td><b>Kioto → Osaka</b><span class="dsc">Lokalny JR · ~¥580</span></td></tr>
      <tr><td class="t">14.05</td><td><b>Shin-Osaka → Tokio</b><span class="dsc">Shinkansen Nozomi · ¥14 720 dorosły / ¥7 360 dziecko</span></td></tr>
    </table>
    <p class="note"><b>JR Pass się nie opłaca</b> (~¥50 000/os.) — bilety punktowe są ok. 2× tańsze. Do Hakone: Hakone Free Pass (Odakyu). W miastach: karty IC Suica/PASMO/ICOCA. Bagaże między bazami: kurier takkyūbin (~¥2 000/szt.).</p>

    <h3>Praktyka</h3>
    <ul class="plist">
      <li><b>Gotówka:</b> bankomaty 7-Eleven i Japan Post przyjmują karty zagraniczne. Napiwków się nie daje.</li>
      <li><b>Internet:</b> jeden router pocket WiFi na 4 osoby albo eSIM wgrany przed wylotem.</li>
      <li><b>Prąd:</b> 100 V, gniazdka typu A (dwa płaskie bolce) — potrzebny adapter.</li>
      <li><b>Alarmowe:</b> 110 policja · 119 pogotowie i straż. Woda z kranu jest zdatna do picia.</li>
      <li><b>Zwyczaje:</b> buty zdejmujemy w ryokanie i świątyniach; w pociągach cisza; koszy na śmieci prawie nie ma.</li>
      <li><b>Bagaż:</b> podręczny + plecak wystarczą — pranie w aparthotelach MIMARU (Kioto). Limit ~7 kg/os. w kabinie.</li>
      <li><b>Tax-free</b> od ~5 000 ¥ za okazaniem paszportu.</li>
    </ul>
    <div class="pfoot">Japonia 3–15 maja 2027 · Aneks praktyczny</div>
  </section>
</div>`;

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="Plan podróży do Japonii 3–15 maja 2027 w wersji do druku i zapisu jako PDF.">
<title>Plan do druku (PDF) · Japonia 2027</title>
<style>
:root{--ink:#1c2530;--muted:#5f666e;--line:#d9d3c6;--ai:#1b3a6b;--dark:#0f1c2e;--shu:#c8402c;
  --kin:#b98a34;--ok:#2f6d4f;--paper:#f5f1e8;--serif:Georgia,"Times New Roman",serif;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);line-height:1.5;font-size:14px}
.topbar{position:sticky;top:0;z-index:9;background:var(--dark);color:#fff;padding:11px 18px;
  display:flex;gap:14px;align-items:center;flex-wrap:wrap;box-shadow:0 2px 12px rgba(0,0,0,.18)}
.topbar b{font-family:var(--serif);font-weight:500;letter-spacing:.05em;margin-right:auto}
.topbar a{color:rgba(255,255,255,.85);text-decoration:none;font-size:13px}
.btn{background:var(--shu);color:#fff;border:none;border-radius:999px;padding:9px 20px;font-weight:700;
  font-size:14px;cursor:pointer;font-family:var(--sans)}
.btn:hover{filter:brightness(1.08)}
.hint{max-width:820px;margin:18px auto 0;padding:12px 18px;background:#fffdf8;border:1px dashed var(--kin);
  border-radius:12px;font-size:13px;color:var(--muted)}
.sheet{max-width:820px;margin:18px auto 60px;padding:0 16px}
.pg{background:#fff;border:1px solid var(--line);border-radius:6px;padding:34px 40px 30px;margin-bottom:22px;position:relative}
h1{font-family:var(--serif);font-weight:500;font-size:44px;line-height:1.05;margin:0;letter-spacing:-.01em}
h2{font-family:var(--serif);font-weight:500;font-size:26px;line-height:1.15;margin:2px 0 6px;letter-spacing:-.01em}
h3{font-family:var(--serif);font-weight:500;font-size:19px;margin:22px 0 8px}
/* okładka */
.cover{padding-top:0;overflow:hidden}
.band{background:var(--dark);height:64px;margin:0 -40px 30px}
.ctitle{text-align:center}
.keyb{text-transform:uppercase;letter-spacing:.22em;font-size:11px;font-weight:700;color:var(--kin);margin:0 0 8px}
.csub{color:var(--ai);font-size:15px;margin:12px 0 2px;font-weight:600}
.csub2{color:var(--muted);font-size:14px;margin:0}
.rule{height:2px;background:var(--shu);width:180px;margin:20px auto 0}
.cfacts{display:flex;justify-content:center;gap:26px;flex-wrap:wrap;margin:24px 0 6px;text-align:center}
.cfacts div{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}
.cfacts b{display:block;font-family:var(--serif);font-weight:500;font-size:27px;color:var(--ai);letter-spacing:-.01em}
.cfacts i{font-size:12px;font-style:normal;color:var(--muted)}
.toch{text-align:center;margin-top:26px}
.toc{list-style:none;margin:0;padding:0;font-size:13.5px}
.toc li{display:flex;align-items:baseline;gap:10px;padding:6px 2px;border-bottom:1px dotted var(--line)}
.toc .tn{flex:0 0 22px;font-weight:800;color:var(--shu);font-size:12px}
.toc .td{flex:0 0 74px;color:var(--muted)}
.toc .tt{flex:1}
.toc .ti{flex:0 0 auto;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.ti-g{color:var(--ok)}.ti-y{color:var(--kin)}.ti-r{color:var(--shu)}
.cnote{margin-top:22px;font-size:11.5px;color:var(--muted);text-align:center;line-height:1.6}
/* dzień */
.dhead{display:flex;justify-content:space-between;align-items:baseline;gap:12px;
  border-bottom:2px solid var(--dark);padding-bottom:7px;margin-bottom:14px;flex-wrap:wrap}
.dnum{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:var(--shu)}
.dnum span{color:var(--muted);font-weight:600}
.dwhen{font-size:12px;color:var(--muted)}
.lead{color:var(--muted);font-size:14px;margin:0 0 16px;max-width:62ch}
.agenda{width:100%;border-collapse:collapse;font-size:13px}
.agenda td{padding:7px 0;border-bottom:1px solid #ececec;vertical-align:top}
.agenda td.t{width:62px;font-weight:800;color:var(--ai);white-space:nowrap;font-variant-numeric:tabular-nums}
.agenda td.r{text-align:right;white-space:nowrap;color:var(--muted)}
.agenda tr:last-child td{border-bottom:none}
.dsc{display:block;color:var(--muted);font-size:12.5px;margin-top:2px}
.facts{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 0}
.facts span{flex:1 1 118px;border:1px solid var(--line);border-radius:8px;padding:7px 10px;font-size:10.5px;
  text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.facts b{display:block;font-size:13px;text-transform:none;letter-spacing:0;color:var(--ink);margin-bottom:1px}
.flex{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}
.flex p{flex:1 1 240px;margin:0;font-size:12.5px;border:1px solid var(--line);border-radius:8px;padding:8px 11px;background:#fbf9f4}
.blk{margin-top:14px;font-size:13px}
.blk ul{margin:6px 0 0;padding-left:18px}
.blk li{margin:4px 0}
.plist{margin:8px 0 0;padding-left:18px;font-size:13px}
.plist li{margin:6px 0}
.note{font-size:12px;color:var(--muted);margin-top:8px}
.pfoot{margin-top:22px;padding-top:8px;border-top:1px solid var(--line);font-size:10.5px;color:var(--muted);text-align:center}

@media print{
  @page{size:A4;margin:15mm 14mm}
  html,body{background:#fff}
  body{font-size:10.5pt;line-height:1.42}
  .topbar,.hint{display:none !important}
  .sheet{max-width:none;margin:0;padding:0}
  .pg{border:none;border-radius:0;padding:0;margin:0;page-break-after:always;break-after:page}
  .pg:last-child{page-break-after:auto;break-after:auto}
  .band{margin:0 0 22px;height:46px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .cover{padding-top:0}
  h1{font-size:34pt}h2{font-size:18pt}h3{font-size:13pt;margin:16px 0 6px}
  .cfacts b{font-size:19pt}
  .agenda{font-size:9.5pt}
  .agenda tr,.toc li,.facts span,.flex p{page-break-inside:avoid;break-inside:avoid}
  .day h2,.dhead{page-break-after:avoid;break-after:avoid}
  .pfoot{position:absolute;bottom:0;left:0;right:0}
  .pg{padding-bottom:14mm}
  a{color:inherit;text-decoration:none}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style>
</head>
<body>
<div class="topbar no-print">
  <b>JAPONIA · 2027 — plan do druku</b>
  <a href="index.html">← wróć do strony</a>
  <button class="btn" type="button" onclick="window.print()">🖨️ Drukuj / zapisz jako PDF</button>
</div>
<p class="hint">Kliknij <b>„Drukuj / zapisz jako PDF"</b>, a w oknie drukowania wybierz miejsce docelowe <b>„Zapisz jako PDF"</b>. Ustaw format <b>A4</b> i włącz <b>grafikę tła</b>, żeby zachować kolory okładki. Każdy dzień drukuje się na osobnej stronie — całość ma ${DAYS.length + 2} strony.</p>
${inner}
</body>
</html>`;
}

function lotyPage(){
  const seg = (t,items)=>`<div class="card" style="margin-bottom:14px"><h3 style="font-family:var(--serif);font-weight:500;font-size:19px;margin:0 0 10px">${t}</h3><ul class="tips">${items.map(i=>`<li>${i}</li>`).join('')}</ul></div>`;
  const last = k => {for(let i=CHECKS.length-1;i>=0;i--) if(CHECKS[i].p[k]!=null) return {v:CHECKS[i].p[k],d:CHECKS[i].date,i};return null;};
  const before = (k,idx) => {for(let i=idx-1;i>=0;i--) if(CHECKS[i].p[k]!=null) return CHECKS[i].p[k];return null;};

  let scored = Object.keys(AIRLINES).map(k=>({k,A:AIRLINES[k],L:last(k)})).filter(r=>r.L)
    .map(r=>({...r, h:hrsOf(r.A.dur), c:comfortOf(r.A)}));
  const rng = f => {const v=scored.map(f); return {min:Math.min(...v), max:Math.max(...v)};};
  const P=rng(r=>r.L.v), T=rng(r=>r.h), C=rng(r=>r.c);
  // wagi: rozpiętość każdego kryterium przeliczona na złotówki (kwoty tylko po to)
  const eqP = P.max-P.min, eqT = (T.max-T.min)*SCORE.plnPerHour,
        eqC = C.max===C.min ? 0 : (C.max-C.min)/100*SCORE.comfortPln;
  const eqS = eqP+eqT+eqC || 1;
  const W = {p:eqP/eqS, t:eqT/eqS, c:eqC/eqS};
  const pts = (v,r,inv) => r.max===r.min ? 100 : Math.round((inv ? (r.max-v)/(r.max-r.min) : (v-r.min)/(r.max-r.min))*100);
  scored = scored.map(r=>{
    const pp=pts(r.L.v,P,true), tp=pts(r.h,T,true), cp=pts(r.c,C,false);
    return {...r, pp, tp, cp, score:Math.round(W.p*pp + W.t*tp + W.c*cp)};
  });
  const cheapest = scored.slice().sort((a,b)=>a.L.v-b.L.v)[0];
  const fastest  = scored.slice().sort((a,b)=>a.h-b.h)[0];
  const rows = scored.sort((a,b)=>b.score-a.score).map((r,i)=>{
      const pv = before(r.k, r.L.i), d = pv==null?null:r.L.v-pv;
      const chg = d==null ? '<span style="color:var(--muted)">—</span>'
        : d===0 ? '<span style="color:var(--muted)">bez zmian</span>'
        : d<0 ? `<span style="color:var(--success)">▼ ${plz(Math.abs(d))}</span>`
              : `<span style="color:var(--shu)">▲ ${plz(d)}</span>`;
      const stale = r.L.d!==CHECKS[CHECKS.length-1].date ? ` <span class="note">(odczyt ${dpl(r.L.d).slice(0,5)})</span>` : '';
      const tags = (i===0?' <span class="rezerwuj">1. miejsce</span>':'')
        + (r.k===cheapest.k && i!==0 ? ' <span class="rezerwuj alt">najtańszy bilet</span>' : '')
        + (r.k===fastest.k && i!==0 ? ' <span class="rezerwuj alt">najkrótszy lot</span>' : '');
      const bar = (lab,val,v,col)=>`<div class="cr"><i>${lab}</i>
        <span class="crb"><b style="width:${val}%;background:${col}"></b></span>
        <u>${v}</u></div>`;
      return `<div class="arow${i===0?' top':''}">
        <div class="an"><i style="background:${r.A.col}"></i>${r.A.name}${r.A.star?' ★':''}${tags}</div>
        <div class="asc"><b>${r.score}</b><i>pkt / 100</i></div>
        <div class="crit">
          ${bar('Cena', r.pp, plz(r.L.v), 'var(--ai)')}
          ${bar('Czas', r.tp, r.A.dur, 'var(--kin)')}
          ${bar('Wygoda', r.cp, (r.A.stops? r.A.stops+' przesiadka':'bez przesiadek')+(r.A.hotel?' + nocleg gratis':''), 'var(--success)')}
        </div>
        <div class="am">${r.A.via==='bezpośredni'?'lot bezpośredni':'przez '+r.A.via} · ${r.A.note}${stale}</div>
        <div class="ad">${chg}</div>
      </div>`;}).join('');

  // dane dla kalkulatora wag (cena vs jakość) — czytane przez app.js
  const scoreData = Object.keys(AIRLINES).map(k=>{const L=last(k); return L?{k,name:AIRLINES[k].name,col:AIRLINES[k].col,
    star:!!AIRLINES[k].star,q:AIRLINES[k].q,qpos:AIRLINES[k].qpos,price:L.v,via:AIRLINES[k].via,dur:AIRLINES[k].dur}:null;}).filter(Boolean);

  const gmin = Math.min(...DATEGRID.days.map(d=>d[1])), gmax = Math.max(...DATEGRID.days.map(d=>d[1])), base = gmin-300;
  const bars = DATEGRID.days.map(([d,v])=>`<div class="${v===gmin?'lowest':(d===3?'plan':'')}" style="height:${Math.round((v-base)/(gmax-base)*100)}%" title="${d}.05 — ${plz(v)}"></div>`).join('');
  const labs = DATEGRID.days.map(([d])=>`<span>${d%2===1?d:''}</span>`).join('');

  const cards = PERIODS.map(P=>{
    const diff = P.price - PERIODS[0].price;
    return `<div class="pcard${P.best?' win':''}">${P.best?'<span class="badge">rekomendacja</span>':''}
      <div class="ph">${P.label}</div><div class="psub">${P.sub}</div>
      <div class="pp">${plz(P.price)}<span style="font-size:13px;font-weight:600;color:var(--muted)">/os.</span></div>
      <div class="pdiff" style="color:${diff===0?'var(--success)':'var(--shu)'}">${diff===0?'punkt odniesienia':'+ '+plz(diff)+'/os. (~'+plz(diff*3.8)+' rodzina)'}</div>
      <ul>${P.pros.map(t=>`<li class="yes">${t}</li>`).join('')}${P.cons.map(t=>`<li class="no">${t}</li>`).join('')}</ul>
    </div>`;}).join('');

  const inner = `
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(120deg,rgba(27,58,107,.58),rgba(200,64,44,.42)),url('${IMG.tokyostation}') center/cover"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Ceny · trendy · rekomendacje</p>
    <h1>Loty</h1>
    <p class="lead">Kluczowe linie na trasie WAW→Tokio, jak zmieniają się ich ceny i kiedy nacisnąć „kup". Dane sprawdzane automatycznie co tydzień.</p>
    </div>
  </header>

  <section>
    <h2 class="stitle">Ceny dziś — kluczowe linie</h2>
    <p class="lead-p">Za 1 dorosłego, w obie strony, wylot 3.05 / powrót 15.05.2027. Ostatnie sprawdzenie: <b>${dpl(FLIGHT.checked)}</b>.
    Ranking według <b>kosztu efektywnego</b> — czyli ceny biletu powiększonej o wartość czasu spędzonego w drodze.</p>
    <div class="alist">${rows}</div>
    <div class="card" style="margin-top:16px">
      <h3 style="font-family:var(--serif);font-weight:500;font-size:19px;margin:0 0 8px">Jak liczymy wynik</h3>
      <p style="margin:0 0 4px;font-size:14px">Każda linia dostaje <b>0–100 punktów w trzech kryteriach</b> (najlepsza w zestawieniu = 100, najsłabsza = 0), a wynik końcowy to ich <b>średnia ważona</b>. Do ceny biletu <b>nie doliczamy złotówek</b> — kwoty służą tylko do ustalenia, ile które kryterium waży:</p>
      <ul class="tips" style="margin-top:10px">
        <li><b>Cena</b> — cena biletu za dorosłego, w obie strony.</li>
        <li><b>Czas</b> — od wylotu do lądowania, razem z przesiadką. Waga z Twojej reguły: <b>8 h w drodze ≡ ${plz(8*SCORE.plnPerHour)} na bilecie</b>, czyli ${plz(SCORE.plnPerHour)} za godzinę.</li>
        <li><b>Wygoda</b> — liczona obiektywnie: 100 pkt bazowo, −30 za przesiadkę, +20 za darmowy nocleg w pakiecie. Pełna rozpiętość tego kryterium warta jest ${plz(SCORE.comfortPln)}.</li>
      </ul>
      <p style="margin:12px 0 0;font-size:14px">Wagi nie są ustawiane z ręki — wynikają z tego, jak <b>szeroko rozstrzelone</b> jest każde kryterium w dzisiejszym zestawieniu (rozpiętość przeliczona na złotówki). Dziś wychodzi:</p>
      <div class="wtab">
        <span><b>${Math.round(W.p*100)}%</b>Cena · rozpiętość ${plz(eqP)}</span>
        <span><b>${Math.round(W.t*100)}%</b>Czas · rozpiętość ${hm(T.max-T.min)} ≡ ${plz(eqT)}</span>
        <span><b>${Math.round(W.c*100)}%</b>Wygoda · rozpiętość ≡ ${plz(Math.round(eqC))}</span>
      </div>
      <p class="note" style="margin-top:10px">Gdy ceny się zbliżą do siebie, cena automatycznie straci na wadze, a czas i wygoda zyskają — i odwrotnie.</p>
    </div>
    <div class="dnote" style="margin-top:10px">★ Etihad to trasa z planu — jako jedyna daje <b>darmowy nocleg 4★ w Abu Zabi</b> (program stopover), co realnie warte jest ~600–900 zł. Przy porównywaniu cen doliczcie to na jego korzyść.</div>
  </section>

  <section>
    <h2 class="stitle">📈 Trend cen</h2>
    ${priceChart()}
    ${FLIGHT.history.length>1?`<div class="card" style="margin-top:16px"><h3 style="font-family:var(--serif);font-weight:500;font-size:19px;margin:0 0 10px">Historia odczytów — Etihad (trasa z planu)</h3><div class="wxwrap"><table><thead><tr><th>Data</th><th style="text-align:right">Cena / dorosły</th><th style="text-align:right">Zmiana</th><th style="text-align:right">Rodzina 2+2</th></tr></thead><tbody>${FLIGHT.history.slice().reverse().map((h,i,arr)=>{const p=arr[i+1];const d=p?h[1]-p[1]:null;const c=d==null?'—':(d===0?'→ 0':(d<0?`▼ ${plz(Math.abs(d))}`:`▲ ${plz(d)}`));const col=d==null||d===0?'var(--muted)':(d<0?'var(--success)':'var(--shu)');return `<tr><td>${dpl(h[0])}</td><td class="num">${plz(h[1])}</td><td class="num" style="color:${col};font-weight:700">${c}</td><td class="num" style="color:var(--muted)">${plz(Math.round(h[1]*3.8/100)*100)}</td></tr>`;}).join('')}</tbody></table></div></div>`:''}
  </section>

  <section>
    <h2 class="stitle">🎯 Kiedy kupić</h2>
    <p class="lead-p">Ceny na tej trasie falują o ±30% w skali tygodnia, więc moment zakupu jest wart więcej niż wybór linii. Oto plan.</p>
    ${seg('Progi decyzyjne (za 1 dorosłego)',['<b>≤ 3 500 zł/os.</b> (~13 300 zł rodzina) — OKAZJA, kupować natychmiast, nie czekać na „jeszcze lepszą"','<b>3 500–4 600 zł/os.</b> — cena typowa; można kupić dla pewności miejsc, ale bez presji',`<b>≥ 4 600 zł/os.</b> — górka, czekać na wyprzedaż`,`Teraz (${dpl(FLIGHT.checked)}): <b>${plz(FLIGHT.adult)}/os.</b> — próg <b>${FLIGHT.band}</b>`])}
    ${seg('Kalendarz — kiedy realnie polować',['<b>Lipiec–wrzesień 2026 (teraz):</b> nie kupować. Brak wyprzedaży, ceny typowe — tylko obserwować.','<b>Wrzesień–październik 2026:</b> czas na <a href="hotele.html">noclegi</a> (darmowe anulowanie), loty nadal obserwujemy.','<b>~20.11–2.12.2026 — Black Friday Etihad/Qatar:</b> pierwsze prawdziwe okno, historycznie do −35%. Tu celujemy w próg ≤3 500 zł/os.','<b>22.12.2026 – poł. stycznia 2027:</b> Qatar Travel Festival + Etihad January Sale — drugie okno.','<b>Koniec stycznia 2027 — TWARDY DEADLINE:</b> kupić nawet bez promocji. Cztery miejsca w jednej rezerwacji znikają szybko, a od lutego ceny rosną w stronę Golden Week.'])}
    ${seg('Zasady, które oszczędzają nerwy',['Kupujemy jako <b>Etihad ze stopoverem</b> — pakiet noclegowy rezerwuje się osobno na etihad.com zaraz po zakupie biletów (≥3 dni przed wylotem).','Przy zakupie potwierdzić, że promocja stopover obejmuje maj 2027 i że multi-city nie podnosi taryfy.','Cena na Google to taryfa bez bagażu rejestrowanego — doliczcie bagaż przy finalnym porównaniu.','Młodsze dziecko (&lt;11 lat) ma taryfę dziecięcą — rodzina to ok. <b>3,8 taryfy</b>, nie 4.','Nie polujcie na dołek w nieskończoność: różnica 200 zł/os. nie jest warta ryzyka braku 4 miejsc obok siebie.'])}
    ${seg('🔔 Co monitoruje się samo',['<b>Cotygodniowa kontrola cen</b> (poniedziałki) — aktualizuje tę stronę i wykres powyżej','Alerty w kluczowych momentach: 1.10, 20.11, 22.12.2026 oraz 12.01 i 25.01.2027','Google Flights — monitoring trasy 3→15.05 z powiadomieniem mailowym'])}
  </section>

  <section>
    <h2 class="stitle">⚖️ Ranking wg Twoich wag</h2>
    <p class="lead-p">Cena czy jakość? Przesuń suwak i zobacz, która linia wygrywa przy Twoich priorytetach. Ceny to ostatnie odczyty, jakość — pozycja w rankingu <i>AirlineRatings „World's Best Airlines 2026"</i>. Ranking przelicza się sam po każdym cotygodniowym sprawdzeniu cen.</p>
    <div class="card" style="margin-bottom:20px">
      <div class="wgrow">
        <label for="wprice">Waga ceny: <b id="wlab">90%</b> &nbsp;·&nbsp; jakość: <b id="wlab2">10%</b></label>
        <input type="range" id="wprice" min="0" max="100" step="5" value="90">
        <div class="wghint"><span>tylko jakość</span><span>tylko cena</span></div>
      </div>
      <div id="scorelist" class="scorelist"></div>
      <p class="note" style="margin-top:12px">Punkty ceny: najtańsza linia = 100, najdroższa = 0. Punkty jakości: pozycja w rankingu 2026. Kalkulacja nie obejmuje darmowego noclegu z pakietu stopover Etihad (wart ~600–900 zł) — przy zbliżonych wynikach to on przeważa szalę.</p>
    </div>
    <script id="scoredata" type="application/json">${JSON.stringify(scoreData)}</script>
  </section>

  <section>
    <h2 class="stitle">🗓️ Który termin pobytu</h2>
    <p class="lead-p">Trzy warianty sprawdzone na żywo w Google Flights. Ceny za dorosłego; „rodzina" liczona jako 3,8 taryfy (3 dorosłych + dziecko).</p>
    <div class="pcards">${cards}</div>
    <div class="card" style="margin-top:16px">
      <h3 style="font-family:var(--serif);font-weight:500;font-size:19px;margin:0 0 4px">Cena wg dnia wylotu</h3>
      <p class="note" style="margin:0 0 10px">12-dniowa podróż, za 1 dorosłego (odczyt ${dpl(DATEGRID.src)}). <span style="color:var(--success);font-weight:700">■</span> najtańszy dzień w całym oknie — i to właśnie 3 maja.</p>
      <div class="gridbars">${bars}</div>
      <div class="gridlabs">${labs}</div>
      <p class="note" style="margin-top:8px">Maj 2027 · najtaniej <b>${plz(gmin)}</b> (3.05), najdrożej <b>${plz(gmax)}</b> (2.05). Wyloty 1–2 maja są droższe przez ogon Golden Week.</p>
    </div>
    <div class="dnote" style="margin-top:14px">🏁 <b>Werdykt: zostajemy przy 3–15 maja.</b> To jednocześnie najniższy punkt cenowy w całym oknie, sobotni powrót (niedziela na reset przed szkołą) i start w majówkę, która oszczędza dni urlopu. Alternatywy kosztują 2 400–2 800 zł więcej i pogarszają dzień powrotu.</div>
  </section>

  <section>
    <h2 class="stitle">Dalej</h2>
    <div class="quick">
      <a class="qcard" href="koszty.html"><div class="qi">💴</div><div class="qh">Budżet całości</div><div class="qd">Kalkulator kosztów, transport w Japonii i widełki 40–60 tys.</div></a>
      <a class="qcard" href="hotele.html"><div class="qi">🏨</div><div class="qh">Noclegi</div><div class="qd">5 baz, w tym hotel stopover w Abu Zabi z pakietu Etihad.</div></a>
    </div>
  </section>
  ${footer('')}`;
  return shell({title:'Loty — ceny, trendy i kiedy kupić · Japonia 2027',desc:'Ceny lotów WAW→Tokio na maj 2027: porównanie linii, trendy cen i rekomendacja terminu zakupu.',prefix:'',active:'loty.html',inner,pillsIdx:null});
}

function pogodaPage(){
  const rows=[
    ['🏙️ Tokio','~23°C','~14°C','przyjemnie, słonecznie; sporadyczny przelotny deszcz'],
    ['♨️ Hakone (góry)','~19°C','~10°C','chłodniej i wilgotniej — weź ciepłą warstwę; Fudżi najlepiej widać rano'],
    ['⛩️ Kioto / Nara','~25°C','~14°C','cieplej niż w Tokio; w kotlinie w słońcu bywa parno'],
    ['🏯 Osaka','~25°C','~15°C','ciepło, miejsko; wieczory łagodne'],
    ['🕌 Abu Zabi (stopover)','35–40°C','~26°C','upał! zwiedzanie rano, w południe klimatyzacja (Luwr), dużo wody'],
  ].map(r=>`<tr><td class="cat">${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td>${r[3]}</td></tr>`).join('');
  const inner=`
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(120deg,rgba(31,94,90,.56),rgba(18,44,42,.42)),url('${IMG.fuji}') center/cover"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Klimat · praktyka · pakowanie</p>
    <h1>Pogoda w maju</h1>
    <p class="lead">Maj to jeden z najlepszych miesięcy na Japonię: ciepło, słonecznie i sucho — przed sezonem deszczowym, który na głównej wyspie zaczyna się dopiero w czerwcu.</p>
  </div>
  </header>
  <section>
    <h2 class="stitle">🌡️ Pogoda teraz — na żywo</h2>
    <p class="lead-p">Aktualne warunki i najbliższe dni we wszystkich bazach trasy plus Abu Zabi. Dane odświeżają się przy każdym otwarciu strony. Prognoza sięga ~16 dni, więc na maj 2027 zajrzyj tu bliżej wyjazdu — teraz służy głównie do porównania, jak bardzo góry (Hakone) potrafią być chłodniejsze od miast.</p>
    <div class="wxwrap" id="livewx"><p class="wxerr">Ładowanie pogody na żywo…</p></div>
  </section>
  <section>
    <h2 class="stitle">Typowe temperatury w maju</h2>
    <div class="wxwrap"><table>
      <thead><tr><th>Region</th><th style="text-align:right">Dzień</th><th style="text-align:right">Noc</th><th>Uwaga</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <p class="note" style="margin-top:10px">Wartości to średnie klimatyczne — dokładna prognoza na 2027 pojawi się bliżej wyjazdu.</p>
  </section>
  <section>
    <h2 class="stitle">🧭 Informacje praktyczne</h2>
    <p class="lead-p">Rzeczy, które warto ogarnąć jeszcze przed wylotem albo pierwszego dnia na lotnisku.</p>
    <div class="card"><ul class="tips">
      <li><b>💴 Pieniądze:</b> Japonia wciąż lubi gotówkę (małe knajpki, świątynie, targi). Wypłacajcie z bankomatów 7-Eleven i poczty (Japan Post) — przyjmują zagraniczne karty. Karta zbliżeniowa działa w sieciówkach i większych sklepach. Napiwków się nie daje.</li>
      <li><b>🚃 Transport lokalny — karty IC:</b> Suica/PASMO (Tokio) lub ICOCA (Kansai) działają w całym kraju — jeden dotyk w metrze, autobusach i sklepach. Dzieci mają wersje dziecięce (taniej, trzeba raz pokazać wiek na stacji). Na iPhonie: Suica w Apple Wallet, doładowanie kartą.</li>
      <li><b>🚄 Shinkansen i Hakone:</b> JR Pass przy tej trasie się <b>nie opłaca</b> (po podwyżce ~50 000 ¥/os.) — bierzcie bilety punktowe (Tokio↔Kioto, Osaka→Tokio) na miejscu lub w aplikacji. Do Hakone weźcie <b>Hakone Free Pass</b> (Odakyu) — obejmuje kolejkę linową, statek po jeziorze, autobusy i pociąg górski.</li>
      <li><b>📶 Internet:</b> Dla czterech osób najprościej jeden router <b>pocket WiFi</b> (odbiór na lotnisku lub kurierem do hotelu) — łączy wszystkie urządzenia. Alternatywa: eSIM (Airalo/Ubigi) wgrany na każdy telefon przed wylotem.</li>
      <li><b>🔌 Prąd:</b> 100 V, gniazdka typu A (dwa płaskie bolce) — polskie wtyczki nie pasują, weźcie adapter(y) typu A. Ładowarki 100–240 V działają bez przetwornicy.</li>
      <li><b>🩹 Zdrowie i bezpieczeństwo:</b> Woda z kranu jest zdatna do picia. Numery alarmowe: <b>110</b> policja, <b>119</b> pogotowie/straż. Weźcie własne leki (podstawy kupicie w drogeriach). Ubezpieczenie turystyczne z leczeniem i NNW — warto.</li>
      <li><b>🙇 Zwyczaje:</b> Buty zdejmujemy w ryokanie, świątyniach i części restauracji. W pociągach cisza, telefon na milczek. Koszy na śmieci prawie nie ma — noście torebkę na odpadki. Tatuaże bywają problemem w publicznych onsenach — prywatne rotenburo w ryokanie w Hakone to rozwiązuje.</li>
      <li><b>🛍️ Tax-free i apki:</b> W sklepach z oznaczeniem „Tax-Free" (od ~5000 ¥) zwrot podatku po okazaniu paszportu. Przydatne apki: Google Maps, Google Translate (tłumaczenie menu aparatem), Navitime / Japan Travel do połączeń kolejowych.</li>
    </ul></div>
  </section>
  <section>
    <h2 class="stitle">Co spakować</h2>
    <div class="card"><ul class="tips">
      <li>Ubrania na warstwy — rano i wieczorem chłodniej, zwłaszcza w Hakone.</li>
      <li>Lekka kurtka lub wiatrówka i składany parasol (~9 dni z deszczem w miesiącu, zwykle przelotnie).</li>
      <li>Wygodne buty łatwe do zdejmowania — świątynie, tatami i warsztaty tego wymagają.</li>
      <li>Krem z filtrem i nakrycia głowy — słońce w maju potrafi mocno operować.</li>
      <li>Coś cieplejszego na wieczór w ryokanie w Hakone; zmierzch ok. 18:30.</li>
    </ul></div>
  </section>
  <section>
    <h2 class="stitle">🎒 Bagaż — podręczny + plecak wystarczy</h2>
    <p class="lead-p">Przy pięciu zmianach bazy i jeździe pociągami lekki bagaż to nie oszczędność, tylko wygoda. Tania taryfa Etihad i tak jest bez bagażu rejestrowanego — z podręcznym nic nie dopłacacie.</p>
    <div class="card"><ul class="tips">
      <li><b>Pakujcie na ~5–6 dni, nie na 13.</b> Aparthotele MIMARU (Tokio, Kioto, Osaka) mają pralkę i suszarkę — pranie robicie w Kioto i komplet ubrań wraca do obiegu.</li>
      <li><b>Waga, nie objętość, jest limitem.</b> W klasie ekonomicznej Etihad to zwykle ~7 kg/os. (podręczny + mała sztuka osobista) — dokładny limit potwierdźcie przy zakupie biletu.</li>
      <li><b>Zakupy na powrót to jedyne ryzyko.</b> Pokémony, gachapony i Don Quijote potrafią spuchnąć bagaż — dokupcie jedną walizkę rejestrowaną tylko na lot powrotny (dopłata za odcinek) albo tanią składaną walizkę już w Japonii.</li>
      <li><b>Hakone bez targania:</b> to tylko 1 noc — główne bagaże wyślijcie kurierem <i>takkyubin</i> z hotelu w Tokio prosto do Kioto (~1500–2000 ¥/szt., doba), a w góry jedziecie z samymi plecakami.</li>
      <li>Kosmetyki zapewnia hotel, a czego zabraknie — dokupicie za grosze (Uniqlo, Don Quijote na każdym rogu). W kabinie pamiętajcie o limicie płynów 100 ml.</li>
    </ul></div>
  </section>
  <section>
    <h2 class="stitle">☔ Plan B na deszcz — miasto po mieście</h2>
    <div class="card"><ul class="tips">
      <li><b>Tokio:</b> Round1 (Ikebukuro), rodzinne karaoke (Big Echo / Karaoke Kan, przed 22:00), Pokémon Center — a Shibuya Sky przekładać: taras odkryty, w chmurach szkoda biletu.</li>
      <li><b>Hakone:</b> kolejka linowa staje przy wietrze (status: hakonenavi.jp) → Hakone Open-Air Museum (pawilon Picassa, rzeźby do wspinania) + rejs po Ashi, który pływa prawie zawsze.</li>
      <li><b>Kioto:</b> Kyoto Railway Museum (symulator shinkansena), teamLab Biovortex przy dworcu, kryte pasaże Nishiki/Teramachi, klasa ninja w muzeum.</li>
      <li><b>Osaka:</b> Kaiyukan (e-bilet z godziną, późne popołudnie), Round1 Sennichimae, kryty pasaż Shinsaibashi-suji, Dōtonbori pod markizami.</li>
    </ul></div>
  </section>
  ${footer('')}`;
  return shell({title:'Pogoda i pakowanie · Japonia 2027',desc:'Pogoda w maju w Japonii i lista rzeczy do spakowania.',prefix:'',active:'pogoda.html',inner,pillsIdx:null});
}

/* ---- atrakcje (reuse existing card content under new shell) ---- */
function atrakcjePage(){
  const old = fs.readFileSync(DIR + '/atrakcje.html','utf8');
  const s = old.indexOf('<h2 id="tokio"');
  const e = old.indexOf('<p class="note"');
  let body = old.slice(s, e);
  // map old classes to new ones
  body = body.split('class="grid"').join('class="agrid"');
  body = body.split('class="acard"').join('class="acard"'); // same
  // section headings -> stitle
  body = body.replace(/<h2 id="([^"]+)">([^<]+)<\/h2>/g,'<h2 id="$1" class="stitle" style="scroll-margin-top:80px">$2</h2>');
  const toc = `<nav class="toc" style="margin-bottom:18px">
    <a href="#tokio">🏙️ Tokio</a><a href="#hakone">♨️ Hakone</a><a href="#kioto">⛩️ Kioto</a>
    <a href="#nara">🦌 Nara</a><a href="#osaka">🏯 Osaka</a><a href="#abuzabi">🕌 Abu Zabi</a><a href="#sumo-s">🥋 Sumo</a><a href="#praktyczne">🧳 Praktyczne</a></nav>`;
  const inner=`
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(120deg,rgba(138,43,35,.56),rgba(70,32,20,.42)),url('${IMG.sensoji}') center/cover"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Godziny · ceny · rezerwacje</p>
    <h1>Atrakcje</h1>
    <p class="lead">Wszystkie miejsca z planu w jednym katalogu — z godzinami, orientacyjnymi cenami (¥100 ≈ 2,6 zł) i linkami do oficjalnych rezerwacji.</p>
  </div>
  </header>
  ${toc}
  ${body}
  <p class="note" style="margin-top:16px">Ceny i godziny — stan na lipiec 2026, orientacyjne; przed rezerwacją sprawdźcie na stronach oficjalnych.</p>
  ${footer('')}`;
  return shell({title:'Atrakcje: godziny, ceny, rezerwacje · Japonia 2027',desc:'Katalog atrakcji wyjazdu do Japonii z godzinami, cenami i linkami do rezerwacji.',prefix:'',active:'atrakcje.html',inner,pillsIdx:null});
}

/* ============================ WRITE ============================ */
DAYS.forEach((d,i)=>fs.writeFileSync(`${DIR}/days/${d.date}.html`, dayPage(d,i)));
const ATR = atrakcjePage(); // read old before overwriting index (index doesn't touch atrakcje)
fs.writeFileSync(DIR + '/index.html', indexPage());
fs.writeFileSync(DIR + '/hotele.html', hotelePage());
fs.writeFileSync(DIR + '/decyzje.html', decyzjePage());
fs.writeFileSync(DIR + '/druk.html', drukPage());
fs.writeFileSync(DIR + '/loty.html', lotyPage());
fs.writeFileSync(DIR + '/koszty.html', kosztyPage());
fs.writeFileSync(DIR + '/pogoda.html', pogodaPage());
fs.writeFileSync(DIR + '/atrakcje.html', ATR);

console.log('OK · day pages:', DAYS.length, '· timeline items:', DAYS.reduce((a,d)=>a+d.tl.length,0),
  '· pc:', DAYS.filter(d=>d.pc).length);
