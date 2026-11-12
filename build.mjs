import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DAYS, GEO, DAYRAIN, DAYCROWD, BOOKINGS, DEADLINES, HOTELS, fill} from './data/index.mjs';
/* Każda strona HTML przechodzi przez fill(): tokeny {{klucz}} z szablonów zamieniają się na fakty z data/fakty.mjs. */
const page = (file, html) => fs.writeFileSync(DIR + '/' + file, fill(html));
const DIR = path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(DIR + '/days', { recursive: true });
fs.mkdirSync(DIR + '/assets', { recursive: true });

/* Dni zamknięcia atrakcji (0=nd … 6=sb). Sprawdzane przy budowie względem dnia tygodnia każdego dnia planu. */
const CLOSED = {
  ota:{days:[1],note:'poniedziałki + kilka dni na przełomie miesiąca (zmiana wystawy)'},
  louvread:{days:[1],note:'poniedziałki'},
  railway:{days:[3],note:'środy'},
  tsukiji:{days:[0],note:'niedziele i część śród (wg kalendarza Toyosu)'},
  nishiki:{days:[],note:'część stoisk zamknięta w środy i niedziele'},
};

/* Koszty: jedno źródło wartości kalkulatora (CALC) i kupionego biletu (TICKET). */
const CALC = {nights:8, nightRate:1504, transport:5000, days:11, foodRate:500, attractions:3300, extras:3000};
/* Numer wydania = skrót treści źródeł. Te same źródła dają identyczny build, więc w repo zmieniają się tylko strony, których treść się zmieniła. */
const SOURCES = ['build.mjs', ...['data','src'].flatMap(d => fs.existsSync(DIR+'/'+d) ? fs.readdirSync(DIR+'/'+d).sort().map(f => d+'/'+f) : [])];
const BUILD_ID = SOURCES.reduce((h,f) => h.update(fs.readFileSync(DIR+'/'+f)), crypto.createHash('sha1')).digest('hex').slice(0,7);
const TICKET = {family:14400, bag:0, total:14400, label:'27.04-7.05 ze stopoverem tam; powrót do WAW 8.05 - kupione 8.09.2026'};
// własny formatter — Node w tym środowisku ma okrojone ICU i ignoruje locale pl-PL
const plz  = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' zł';
/* Style i skrypty są zwykłymi plikami w src/ (bez szablonów, więc bez podwajania ukośników). */
fs.copyFileSync(DIR + '/src/style.css', DIR + '/assets/style.css');

/* ============================ APP JS ============================ */
fs.copyFileSync(DIR + '/src/app.js', DIR + '/assets/app.js');

/* ============================ DATA ============================ */
const IMG = {
  sensoji:'/assets/img/sensoji.webp', shibuya:'/assets/img/shibuya.webp', akihabara:'/assets/img/akihabara.webp',
  fuji:'/assets/img/fuji.webp', yasaka:'/assets/img/yasaka.webp', fushimi:'/assets/img/fushimi.webp',
  kinkakuji:'/assets/img/kinkakuji.webp', todaiji:'/assets/img/todaiji.webp', bamboo:'/assets/img/bamboo.webp',
  dotonbori:'/assets/img/dotonbori.webp', sumo:'/assets/img/sumo.webp', tokyostation:'/assets/img/tokyostation.webp',
  abudhabi:'/assets/img/abudhabi.webp', mosque:'/assets/img/mosque.webp',
};
// one distinct photo per day
const DAYIMG = {
  '2027-04-30':IMG.fushimi, '2027-05-01':IMG.dotonbori,
  '2027-04-27':IMG.abudhabi, '2027-04-28':IMG.mosque, '2027-04-29':'/assets/img/hotels/kioto.webp', '2027-05-05':IMG.akihabara,
  '2027-05-04':IMG.shibuya, '2027-05-06':IMG.fuji, '2027-05-03':IMG.sensoji,
  '2027-05-02':IMG.yasaka, '2027-05-07':IMG.tokyostation,
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
/* kafelek dnia: zdjęcie jako <img loading="lazy"> pod gradientem — natywne leniwe ładowanie
   i jawne wymiary (bez przeskoku układu). Gradient zostaje w tle elementu. */
const cardImg = (c,ph,alt,eager) => `<img class="dcimg" src="${ph}" alt="" width="1000" height="700" `
  + `loading="${eager?'eager':'lazy'}" decoding="async">`
  + `<span class="dcgrad" style="background:linear-gradient(to top,rgba(${CITY[c].c1},.92),rgba(${CITY[c].c1},.10))"></span>`;
const JPSTOPS = [
  [35.772,140.393,'Narita - przylot 29.04 i odlot 7.05'],
  [34.9858,135.7588,'Kioto - 4 noce, 29.04-3.05'],
  [34.6937,135.5023,'Osaka - wycieczka z Kioto 1.05, bez zmiany hotelu'],
  [35.681,139.767,'Tokio - 3 noce, 3-6.05; przejazd przez dworzec także 29.04 i 7.05'],
  [35.2337,139.0155,'Hakone - 1 noc, 6-7.05; potem przez Odawarę i Tokio na Naritę'],
];
const JPROUTE = [0,3,1,2,1,3,4,3,0].map(i=>JPSTOPS[i].slice(0,2));

/* ============================ HOTELS ============================ */

const gmapsQ = name => 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name);
// day date -> hotel id (check-in days)
const DAYHOTEL = Object.fromEntries(DAYS.filter(d=>d.stay).map(d=>[d.date,d.stay]));
const WXGEO = {'2027-04-29':[34.9858,135.7588],'2027-05-01':[34.6937,135.5023],'2027-05-03':[35.7148,139.7967],'2027-05-06':[35.2455,139.0195]}; // prognoza tam, gdzie spędzamy dzień/noc
const DAYINT = Object.fromEntries(DAYS.map(d=>[d.date,[d.level,d.brief.focus]]));
const DAYFLEX = Object.fromEntries(DAYS.map(d=>[d.date,[d.brief.must,d.brief.cut]]));
const LEVEL_LABEL = {g:'Lekki', y:'Średni', r:'Intensywny - podróż'};
const ITEM_LABEL = {lot:'Lot z biletu',zarezerwowane:'Zarezerwowane',rezerwacja:'Do potwierdzenia',opcja:'Opcja',bufor:'Zapas / odpoczynek'};
const TIMING_NOTE = 'Wszystkie godziny są miejscowe. Loty według e-biletów; pozostałe godziny to plan do dopasowania do rozkładów i rezerwacji. „Do potwierdzenia” nie oznacza kupionego biletu. „Zarezerwowane” oznacza przyjętą rezerwację; numer pociągu i miejsca mogą być jeszcze wstępne.';

/* ============================ TEMPLATES ============================ */
const TABS = [['index.html','Agenda'],['atrakcje.html','Atrakcje'],['hotele.html','Hotele'],['niezbednik.html','Niezbędnik'],['pogoda.html','Przed wyjazdem'],['koszty.html','Koszty'],['decyzje.html','Kulisy']];
function nav(active,prefix){
  const t = TABS.map(([h,l])=>`<a href="${prefix}${h}"${(h===active?' class="on" aria-current="page"':'')}>${l}</a>`).join('');
  return `<div class="topbar"><div class="navrow"><a class="brand" href="${prefix}index.html"><span class="bj" aria-hidden="true">日本</span>Japonia 2027<span class="bcode">27.04–08.05</span></a><nav class="tabs">${t}</nav></div></div>`;
}
function pills(curIdx){
  const items = DAYS.map((d,i)=>{
    const [dd] = d.dd.split(' ');
    return `<a href="${d.date}.html"${(i===curIdx?' class="on" aria-current="date"':'')}><b>${i+1}</b><span>${d.date.slice(8,10)}.${d.date.slice(5,7)}</span></a>`;
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap">
<link rel="stylesheet" href="${prefix}assets/style.css">
<link rel="manifest" href="${prefix}manifest.webmanifest">
<meta name="theme-color" content="#0f224d">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Japonia 2027">
<link rel="icon" href="${prefix}assets/icon.svg" type="image/svg+xml">
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<div class="progress" id="progress"></div>
${nav(active,prefix)}
${pillsIdx!=null?pills(pillsIdx):''}
<a class="skip-link" href="#tresc">Przejdź do treści</a>
<main class="wrap" id="tresc">
${inner}
</main>
<button class="totop" id="totop" aria-label="Do góry">↑</button>
<script src="${prefix}assets/app.js"></script>
<script>if('serviceWorker' in navigator)addEventListener('load',function(){navigator.serviceWorker.register('${prefix}sw.js').then(function(r){function show(){if(document.getElementById('swtoast'))return;var t=document.createElement('div');t.id='swtoast';t.setAttribute('role','status');t.style.cssText='position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;background:#0f224d;color:#fff;padding:12px 16px;border-radius:8px;box-shadow:0 8px 22px rgba(0,0,0,.35);font:14px/1.4 system-ui,sans-serif;display:flex;gap:12px;align-items:center;max-width:92vw';t.innerHTML='Dostępna nowa wersja przewodnika. <button type="button" style="background:#c8102e;color:#fff;border:0;border-radius:6px;padding:7px 12px;font:inherit;cursor:pointer">Odśwież</button>';t.querySelector('button').onclick=function(){location.reload();};document.body.appendChild(t);}if(r.waiting&&navigator.serviceWorker.controller)show();r.addEventListener('updatefound',function(){var w=r.installing;if(!w)return;w.addEventListener('statechange',function(){if(w.state==='installed'&&navigator.serviceWorker.controller)show();});});}).catch(function(){});});</script>
</body>
</html>`;
}
function footer(prefix){
  return `<footer>Przewodnik rodzinny · Japonia 27 kwietnia – 8 maja 2027 · strona nieindeksowana · wydanie ${BUILD_ID}<br>
  Godziny pociągów, ceny biletów, warunki pogodowe i dostępność atrakcji potwierdźcie przed wyjazdem.<br>
  Zdjęcia: Wikimedia Commons (licencje CC) · mapy: © OpenStreetMap · <a href="${prefix}index.html">Strona główna</a> · <a href="${prefix}druk.html">Drukuj / zapisz jako PDF</a></footer>`;
}

/* Wyciąga z karty katalogu godziny/ceny/uwagi — żeby strona dnia miała je NA MIEJSCU. */
const atrMeta = (() => {
  const cache = {};
  return id => {
    if (cache[id] !== undefined) return cache[id];
    const m = ATR_BODY.match(new RegExp('<div class="acard" id="'+id+'">([\\s\\S]*?)</div>\\s*</div>'));
    if (!m) return (cache[id] = null);
    const spans = [...m[1].matchAll(/<span>([^<]*)<\/span>/g)].map(x=>x[1]);
    const pick = e => (spans.find(x=>x.startsWith(e))||'').replace(e,'').trim();
    return (cache[id] = {hours:pick('🕒'), price:pick('💴'), closed:pick('📅'), book:/rezerwac|e-bilet|online/i.test(m[1])});
  };
})();
const DOW = ['nd','pn','wt','śr','czw','pt','sb'];
function dayMeta(d){
  const wd = new Date(d.date+'T12:00:00').getDay();
  const rows = d.links.map(l => {
    const m = atrMeta(l.id); if (!m) return '';
    const c = CLOSED[l.id]; const conflict = c && c.days.includes(wd);
    if (conflict) console.warn('⚠ ZAMKNIĘTE', d.date, l.id, c.note);
    const closed = conflict ? `<b style="color:var(--shu)">⚠ zamknięte w ${DOW[wd]} - ${c.note}</b>` : (m.closed || (c ? c.note : '')) ;
    return `<tr><td class="dcol">${l.label}</td><td>${m.hours||'—'}</td><td>${m.price||'—'}</td><td>${m.book?'<b>tak</b>':'nie'}${closed?'<br><small>📅 '+closed+'</small>':''}</td></tr>`;
  }).join('');
  return rows ? `
  <section>
    <h2 class="stitle">Orientacyjne godziny i ceny</h2>
    <div class="card" style="padding:0;overflow:hidden"><div style="overflow-x:auto"><table class="rhythm"><thead><tr><th>Miejsce</th><th>Godziny</th><th>Cena</th><th>Rezerwacja</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <p class="note" style="margin-top:6px">Katalog orientacyjny. Przed zakupem sprawdźcie cenę według wieku dzieci w dniu wizyty, godziny oraz warunki u operatora. Marcel kończy 13 lat 5 maja.</p>
  </section>` : '';
}
function dayPage(d,i){
  const prefix='../', prev=DAYS[i-1], next=DAYS[i+1], H=HOTELS.find(h=>h.id===d.stay);
  const metadata=dayMeta(d);
  const tl=d.tl.map(([time,title,desc,kind])=>'<li class="'+(kind||'plan')+'"><div class="tm">'+time.replace('8.05 ','8.05<br>')+'</div><div class="bd">'+
    (desc?'<details class="event"><summary><span class="h">'+title+'</span>'+(kind?'<span class="event-tag '+kind+'">'+ITEM_LABEL[kind]+'</span>':'')+'</summary><p class="d">'+desc+'</p></details>':'<p class="h">'+title+'</p>')+'</div></li>').join('');
  const geo=GEO[d.date]||[];
  const gdir=geo.length?'https://www.google.com/maps/dir/'+geo.map(g=>g[0]+','+g[1]).join('/'):'#';
  const brief=d.brief;
  const mapSec=geo.length?'<section id="mapa"><h2 class="stitle">Mapa dnia</h2><div class="card"><div class="maphold"><button class="mapbtn" id="mapActivate">Aktywuj mapę</button><div id="map" class="map"></div></div><ol class="maplegend">'+geo.map((g,i)=>'<li><span class="mn">'+(i+1)+'</span> '+g[2]+'</li>').join('')+'</ol><a class="gmap" href="'+gdir+'" target="_blank" rel="noopener">Otwórz punkty w Google Maps ↗</a><p class="note">Linia łączy punkty orientacyjnie. Google Maps może domyślnie wybrać samochód; ustawcie właściwy środek transportu i datę.</p><script type="application/json" id="geo">'+JSON.stringify(geo)+'</script></div></section>':'';
  const weather=WXGEO[d.date]||geo[0];
  const inner = '<header class="hero kb day-hero"><div class="hbg"><div class="hbg-img" style="background:'+heroBg(d.city,DAYIMG[d.date])+'"></div></div><div class="hero-inner">'+
    '<p class="eyebrow">Dzień '+(i+1)+' z '+DAYS.length+' · '+d.dow+' · '+d.dd+'</p><h1>'+d.title+'</h1><p class="lead">'+d.lead+'</p></div></header>'+
    '<nav class="section-nav" aria-label="Skróty tego dnia"><a href="#skrot">W minutę</a><a href="#plan">Godziny</a><a href="#mapa">Mapa</a><a href="#warunki">Plan B</a><a href="#nocleg">Nocleg</a></nav>'+
    '<section id="skrot" class="day-brief"><h2 class="stitle">Ten dzień w minutę</h2><div class="brief-stats"><div><span>Start</span><b>'+brief.start+'</b></div><div><span>Koniec</span><b>'+brief.end+'</b></div><div><span>Tempo podstawowe</span><b class="pace '+d.level+'">'+LEVEL_LABEL[d.level]+'</b></div></div>'+
    '<p class="brief-focus">'+brief.focus+'</p><dl class="brief-rules"><div><dt>Chronimy</dt><dd>'+brief.must+'</dd></div><div><dt>Można odpuścić</dt><dd>'+brief.cut+'</dd></div><div class="guard"><dt>Sprawdź</dt><dd>'+brief.check+'</dd></div></dl></section>'+
    '<section id="plan"><div class="section-heading"><h2 class="stitle">Godzina po godzinie</h2><button class="reset" type="button" id="timelineToggle" aria-expanded="false">Rozwiń szczegóły</button></div><p class="note timing-note">'+TIMING_NOTE+'</p><div class="card"><ul class="tline" data-date="'+d.date+'">'+tl+'</ul></div></section>'+
    '<section id="warunki"><h2 class="stitle">Gdy warunki się zmienią</h2><div class="dayflag rain"><b>Plan B:</b> '+(DAYRAIN[d.date]||brief.cut)+'</div>'+
    (DAYCROWD[d.date]?'<div class="dayflag"><b>Tłum i tempo:</b> '+DAYCROWD[d.date]+'</div>':'')+
    (weather?'<div class="dayflag wxday" data-date="'+d.date+'" data-la="'+weather[0]+'" data-lo="'+weather[1]+'" style="display:none"></div>':'')+
    (d.pc?'<details class="card option-detail"><summary>'+d.pc.q+'</summary>'+d.pc.opts.map(o=>'<p><b>'+o[0]+'</b><br>Za: '+o[1]+'.<br>Przeciw: '+o[2]+'.</p>').join('')+'</details>':'')+'</section>'+
    mapSec+
    '<section id="nocleg"><h2 class="stitle">Gdzie śpimy</h2>'+
    (H?'<div class="card"><b>'+H.name+'</b><p>'+H.stay+'</p><p class="note">'+H.cancel+'</p><div class="linklist"><a href="../hotele.html#'+H.id+'">Pokój i rezerwacja</a><a href="'+gmapsQ(H.mapsq||H.name)+'" target="_blank" rel="noopener">Dojazd w Google Maps ↗</a></div></div>':'<div class="card">'+(d.date==='2027-04-28'?'Noc w samolocie do Japonii.':'Noc w podróży powrotnej; lądowanie WAW 8 maja o {{lot.waw.przylot}}.')+'</div>')+'</section>'+
    '<section><h2 class="stitle">Przydatne na miejscu</h2><div class="card"><ul class="tips">'+d.tips.map(t=>'<li>'+t+'</li>').join('')+'</ul><div class="linklist" style="margin-top:16px">'+d.links.map(l=>'<a href="../atrakcje.html#'+l.id+'">'+l.label+'</a>').join('')+'</div></div></section>'+
    (metadata?'<details class="more detail-catalog"><summary>Godziny i ceny miejsc z katalogu</summary>'+metadata+'</details>':'')+
    '<nav class="daynav" aria-label="Sąsiednie dni"><a id="navPrev" href="'+(prev?prev.date+'.html':'../index.html#dni')+'"><div class="dir">← Poprzedni</div><div class="ttl">'+(prev?prev.dd:'Agenda')+'</div></a><a class="home" href="../index.html#dni" aria-label="Wszystkie dni">☰</a><a class="nx" id="navNext" href="'+(next?next.date+'.html':'../index.html#powrot')+'"><div class="dir">'+(next?'Następny →':'Powrót →')+'</div><div class="ttl">'+(next?next.dd:'8 maja')+'</div></a></nav>'+footer(prefix);
  return shell({title:'Dzień '+(i+1)+': '+d.title+' · Japonia 2027',desc:d.lead,prefix,active:'index.html',inner,pillsIdx:i});
}

function deadlineList(prefix=''){
  return '<ol class="deadlines">'+DEADLINES.map(d=>'<li><time datetime="'+d.date+'">'+d.label+'</time><div><a href="'+prefix+d.href+'"><b>'+d.title+'</b></a><p>'+d.text+'</p></div></li>').join('')+'</ol>';
}
function readiness(){
  return '<div class="readiness"><b>Loty i cztery pobyty hotelowe potwierdzone</b><p>Do domknięcia: miejsca w pociągach, bilety na atrakcje i dojazd z Hakone. Potwierdzenia hoteli z 8.09 wskazują płatność na później.</p><a href="decyzje.html#do-zalatwienia">Sprawdź listę do załatwienia →</a> · <a href="#terminy">Terminy i pogoda</a></div>';
}
/* ---- index ---- */
function indexPage(){
  const intLbl={g:'Lekki',y:'Średni',r:'Intensywny'};
  const CITYNAME={tokio:'Tokio',hakone:'Hakone',kioto:'Kioto',nara:'Nara',osaka:'Osaka',abudhabi:'Abu Zabi'};
  const DOW3={'poniedziałek':'pon','wtorek':'wt','środa':'śr','czwartek':'czw','piątek':'pt','sobota':'sob','niedziela':'nd'};
  const cards = DAYS.map((d,i)=>{const it=DAYINT[d.date]; const [dnum,mon]=d.dd.split(' '); const mm=mon.startsWith('kw')?'04':'05';
    return `<li><a href="days/${d.date}.html">
    <span class="tt-n">${String(i+1).padStart(2,'0')}</span>
    <span class="tt-date"><b>${dnum}.${mm}</b><i>${DOW3[d.dow]||d.dow}</i></span>
    <span class="tt-city" style="--c:rgb(${CITY[d.city].c1})">${CITYNAME[d.city]||d.city}</span>
    <span class="tt-title">${d.title}<small>${d.brief.start} · ${intLbl[it[0]]}${d.level==='r'?' (podróż)':''}</small></span>
    ${it?`<span class="tt-int ${it[0]}" title="${intLbl[it[0]]} dzień" aria-label="${intLbl[it[0]]} dzień"></span>`:'<span></span>'}
    <img class="tt-img" src="${DAYIMG[d.date]}" alt="" width="88" height="56" loading="${i<3?'eager':'lazy'}" decoding="async">
  </a></li>`;}).join('');
  const quick = `<div class="lines">
    <a class="line" href="atrakcje.html"><b>Atrakcje</b><span>Miejsca z planu i propozycje rezerwowe, z linkami do operatorów.</span></a>
      <a class="line" href="hotele.html"><b>Hotele</b><span>Pokoje, posiłki i terminy odwołania. Hanaori Deluxe z prywatną kąpielą.</span></a>
      <a class="line" href="niezbednik.html"><b>Niezbędnik</b><span>Przejazdy, pieniądze, internet, zwyczaje, numery alarmowe.</span></a>
      <a class="line" href="pogoda.html"><b>Przed wyjazdem</b><span>Klimat na przełomie kwietnia i maja, plan pakowania na 7 kg, plany B na deszcz.</span></a>
      <a class="line" href="druk.html"><b>Przewodnik do druku</b><span>Cały plan na kartkach — do wydruku albo offline na telefon.</span></a>
      <a class="line" href="koszty.html"><b>Budżet</b><span>Kalkulator kosztów i zweryfikowane taryfy kolejowe — ~43 tys. zł.</span></a>
      <a class="line" href="decyzje.html"><b>Kulisy planu</b><span>Co jeszcze załatwić, dlaczego taka trasa i jak zmienić dzień bez pośpiechu.</span></a>
  </div>`;
  const inner = `
  <section id="dzis" class="today" hidden aria-live="polite"></section>
  <header class="hero home">
    <div class="hbg"><div class="hbg-img" style="background-image:url('${IMG.fuji}')"></div></div>
    <div class="hgrad"></div>
    <div class="hero-inner">
      <p class="eyebrow">Przewodnik rodzinny · 2+2 · 11 dni programu + powrót · Narita → Kioto → Tokio → Hakone</p>
      <h1>Japonia 2027</h1>
      <p class="lead">27 kwietnia - 8 maja 2027. Noc w Abu Zabi, cztery noce w Kioto z dniem w Osace, trzy w Tokio i prywatna kąpiel w Hakone. KOTO, sklep Kinugasa, Pokémony i czas na odpoczynek. Powrót do Warszawy 8 maja o {{lot.waw.przylot}}.</p>
      <div class="chips"><span class="chip hanko">Bilety kupione</span><span class="chip">noc w Abu Zabi gratis</span><span class="chip">8 nocy w Japonii</span><span class="chip">Dzień Dziecka w Tokio</span><span class="chip">ryokan nad jeziorem</span></div>
    </div>
    <div class="scrollcue" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></div>
  </header>
  <script type="application/json" id="agenda">${JSON.stringify(DAYS.map(d=>({d:d.date,t:d.title,dd:d.dow+' '+d.dd,s:d.tl.map(([time,title])=>[time,title])}))).replace(/</g,'\\u003c')}</script>

  <section class="statband" aria-label="Podróż w liczbach">
    <div class="stt hl"><b id="cd">—</b><span>dni do wylotu</span></div>
    <div class="stt"><b>11</b><span>dni programu</span></div>
    <div class="stt"><b>3</b><span>bazy w Japonii</span></div>
    <div class="stt"><b>8</b><span>nocy w Japonii</span></div>
    <div class="stt"><b>~43<small>tys zł</small></b><span>budżet 2+2</span></div>
  </section>

  ${readiness()}
  <nav class="section-nav" aria-label="Skróty agendy"><a href="#dni">Dni</a><a href="#trasa">Mapa Japonii</a><a href="#terminy">Terminy</a><a href="druk.html">Druk / PDF</a></nav>
  <section id="dni">
    <h2 class="stitle">Dzień po dniu</h2>
    <p class="lead-p">Każdy dzień zaczyna się krótkim podsumowaniem: po co jedziemy, co chronimy i co można odpuścić. Dalej są godziny, mapa, nocleg i plan B. W Golden Week rezerwacje wymagają wyprzedzenia; oba duże przejazdy kolejowe wypadają w tym okresie.</p>
    <ol class="tt">${cards}</ol><div class="return-note" id="powrot"><b>8 maja · sobota · {{lot.waw.przylot}}</b><span>Lądowanie w Warszawie. Spokojny powrót do domu i weekend na odpoczynek.</span></div>
    <p class="note" style="margin-top:12px">Znacznik przy wierszu to obciążenie dnia: <b style="color:var(--success)">●</b> lekki · <b style="color:var(--warn)">●</b> średni · <b style="color:var(--hanko)">●</b> intensywny. Zaplecze planu: <a href="decyzje.html">Kulisy</a>.</p>
  </section>

  <section id="trasa">
    <h2 class="stitle">Nasza trasa po Japonii</h2>
    <p class="lead-p">Cała podróż na jednej mapie: z Narity shinkansenem do Kioto (cztery noce), 1.05 wycieczka do Osaki i powrót do tej samej bazy, potem Tokio (trzy noce), Hakone i lotnisko. 2.05 w Kioto: KOTO oraz sklep Kinugasa. Nara i Arashiyama pozostają alternatywami, nie dodatkowymi dniami. Abu Zabi jest poza tą mapą.</p>
    <div class="card">
      <div class="maphold"><button class="mapbtn" id="mapActivate">🗺️ Aktywuj mapę</button><div id="map" class="map"></div></div>
      <ol class="maplegend">${JPSTOPS.map(s=>`<li>${s[2]}</li>`).join('')}</ol>
      <a class="gmap" href="https://www.google.com/maps/dir/Narita+Airport/Kyoto,+Japan/Tokyo,+Japan/Hakone,+Kanagawa/Narita+Airport" target="_blank" rel="noopener">📍 Otwórz trasę w Google Maps ↗</a>
      <p class="note" style="margin-top:6px">Linia jest schematem, nie przebiegiem torów. Osaka to wypad z Kioto bez zmiany hotelu; po Hakone wracacie przez Odawarę i Tokio na Naritę. Dokładne wejścia do hoteli otwierajcie z ich kart.</p>
      <script type="application/json" id="geo">${JSON.stringify(JPSTOPS)}</script><script type="application/json" id="geo-route">${JSON.stringify(JPROUTE)}</script>
    </div>
  </section>

  <section id="terminy"><h2 class="stitle">Najważniejsze terminy</h2><p class="lead-p">Terminy hoteli z potwierdzeń Booking sprawdzonych 9.09.2026. Po zmianie rezerwacji sprawdźcie je ponownie. Daty poniżej nie uruchamiają automatycznych powiadomień.</p>${deadlineList()}</section>
  <section>
    <h2 class="stitle">Przewodnik</h2>
    ${quick}
  </section>
  ${footer('')}`;
  return shell({title:'Japonia 2027 — rodzinny plan wyjazdu',desc:'Plan rodzinnego wyjazdu do Japonii 27 kwietnia – 8 maja 2027: agenda dzień po dniu, atrakcje, koszty i pogoda.',prefix:'',active:'index.html',inner,pillsIdx:null});
}

/* ---- koszty (strategy + calculator) ---- */
function kosztyPage(){
  const seg = (t,items)=>`<div class="card" style="margin-bottom:14px"><h3 style="font-family:var(--serif);font-weight:500;font-size:20px;margin:0 0 10px">${t}</h3><ul class="tips">${items.map(i=>`<li>${i}</li>`).join('')}</ul></div>`;
  const inner = `
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(135deg,#122740,#2f6d4f)"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Bilety lotnicze i budżet</p>
    <h1>Bilety i koszty</h1>
    <p class="lead">Loty i hotele są zarezerwowane. Poniżej oddzielamy kwoty z dokumentów od szacunków: e-bilety {{bilety.suma}}, hotele w Japonii 500 443 JPY przed dodatkowymi podatkami. Budżet w złotych pozostaje orientacyjny.</p>
  </div>
  </header>

  <section>
    <h2 class="stitle">Bilety lotnicze</h2>
    <div class="pflag">✈️ <span><b>Etihad ${TICKET.label}</b>. Rezerwa w kalkulatorze: ${plz(TICKET.family)} za rodzinę do uzgodnienia z kartą (z hotelem 4★ w Abu Zabi w pakiecie), bez bagażu rejestrowanego. Szczegóły i tło rynkowe na zakładce <a href="loty.html">Loty</a>.</span></div>
    <div class="card"><ul class="tips">
      <li>E-bilety sumują się do {{bilety.suma}}. Kalkulator ostrożnie przyjmuje {{bilety.budzet}}; różnica 756,64 zł wymaga uzgodnienia z obciążeniem karty. Pole jest edytowalne.</li>
      <li>Historia cen, porównanie linii i wybór terminu zostały na zakładce Loty jako archiwum — pokazują, dlaczego wybór padł na Etihad ze stopoverem.</li>
    </ul>
    <a class="gmap" href="loty.html">✈️ Zobacz ceny, trendy i strategię zakupu → </a></div>
  </section>

  <section>
    <h2 class="stitle">Transport w Japonii - podstawa budżetu</h2>
    <p class="lead-p">Kontrola 9.09.2026. Przeliczenie planistyczne: 100 JPY = 2,40 zł. Taryfy na konkretny pociąg i dzień w 2027 trzeba potwierdzić; Golden Week może oznaczać dopłatę sezonową. Liczymy trzy bilety dorosłe i jeden dziecięcy.</p>
    ${seg('Przejazdy między miastami',[
      '<b>Narita → Tokio → Kioto</b> (29.04): NEX obecnie 3 140 JPY/dorosły w jedną stronę; shinkansen zarezerwowany w SmartEX: {{sk.cena}} za rodzinę ({{sk.dorosly}} dorosły, {{sk.dziecko}} dziecko). NEX kupuje się osobno w JR East.',
      
      
      '<b>Kioto → Tokio</b> (3.05): shinkansen zarezerwowany w SmartEX, {{sk.cena}} za rodzinę. Ostateczny pociąg i cztery miejsca potwierdzi mail z 3.04.', '<b>Odawara → Shinagawa → Narita</b> (7.05): shinkansen planistycznie 3,5-4 tys. JPY/dorosły; NEX jak wyżej.',
      '<b>Kolej międzymiastowa: około 3,2 tys. zł za rodzinę</b>, z czego {{sk.razem}} (około {{sk.razem.zl}}) to dwa zarezerwowane shinkanseny; do tego Hakone, Osaka, komunikacja miejska i taksówki. Na kolej i metro dnia w Osace przyjmujemy rezerwę 8-12 tys. JPY za rodzinę (192-288 zł przy kursie planistycznym), nie potwierdzoną taryfę. Jest częścią puli transportu 5000 zł, nie dopłatą do niej.', '<b>Do sprawdzenia przed zakupem:</b> N’EX TOKYO Round Trip Ticket ważny 14 dni: obecnie 5 200 JPY/dorosły i 2 600 JPY/dziecko, czyli 18 200 JPY (około 437 zł) za oba przejazdy rodziny. Daty 29.04 i 7.05 mieszczą się w ważności. Sprawdźcie uprawnienia i zarezerwujcie konkretne pociągi.',
      'Standardowy JR Pass nie jest tu domyślnym zakupem. Porównajcie pełny koszt z biletami punktowymi; uprawnienie do Nozomi wymaga dodatkowych warunków/opłaty'])}
  </section>

  <p class="note">Źródła taryf: <a href="https://www.jreast.co.jp/en/multi/nex/tickets/" target="_blank" rel="noopener">JR East NEX</a>, <a href="https://www.jreast.co.jp/en/multi/pass/nex.html" target="_blank" rel="noopener">bilet NEX tam i z powrotem</a>, <a href="https://smart-ex.jp/en/product/plan/service/" target="_blank" rel="noopener">SmartEX i dopłaty sezonowe</a>, <a href="https://www.hakonenavi.jp/international/en/discount_passes/free_pass" target="_blank" rel="noopener">Hakone Freepass</a>.</p>
  <section>
    <h2 class="stitle">Kalkulator kosztów</h2>
    <p class="lead-p">Szacunek dla <b>2+2</b> na cały wyjazd. W japońskiej kolei liczymy trzy taryfy dorosłe i jedną dziecięcą (10 lat); zaokrąglenia zależą od biletu. Linie lotnicze i atrakcje mają własne progi wieku. Wszystkie pola możesz edytować — suma liczy się na bieżąco, a zmiany zapisują się w przeglądarce.</p>
    <div class="card calc">
      <table>
        <thead><tr><th>Kategoria</th><th style="text-align:right">Ilość / stawka</th><th style="text-align:right">Kwota (zł)</th></tr></thead>
        <tbody>
          <tr><td class="cat">✈️ Loty<span class="hint">E-bilety: {{bilety.suma}}. Wpisane {{bilety.budzet}} to ostrożna rezerwa do uzgodnienia z kartą, nie potwierdzone rozliczenie dopłat. Bez bagażu rejestrowanego; ewentualną dopłatę wyceńcie w Manage Booking.</span></td><td class="num">—</td><td class="num"><input type="number" id="flights" aria-label="Koszt lotów za rodzinę, zł" value="${TICKET.total}" min="0" step="100"></td></tr>
          <tr><td class="cat">🏨 Noclegi<span class="hint">Trzy rezerwacje: łącznie <b>500 443 JPY</b>; w potwierdzeniach z 8.09 zapłacono 0 JPY. Średnia poniżej daje około 12 tys. zł, zależnie od kursu i podatków. Abu Zabi z vouchera stopover.</span></td><td class="num"><input type="number" id="nights" aria-label="Liczba nocy w Japonii" class="sm" value="${CALC.nights}" min="0"><span class="x">×</span><input type="number" id="nightRate" aria-label="Średni koszt noclegu rodzinnego, zł" class="sm" value="${CALC.nightRate}" min="0" step="10"></td><td class="num" id="hotelAmt">—</td></tr>
          <tr><td class="cat">🚄 Transport w Japonii<span class="hint">3 taryfy dorosłe + 1 dziecięca, kurs planistyczny 2,40 zł / 100 JPY. Dwa shinkanseny zarezerwowane; w puli także Hakone, dzień w Osace, metro, taksówki w Kioto oraz transfery w Abu Zabi. 5 000 zł jest budżetem z zapasem, nie sumą opłaconych biletów.</span></td><td class="num">—</td><td class="num"><input type="number" id="transport" aria-label="Budżet transportu, zł" value="${CALC.transport}" min="0" step="100"></td></tr>
          <tr><td class="cat">🍜 Wyżywienie<span class="hint">dni × stawka na rodzinę (pierwszy dzień w samolocie liczymy symbolicznie)</span></td><td class="num"><input type="number" id="days" aria-label="Liczba dni wyżywienia" class="sm" value="${CALC.days}" min="0"><span class="x">×</span><input type="number" id="foodRate" aria-label="Wyżywienie rodziny na dzień, zł" class="sm" value="${CALC.foodRate}" min="0" step="10"></td><td class="num" id="foodAmt">—</td></tr>
          <tr><td class="cat">🎟️ Atrakcje i warsztaty<span class="hint">Pula obejmuje KOTO (obecnie {{koto.cena}} za rodzinę, około 278 zł przy kursie planistycznym), rezerwę na niepotwierdzony warsztat Kinugasa, muzeum w Osace, świątynie, Café, taras i opcjonalne sumo. Cena warsztatu nie jest znana, nie wpisujemy 0 zł. Pula 3300 zł pozostaje szacunkiem, nie sumą ofert. Posiłku z pokazu nie liczcie drugi raz.</span></td><td class="num">—</td><td class="num"><input type="number" id="attractions" aria-label="Budżet atrakcji, zł" value="${CALC.attractions}" min="0" step="100"></td></tr>
          <tr><td class="cat">🎁 Pamiątki + rezerwa<span class="hint">bufor na nieprzewidziane; streetwear dla dzieci (4.05) liczcie osobno — koszulka ~150–300 zł, bluza ~500–1 000 zł</span></td><td class="num">—</td><td class="num"><input type="number" id="extras" aria-label="Rezerwa i dodatkowe wydatki, zł" value="${CALC.extras}" min="0" step="100"></td></tr>
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
      <div class="note" style="margin-top:10px">Orientacyjne kwoty w PLN. JR Pass zwykle się nie opłaca przy trasie Tokio–Kioto.</div>
      <button class="reset" id="resetBtn" type="button">↺ Przywróć wartości domyślne</button>
    </div>
  </section>
  ${footer('')}
  <script>
  (function(){
    var D=${JSON.stringify({flights:TICKET.total,...CALC})};
    var ids=Object.keys(D),KEY="jp2027.calc";
    var fmt=function(n){return Math.round(n).toLocaleString("pl-PL")+" zł";};
    function num(id){var v=parseFloat(document.getElementById(id).value);return Number.isFinite(v)?Math.max(0,v):0;}
    function css(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
    // Przywróć zapisane wartości, ALE nowa cena lotu ma pierwszeństwo:
    // jeśli użytkownik nie zmieniał pola "loty" ręcznie, wskocz na świeży kurs.
    var priceRefreshed=false;
    try{
      var s=JSON.parse(localStorage.getItem(KEY))||{};
      // Brak dawnego domyślnego kosztu nie jest zgodą na nadpisanie własnej kwoty.
      var untouched = s.flights==null || (s._fd!=null && Number(s.flights)===Number(s._fd));
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
    ids.forEach(function(id){document.getElementById(id).addEventListener("input",function(){if(Number(this.value)<0)this.value=0;calc();});});
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
        <div class="meta"><span>💴 <b>${H.price}</b></span><span>📍 ${H.near}</span></div><p class="booking-deadline"><b>Anulowanie:</b> ${H.cancel}</p>
        ${H.jp?`<div class="jpaddr"><span lang="ja">${H.jp}</span><button type="button" class="jpcopy" data-addr="${H.jp}" title="Skopiuj adres">Kopiuj</button></div>`:''}
        <div class="links"><a href="${gmapsQ(H.mapsq||H.name)}" target="_blank" rel="noopener">Google Maps →</a><a href="${H.site}" target="_blank" rel="noopener">strona hotelu →</a>${H.book?`<a href="${H.book}" target="_blank" rel="noopener">Rezerwacja na Booking →</a>`:''}</div>
      </div>
      <a class="hphoto" href="${gmapsQ(H.mapsq||H.name)}" target="_blank" rel="noopener">
        <img src="assets/img/hotels/${H.img||H.id+'.webp'}" alt="${H.name}" loading="lazy">
        <span class="plab">📍 Zobacz w Google Maps →</span>
      </a>
    </div>`).join('');
  const HOTELGEO=[
    [34.9858,135.7588,'Kyoto Station - okolica pierwszej bazy (4 noce)'],
    [35.6723,139.7367,'Akasaka - okolica bazy w Tokio (3 noce)'],
    [35.2337,139.0155,'Hakone Ashinoko Hanaori · Tōgendai, jezioro Ashi (1 noc)'],
  ];
  const inner=`
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(120deg,rgba(27,58,107,.58),rgba(18,39,64,.40)),url('${IMG.tokyostation}') center/cover"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Noclegi · 8 nocy w Japonii + noc w Abu Zabi · 4 obiekty · chronologicznie</p>
    <h1>Hotele</h1>
    <p class="lead">Trzy bazy pod rodzinę 2+2: aparthotele MIMARU z kuchnią i wspólnymi pralniami samoobsługowymi oraz ryokan nad jeziorem Ashi na jedną górską noc. Cztery pierwsze noce w jednym apartamencie w Kiocie, potem trzy w Tokio.</p>
  </div>
  </header>
  <section>
    <div class="hlist">${cards}</div>
  </section>
  <section>
    <h2 class="stitle">Mapa baz w Japonii</h2><p class="lead-p">Punkty pokazują okolice baz, nie wejścia do budynków. Do hotelu nawigujcie z jego zdjęcia lub przycisku Google Maps powyżej.</p>
    <div class="card">
      <div class="maphold"><button class="mapbtn" id="mapActivate">🗺️ Aktywuj mapę</button><div id="map" class="map"></div></div>
      <ol class="maplegend">${HOTELGEO.map((g,i)=>`<li><span class="mn">${i+1}</span> ${g[2]}</li>`).join('')}</ol>
      <a class="gmap" href="https://www.google.com/maps/dir/${HOTELGEO.map(g=>g[0]+','+g[1]).join('/')}" target="_blank" rel="noopener">Orientacyjna trasa baz w Google Maps ↗</a>
      <script type="application/json" id="geo">${JSON.stringify(HOTELGEO)}</script>
    </div>
  </section>
  <section>
    <div class="card"><ul class="tips">
      <li><b>Rezerwacje są potwierdzone.</b> Przy ewentualnej zmianie najpierw sprawdźcie dostępność nowego pokoju dla czterech osób i oba terminy anulowania. Pobyt w Kiocie wypada podczas Golden Week.</li>
      <li>Ryokan w Hakone: Hanaori nad jeziorem Ashi, pokój Deluxe dla 4 osób z prywatną kąpielą, kolacją i śniadaniem. Bezpłatne anulowanie tylko do 2.05.2027, 23:59 JST.</li>
      <li>Potwierdzenia trzech hoteli z 8.09 podają łącznie <b>500 443 JPY i zapłacono 0 JPY</b>. Około 12 tys. zł to przeliczenie planistyczne, nie ostateczny rachunek. Podatki miejscowe i kurs płatności mogą zmienić koszt. <b>Terminy bezpłatnego anulowania są różne</b> i widoczne przy każdym hotelu.</li>
      
      <li>Adresy dla taksówkarza najlepiej pokazywać z Google Maps po japońsku — kliknięcie zdjęcia hotelu otwiera właściwe miejsce od razu.</li>
    </ul></div>
  </section>
  ${footer('')}`;
  return shell({title:'Hotele · Japonia 2027',desc:'Noclegi wyjazdu do Japonii: aparthotele rodzinne i ryokan, z linkami do Google Maps.',prefix:'',active:'hotele.html',inner,pillsIdx:null});
}

/* ---- decyzje / dlaczego ---- */
function decyzjePage(){
  const rows=DAYS.map((d,i)=>'<tr><td><a href="days/'+d.date+'.html">'+d.dd+'</a></td><td>'+d.brief.focus+'</td><td><span class="ipill '+d.level+'">'+LEVEL_LABEL[d.level]+'</span></td></tr>').join('');
  const checklist=BOOKINGS.filter(b=>!/^✅/.test(b.when)).map(b=>'<li><label><input type="checkbox" data-ck="'+b.id+'"><span class="ckwhen">'+b.when+'</span><span class="ckwhat"><b>'+b.what+'</b><i>'+b.note+'</i></span></label></li>').join('');
  const inner='<header class="hero kb"><div class="hbg"><div class="hbg-img" style="background:'+heroBg('kioto',IMG.fushimi)+'"></div></div><div class="hero-inner"><p class="eyebrow">Rezerwacje i logika podróży</p><h1>Kulisy planu</h1><p class="lead">Co jest potwierdzone, czego jeszcze dopilnować i jak zachować spokojne tempo.</p></div></header>'+
    '<nav class="section-nav" aria-label="Skróty"><a href="#do-zalatwienia">Do załatwienia</a><a href="#terminy">Terminy</a><a href="#rytm">Rytm</a><a href="#zmiany">Jak zmieniać</a></nav>'+
    '<section id="do-zalatwienia"><h2 class="stitle">Do załatwienia</h2><p class="lead-p">Zaznaczenia to Wasza osobista lista na tym urządzeniu. Nie zmieniają statusu rezerwacji, nie synchronizują się z telefonem i nie wysyłają powiadomień.</p><div class="card"><div class="ckhead"><b id="ckcount">0</b><span id="cknext"></span></div><div class="ckbar"><div id="ckfill"></div></div><ul class="cklist">'+checklist+'</ul><button class="reset" type="button" id="ckreset">Wyczyść zaznaczenia</button></div></section>'+
    '<section><h2 class="stitle">Potwierdzone elementy</h2><div class="card"><p class="note" style="margin-top:0">Numery rezerwacji trzymamy poza stroną: w potwierdzeniach i w osobnym pliku zapisanym w telefonach dorosłych.</p><ul class="tips">'+BOOKINGS.filter(b=>/^✅/.test(b.when)).map(b=>'<li><b>'+b.what+'</b>: '+b.note+'</li>').join('')+'</ul></div></section>'+
    '<section id="terminy"><h2 class="stitle">Terminy i pogoda</h2>'+deadlineList()+'<p class="note">Prognoza 7 dni wcześniej jest wskazówką, nie gwarancją. Ostrzeżenia pogodowe, status transportu i zasady anulowania są osobnymi rzeczami. Termin bezpłatnego odwołania Hanaori mija przed wyjazdem do Hakone.</p></section>'+
    '<section id="rytm"><h2 class="stitle">Rytm rodziny 2+2</h2><p class="lead-p">Dwa najbardziej wymagające dni to podróże: 29.04 i 7.05. Dni zwiedzania mają przerwy, a 5.05 wolne popołudnie. Wszystkie dodatki naraz podniosłyby tempo ponad ocenę w tabeli.</p><div class="card" style="overflow-x:auto"><table class="rhythm"><thead><tr><th>Dzień</th><th>Cel</th><th>Tempo</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>'+
    '<section id="zmiany"><h2 class="stitle">Jak modyfikować plan</h2><div class="card more">'+
    '<details open><summary>Co chronimy przy zmęczeniu?</summary><p>Loty, dojazdy na rezerwacje i odpoczynek. 30.04 odpuszczacie Nijō; 1.05 skracacie Dōtonbori; 2.05 pomijacie Nishiki, jeśli warsztat jest dłuższy; 4.05 ograniczacie sklepy; 5.05 Akihabara jest dodatkiem. Opuszczona atrakcja nie przechodzi automatycznie na jutro.</p></details>'+
    '<details><summary>Jak zdjęcia zmieniły program?</summary><p>1.05 dodaliśmy Osakę z Sushiro Esaka, muzeum życia codziennego i Dōtonbori zamiast Nary. 2.05 KOTO i Kinugasa zastępują wcześniejsze warsztaty. Nijō przenosimy na opcjonalne popołudnie 30.04 zamiast Kiyomizu. Nishiki zostaje 2.05, jeśli jest energia. Hotele i zarezerwowane shinkanseny bez zmian. <a href="atrakcje.html#guide-tips">Identyfikacja zdjęć i źródła →</a></p></details>'+
    '<details><summary>Czy zachować też Narę i Arashiyamę?</summary><p>Nie dokładamy ich do trzech pełnych dni w Kioto. Nara może zastąpić cały dzień Osaki; Arashiyama wymaga rezygnacji z bloku KOTO i Kinugasa. Wariant Nary zachowaliśmy w katalogu. Zamek w Osace może zastąpić muzeum, ale nie dołączamy obu do jednego dnia.</p></details>'+
    '<details><summary>Dlaczego 4 noce Kioto, 3 Tokio i 1 Hakone?</summary><p>Trzy bazy pozwalają dodać Osakę jako jednodniową wycieczkę bez przepakowywania. Dalszych miast nie dokładamy. Hakone jest na końcu, dlatego zabezpieczamy poranny wyjazd na lot.</p></details>'+
    '<details><summary>Co naprawdę oznacza odwrócona trasa w Golden Week?</summary><p>Kioto 29.04-3.05 nadal wypada w popularnym okresie, a nie poza świętami. Przeniesienie do Tokio 3.05 ogranicza pobyt w Kioto podczas kolejnych świąt, lecz nie gwarantuje pustych atrakcji. Potrzebne są miejscówki i realne bufory.</p></details>'+
    '<details><summary>Jak reagować na pogodę?</summary><p>20 i 24.04 sprawdźcie sytuację przed terminami hoteli miejskich. 1-2.05 porównajcie prognozę dla Hakone z kosztem ewentualnej zmiany. 5.05 sprawdźcie ostrzeżenia, a rano 6 i 7.05 kursowanie transportu. Przy silnym wietrze statek nie zastępuje automatycznie kolejki.</p></details>'+
    '<details><summary>Co z budżetem?</summary><p>Hotele są zarezerwowane w JPY, lecz w potwierdzeniach nie były jeszcze opłacone. Koszt w złotych zależy od płatności i kursu; podatki miejscowe mogą być dodatkowe. Loty: suma e-biletów {{bilety.suma}}, w budżecie zostaje {{bilety.budzet}} do uzgodnienia z kartą. Nie przeliczamy niepotwierdzonych dopłat jako faktów.</p></details>'+
    '</div></section>'+
    `<section id="hotel-mail"><h2 class="stitle">Uzupełnienie do wysłanego maila Hanaori</h2><p class="lead-p">Wysłana wiadomość pytała o stary shuttle do Odawary i dodatkową prywatną kąpiel. Potwierdzenie pokoju rozstrzyga drugą sprawę; do ustalenia zostaje dojazd. Poniższy tekst nie został wysłany.</p><details class="card"><summary>Otwórz gotowy tekst po angielsku</summary><pre style="white-space:pre-wrap;font:14px/1.6 var(--sans)">Dear Hanaori team,

Thank you for your help. A small correction to our earlier message: our Booking.com confirmation is for a Japanese-Western Deluxe Room with Open-air Bath, so we do not need an additional private-bath reservation.

We have also seen your notice that the shuttle now runs to Gora, not Odawara. For Friday 7 May 2027, we would like to reach Odawara Station around 10:30, ahead of our international flight from Narita at {{lot.nrt.odlot}}.

Could you please advise which morning bus from Togendai would be suitable, and whether you can help arrange a taxi for four people with four cabin bags if needed? Please let us know the approximate fare and when we should confirm the transport closer to our stay.

Thank you very much.
[imię i nazwisko]</pre></details></section>`+
    '<section><h2 class="stitle">Źródła do ponownego sprawdzenia</h2><div class="linklist"><a href="https://ashinoko-hanaori.orixhotelsandresorts.com/news/10593/" target="_blank" rel="noopener">Hanaori: zmiana shuttle</a><a href="https://www.hakonenavi.jp/international/en/status_information" target="_blank" rel="noopener">Transport Hakone</a><a href="https://www.shibuya-scramble-square.com/sky/ticket/" target="_blank" rel="noopener">Shibuya Sky</a><a href="https://www.pokemon-cafe.jp/ja/cafe/news/" target="_blank" rel="noopener">Pokémon Café: NEWS</a><a href="https://www.etihad.com/en/manage/check-in" target="_blank" rel="noopener">Odprawa Etihad</a></div><p class="note">Stan sprawdzenia: 9.09.2026. Dane pokojów i terminów odwołania z potwierdzeń Booking; dokumenty i numery pozostają prywatne. <a href="loty.html">Historia wyboru lotów</a>.</p></section>'+footer('');
  return shell({title:'Kulisy planu · Japonia 2027',desc:'Co jeszcze zarezerwować, terminy odwołania hoteli i zasady spokojnej rodzinnej agendy.',prefix:'',active:'decyzje.html',inner,pillsIdx:null});
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
    const rows = d.tl.map(([t,h,desc,kind])=>`<tr><td class="t">${t}</td><td><b>${h}</b>${kind?` <small>[${ITEM_LABEL[kind]}]</small>`:''}${desc?`<span class="dsc">${desc}</span>`:''}</td></tr>`).join('');
    const facts = d.facts.map(([v,k])=>`<span><b>${v}</b>${k}</span>`).join('');
    return `<section class="pg day">
      <div class="dhead">
        <div class="dnum">Dzień ${i+1} <span>z ${DAYS.length}</span></div>
        <div class="dwhen">${d.dow} · ${d.dd} 2027${it?` · <b class="ti-${it[0]}">${IL[it[0]]}</b>`:''}</div>
      </div>
      <h2>${d.title}</h2>
      <p class="lead">${d.lead}</p><p class="note"><b>${d.brief.start} · ${d.brief.end}</b><br>${TIMING_NOTE}</p><p class="blk"><b>Ważne:</b> ${d.brief.check}</p>
      <table class="agenda">${rows}</table>
      <div class="facts">${facts}</div>
      ${fx?`<div class="flex"><p><b>Chronimy:</b> ${fx[0]}</p><p><b>✂️ Można odpuścić:</b> ${fx[1]}</p></div>`:''}
      ${H?`<p class="blk"><b>🏨 Nocleg:</b> ${H.name} - ${H.near}<br>${H.cancel}</p>`:''}
      ${d.tips&&d.tips.length?`<div class="blk"><b>Wskazówki</b><ul>${d.tips.map(t=>`<li>${t}</li>`).join('')}</ul></div>`:''}
      ${DAYRAIN[d.date]?`<div class="blk"><b>☔ Jeśli pada</b><p>${DAYRAIN[d.date]}</p></div>`:''}
      <div class="pfoot">Japonia 27 kwietnia – 8 maja 2027 · Dzień ${i+1} — ${d.dd}</div>
    </section>`;
  }).join('');

  const hotels = HOTELS.map(H=>`<tr><td><b>${H.name}</b><span class="dsc">${H.stay}</span><span class="dsc">${H.cancel}</span></td><td>${H.price}</td></tr>`).join('');

  const inner = `<div class="sheet">

  <section class="pg cover">
    <div class="band"></div>
    <div class="ctitle">
      <p class="keyb">Plan podróży</p>
      <h1>Japonia 2027</h1>
      <p class="csub">27 kwietnia – 8 maja 2027 · rodzina 2+2 (dzieci 10 i 13 lat)</p>
      <p class="csub2">Abu Zabi · Kioto · Osaka · Tokio · Hakone</p>
      <div class="rule"></div>
    </div>
    <div class="cfacts">
      <div><b>11</b>dni programu + powrót</div><div><b>8</b>nocy w Japonii</div>
      <div><b>3</b>bazy w Japonii</div><div><b>~43<i>tys. zł</i></b>budżet 2+2</div>
    </div>
    <h3 class="toch">Spis treści</h3>
    <ol class="toc">${toc}</ol>
    <p class="cnote">Godziny pociągów, ceny biletów, warunki pogodowe i dostępność atrakcji potwierdźcie przed wyjazdem.
    Wersja online zawiera mapy tras, zdjęcia i kalkulator kosztów: <b>japonia-2027.vercel.app</b></p>
    <div class="pfoot">Japonia 27 kwietnia – 8 maja 2027 · Plan podróży</div>
  </section>

  ${days}

  <section class="pg">
    <div class="dhead"><div class="dnum">Aneks</div><div class="dwhen">Noclegi, terminy i praktyka</div></div>
    <h2>Informacje praktyczne</h2>

    <h3>Noclegi</h3>
    <table class="agenda">${hotels}</table>
    

    <h3>Terminy i rezerwacje</h3>
    <p class="note">Loty oraz noclegi są potwierdzone. Warsztaty, sumo, Café i taras nie są jeszcze rezerwacjami. Daty sprzedaży wymagają ponownej kontroli w 2027.</p>
    <table class="agenda">${DEADLINES.map(x=>`<tr><td>${x.label}</td><td><b>${x.title}</b><span class="dsc">${x.text}</span></td></tr>`).join('')}</table>
    <h3>Transport i pieniądze</h3>
    <p class="note">Shinkanseny: SmartEX. NEX: JR East. Romancecar: Odakyu. Terminy, warunki zmiany i miejscówki sprawdzajcie w każdym systemie osobno. Na przylocie rezerwacja kolei powinna pozwalać na opóźnienie lotu i formalności.</p>
    <p class="note">E-bilety razem {{bilety.suma}}; w budżecie {{bilety.budzet}} do uzgodnienia z kartą. Trzy hotele: 500 443 JPY, w potwierdzeniach zapłacono 0 JPY; podatki dodatkowo. Koszt w złotych zależy od kursu płatności. Aktualne podstawy szacunków: japonia-2027.vercel.app/koszty.html.</p>
    <h3>Praktyka</h3>
    <ul class="plist">
      <li><b>Gotówka:</b> bankomaty 7-Eleven i Japan Post przyjmują karty zagraniczne. Napiwków się nie daje.</li>
      <li><b>Internet:</b> minimum dwa telefony z niezależnym internetem, gdy rozdzielacie się na warsztaty. Pakiet na Japonię nie musi działać w ZEA.</li>
      <li><b>Prąd:</b> 100 V, gniazdka typu A (dwa płaskie bolce) — potrzebny adapter.</li>
      <li><b>Alarmowe:</b> 110 policja · 119 pogotowie i straż. Woda z kranu jest zdatna do picia.</li>
      <li><b>Zwyczaje:</b> buty zdejmujemy w ryokanie i świątyniach; w pociągach cisza; koszy na śmieci prawie nie ma.</li>
      <li><b>Pranie:</b> pralnie samoobsługowe w obu MIMARU. Główne pranie 2.05 po 16:15 w Kiocie, po powrocie z warsztatu; dogrywka 5.05 wieczorem w Tokio. Opłaty i dostępność maszyn potwierdźcie na miejscu. W Hakone prania nie ma.</li>
      <li><b>Bagaż:</b> tylko podręczny — 7 kg i 56×36×23 cm na osobę, <b>razem z wagą walizki</b> (miękka 1,2–1,5 kg, twarda 2,4–3,0 kg). Pakujemy na 5 dni: 4 T-shirty, 1 spodnie zapasowe, 5 kompletów bielizny i skarpet, kurtka przeciwdeszczowa, klapki. Najcięższe rzeczy na sobie. Bez bagażu rejestrowanego w obie strony — zakupy muszą zmieścić się w limicie; ewentualną dopłatę i termin zakupu sprawdźcie w Manage Booking po ważeniu 5.05. Nie zakładamy stałej ceny.</li>
      <li><b>Tax-free w 2027:</b> nowy system zwrotu po potwierdzeniu wywozu. Płaćcie zgodnie z zasadami sklepu, zachowajcie dokumenty i dostęp do towarów przed nadaniem bagażu. Nie zakładajcie automatycznego zwrotu gotówki na lotnisku.</li>
    </ul>
    <div class="pfoot">Japonia 27 kwietnia – 8 maja 2027 · Aneks praktyczny</div>
  </section>
</div>`;

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="Plan podróży do Japonii 27 kwietnia – 8 maja 2027 w wersji do druku i zapisu jako PDF.">
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
  border-radius:14px;font-size:13px;color:var(--muted)}
.sheet{max-width:820px;margin:18px auto 60px;padding:0 16px}
.pg{background:#fff;border:1px solid var(--line);border-radius:8px;padding:34px 40px 30px;margin-bottom:22px;position:relative}
h1{font-family:var(--serif);font-weight:500;font-size:44px;line-height:1.05;margin:0;letter-spacing:-.01em}
h2{font-family:var(--serif);font-weight:500;font-size:26px;line-height:1.15;margin:2px 0 6px;letter-spacing:-.01em}
h3{font-family:var(--serif);font-weight:500;font-size:20px;margin:22px 0 8px}
/* okładka */
.cover{padding-top:0;overflow:hidden}
.band{background:var(--dark);height:64px;margin:0 -40px 30px}
.ctitle{text-align:center}
.keyb{text-transform:uppercase;letter-spacing:.22em;font-size:11px;font-weight:700;color:var(--kin);margin:0 0 8px}
.csub{color:var(--ai);font-size:15.5px;margin:12px 0 2px;font-weight:600}
.csub2{color:var(--muted);font-size:14px;margin:0}
.rule{height:2px;background:var(--shu);width:180px;margin:20px auto 0}
.cfacts{display:flex;justify-content:center;gap:26px;flex-wrap:wrap;margin:24px 0 6px;text-align:center}
.cfacts div{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}
.cfacts b{display:block;font-family:var(--serif);font-weight:500;font-size:27px;color:var(--ai);letter-spacing:-.01em}
.cfacts i{font-size:12px;font-style:normal;color:var(--muted)}
.toch{text-align:center;margin-top:26px}
.toc{list-style:none;margin:0;padding:0;font-size:13px}
.toc li{display:flex;align-items:baseline;gap:10px;padding:6px 2px;border-bottom:1px dotted var(--line)}
.toc .tn{flex:0 0 22px;font-weight:800;color:var(--shu);font-size:12px}
.toc .td{flex:0 0 74px;color:var(--muted)}
.toc .tt{flex:1}
.toc .ti{flex:0 0 auto;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.ti-g{color:var(--ok)}.ti-y{color:var(--kin)}.ti-r{color:var(--shu)}
.cnote{margin-top:22px;font-size:11px;color:var(--muted);text-align:center;line-height:1.6}
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
.dsc{display:block;color:var(--muted);font-size:12px;margin-top:2px}
.facts{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 0}
.facts span{flex:1 1 118px;border:1px solid var(--line);border-radius:8px;padding:7px 10px;font-size:11px;
  text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.facts b{display:block;font-size:13px;text-transform:none;letter-spacing:0;color:var(--ink);margin-bottom:1px}
.flex{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}
.flex p{flex:1 1 240px;margin:0;font-size:12px;border:1px solid var(--line);border-radius:8px;padding:8px 11px;background:#fbf9f4}
.blk{margin-top:14px;font-size:13px}
.blk ul{margin:6px 0 0;padding-left:18px}
.blk li{margin:4px 0}
.plist{margin:8px 0 0;padding-left:18px;font-size:13px}
.plist li{margin:6px 0}
.note{font-size:12px;color:var(--muted);margin-top:8px}
.pfoot{margin-top:22px;padding-top:8px;border-top:1px solid var(--line);font-size:11px;color:var(--muted);text-align:center}

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
  .pfoot{position:static;margin-top:8mm}
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
<p class="hint">Kliknij <b>„Drukuj / zapisz jako PDF"</b>, a w oknie drukowania wybierz miejsce docelowe <b>„Zapisz jako PDF"</b>. Ustaw format <b>A4</b> i włącz <b>grafikę tła</b>, żeby zachować kolory okładki. Każdy dzień zaczyna się na nowej stronie. Liczba stron zależy od ustawień drukowania; przed zapisaniem sprawdź podgląd, marginesy i wyłącz nagłówki przeglądarki.</p>
${inner}
</body>
</html>`;
}

function lotyPage(){
  const inner = `
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(120deg,rgba(27,58,107,.58),rgba(200,64,44,.42)),url('${IMG.tokyostation}') center/cover"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Bilety · godziny · bagaż</p>
    <h1>Loty</h1>
    <p class="lead"><b>Etihad jest kupiony.</b> Wylot 27.04, noc w Abu Zabi, Narita 29.04; powrót z Japonii 7.05 i lądowanie w Warszawie 8.05. E-bilety: {{bilety.suma}}. Kwota budżetowa {{bilety.budzet}} wymaga uzgodnienia z kartą.</p>
    </div>
  </header>

  <section>
    <h2 class="stitle">Wybrany bilet</h2>
    <p class="lead-p">Rozstrzygnięcie zapadło na etihad.com — finalna wycena przewoźnika, której Google nie umiał policzyć (kombinacja stopover + powrót z Narity wycenia się tam absurdalnie).</p>
    <div class="card">
      <div class="scenrow"><span><b>Etihad, ${TICKET.label}</b> · Economy Basic · 3 dorosłych + 1 dziecko</span><b>${plz(TICKET.family)}</b></div>
      <div class="scenrow"><span>Nocleg stopover: Grand Millennium Al Wahda, voucher otrzymany</span><b>0 zł</b></div>
      <div class="scenrow"><span>Bagaż rejestrowany — świadomie pomijamy (w cenie podręczne 7 kg/os.)</span><b>0 zł</b></div>
      <div class="scentot"><span>Rezerwa budżetowa do rozliczenia</span><b>~${plz(TICKET.total)}</b></div>
      <ul class="tips" style="margin-top:14px">
        <li>WAW {{lot.waw.odlot}} → AUH {{lot.auh.przylot}} (27.04) · nocleg · AUH {{lot.auh.odlot}} → Narita {{lot.nrt.przylot}} (29.04) · powrót Narita {{lot.nrt.odlot}} (7.05) → WAW {{lot.waw.przylot|h}} <b>w sobotę 8.05</b>.</li>
      <li><b>Kwota do uzgodnienia:</b> cztery e-bilety sumują się do <b>{{bilety.suma}}</b>, a obciążenie przyjęte w budżecie to {{bilety.budzet}}. Przyczyna różnicy 756,64 zł nie jest potwierdzona. Sprawdźcie transakcje na karcie i dokumenty dopłat; nie przypisujemy tej kwoty do domniemanej opłaty.</li>
        <li>Miejsca obok siebie: 8.09 Etihad dodał bezpłatną notatkę do rezerwacji (rodzina razem, 10-latek przy rodzicu, 13-latek blisko reszty, wszystkie odcinki) — numer sprawy w mailu od Etihada. Płatnych miejsc nie kupiono; konkretny przydział przy odprawie, zależnie od dostępności.</li>
        <li><b>Bez bagażu rejestrowanego w obie strony</b> (decyzja 8.09) — cztery podręczne po 7 kg to cały bagaż wyjazdu. 5.05 zważcie każdy bagaż. Jeśli przekroczy limit, sprawdźcie cenę i termin zakupu bagażu rejestrowanego w Manage Booking. Nie zakładamy stałej dopłaty ani dostępności tej samej ceny na lotnisku.</li>
        <li>Termin przesunięty 7.09 z 3–14 maja na 27.04–7.05 (wycieczka klasowa dziecka 10.05); w Google ta sama cena biletu, kwota ze stopoverem do potwierdzenia w kasie.</li>
      </ul>
    </div>
  </section>

  <section>
    <h2 class="stitle">Kupione — co jeszcze domknąć</h2>
    <div class="card"><ul class="tips">
      <li><b>Kupione 8.09.2026.</b> Bilety i voucher są potwierdzone. Do uzgodnienia zostaje pełne rozliczenie kwoty na karcie, nie ponowny wybór przewoźnika.</li>
      <li><b>Do domknięcia w „Manage booking”:</b> dane paszportowe całej czwórki. Miejsca obok siebie zgłoszone bezpłatnie 8.09 (numer sprawy w mailu od Etihada); bagażu rejestrowanego świadomie nie kupujemy — decyzja wraca 5.05 wieczorem przy pakowaniu.</li>
      <li><b>Zmiany/anulowanie:</b> sprawdźcie warunki wystawionej taryfy przed zmianą. Ubezpieczenie nie gwarantuje zwrotu przy dowolnej rezygnacji; zakres, wyłączenia i termin zakupu ochrony kosztów rezygnacji trzeba sprawdzić teraz.</li>
    </ul></div>
  </section>

  <section>
    <h2 class="stitle">Dalej</h2>
    <div class="quick">
      <a class="qcard" href="koszty.html"><div class="qi">💴</div><div class="qh">Budżet całości</div><div class="qd">Kalkulator kosztów i zweryfikowane taryfy kolejowe.</div></a>
      <a class="qcard" href="hotele.html"><div class="qi">🏨</div><div class="qh">Noclegi</div><div class="qd">3 bazy: cztery noce w Kiocie, trzy w Tokio, ryokan w Hakone.</div></a>
    </div>
  </section>
  ${footer('')}`;
  return shell({title:'Loty · Japonia 2027',desc:'Kupione bilety Etihad: godziny lotów, stopover w Abu Zabi i bagaż.',prefix:'',active:'loty.html',inner,pillsIdx:null});
}

function pogodaPage(){
  const rows=[
    ['🕌 Abu Zabi (28.04)','35–40°C','~26°C','upał! zwiedzanie rano, w południe klimatyzacja (Luwr), dużo wody'],
    ['⛩️ Kioto / Osaka (29.04-3.05)','~24°C','~13°C','wartości orientacyjne dla regionu; sprawdźcie osobną prognozę na dzień w Osace'],
    ['🏙️ Tokio (3–6.05)','~22°C','~13°C','przyjemnie, słonecznie; sporadyczny przelotny deszcz'],
    ['♨️ Hakone (6.05, góry)','~18°C','~9°C','chłodniej i wilgotniej — weź ciepłą warstwę; Fudżi najlepiej widać rano'],
  ].map(r=>`<tr><td class="cat">${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td>${r[3]}</td></tr>`).join('');
  const inner=`
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(120deg,rgba(31,94,90,.56),rgba(18,44,42,.42)),url('${IMG.fuji}') center/cover"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Klimat i pakowanie</p>
    <h1>Przed wyjazdem: pogoda i pakowanie</h1>
    <p class="lead">Przełom kwietnia i maja to jeden z najlepszych momentów na Japonię: ciepło, słonecznie i sucho — przed sezonem deszczowym, który na głównej wyspie zaczyna się dopiero w czerwcu.</p>
  </div>
  </header>
  <section>
    <h2 class="stitle">Pogoda teraz — na żywo</h2>
    <p class="lead-p">Aktualne warunki i najbliższe dni we wszystkich bazach trasy plus Abu Zabi. Dane odświeżają się przy każdym otwarciu strony. Prognoza sięga ~16 dni, więc na maj 2027 zajrzyj tu bliżej wyjazdu — teraz służy głównie do porównania, jak bardzo góry (Hakone) potrafią być chłodniejsze od miast.</p>
    <div class="wxwrap" id="livewx"><p class="wxerr">Ładowanie pogody na żywo…</p></div>
  </section>
  <section>
    <h2 class="stitle">Typowe temperatury na przełomie kwietnia i maja</h2>
    <div class="wxwrap"><table>
      <thead><tr><th>Region</th><th style="text-align:right">Dzień</th><th style="text-align:right">Noc</th><th>Uwaga</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <p class="note" style="margin-top:10px">Wartości to średnie klimatyczne — dokładna prognoza na 2027 pojawi się bliżej wyjazdu.</p>
  </section>
  <section>
    <h2 id="kwitnienie" class="stitle">Kwitnienie: sprawdzamy, nie obiecujemy sakury</h2>
    <div class="card"><p>W styczniu i lutym 2027 sprawdźcie pierwsze publikacje sezonowe <a href="https://n-kishou.com/corp/news-contents/sakura/?lang=en" target="_blank" rel="noopener">Japan Meteorological Corporation</a>. To prognozy, nie pewny kalendarz wszystkich kwiatów. Dat publikacji na sezon 2027 jeszcze tutaj nie potwierdzamy.</p><p>Tokio odwiedzacie 3-6 maja, zwykle już po głównym sezonie wiśni. Jeśli przewodnik miał na myśli <b>Shinjuku Gyoen</b>, jego oficjalny opis podaje szczyt późnych odmian około połowy kwietnia. Nie wpisujemy więc dodatkowego ogrodu wyłącznie dla sakury. Zieleń i inne kwiaty mogą być powodem spaceru, ale tylko zamiast innej opcji.</p><p><b>Decyzja 48-72 godziny przed spacerem:</b> sprawdźcie aktualny komunikat o kwitnieniu konkretnego ogrodu, pogodę i ewentualne rezerwacje. Nie przenosimy trasy ani hoteli za kwiatami. <a href="https://policies.env.go.jp/national-garden/shinjukugyoen/english/highlights/sakura/" target="_blank" rel="noopener">Sezon sakury w Shinjuku Gyoen →</a></p><p class="note">Źródła sprawdzone 20.09.2026; to informacja sezonowa, nie prognoza na Wasze dni.</p></div>
  </section>
  <section>
    <h2 class="stitle">Ile wolno zabrać</h2>
    <p class="lead-p">Lecimy Etihadem w taryfie Economy Basic: jedna sztuka podręczna na osobę, <b>7 kg i 56×36×23 cm</b>, bez bagażu rejestrowanego w cenie. Cztery małe walizki jadą z nami przez cały wyjazd — dlatego kurier na lotnisko wypadł z planu.</p>
    <div class="card"><ul class="tips">
      <li><b>Waga jest limitem, nie objętość.</b> 7 kg waży się przy odprawie. Źródła różnią się co do tego, czy w ekonomii Etihadu dochodzi jeszcze mała sztuka osobista — przy locie bez bagażu rejestrowanego to realna różnica, więc potwierdźcie w „Manage booking”.</li>
      <li><b>Zakupy muszą mieścić się w limicie każdego pasażera.</b> Tabele wag są przykładem, nie wynikiem ważenia waszych walizek. Zapas jednej osoby nie zwiększa automatycznie limitu drugiej. <b>Plan B:</b> 5.05 przed kolacją zważcie każdy bagaż i w razie potrzeby wyceńcie bagaż rejestrowany w Manage Booking. Sprawdźcie warunki trasy z przesiadką; dopłata i termin zakupu nie są tutaj potwierdzone.</li>
      <li><b>Kurier niepotrzebny.</b> Takkyūbin (~2 000–2 800 ¥/szt.) opłaca się przy dużych walizkach — przy podręcznych taniej i prościej wziąć je ze sobą. Jedyny odcinek, gdzie warto rozważyć dowóz, to pętla w Hakone: bagaż zostawiacie przy dworcu Yumoto, czeka w ryokanie.</li>
    </ul></div>
  </section>

  <section>
    <h2 class="stitle">Plan pakowania — 7 kg na osobę</h2>
    <p class="lead-p">Cztery podręczne to cały bagaż wyjazdu. <b>Limit 7 kg obejmuje samą walizkę</b>, a to jest różnica, która decyduje o wszystkim: twarda kabinówka waży 2,4–3,0 kg i zjada 40% przydziału, miękka torba albo plecak 1,2–1,5 kg. Wybierzcie miękkie — zostaje wtedy ~5,5 kg na rzeczy. Drugi trik: <b>najcięższe ubrania i buty macie na sobie</b> w dniu lotu, bo to się nie liczy.</p>
    <div class="card" style="padding:0;overflow:hidden"><div style="overflow-x:auto"><table class="rhythm">
      <thead><tr><th>Dorosły — do bagażu</th><th>Ile</th><th>Waga</th></tr></thead>
      <tbody>
        <tr><td class="dcol">T-shirty</td><td>4</td><td>600 g</td></tr>
        <tr><td class="dcol">Longsleeve lub koszula <small>(meczet w Abu Zabi wymaga zakrytych ramion)</small></td><td>1</td><td>250 g</td></tr>
        <tr><td class="dcol">Spodnie zapasowe, lekkie</td><td>1</td><td>350 g</td></tr>
        <tr><td class="dcol">Szorty <small>(tylko na Abu Zabi i cieplejsze popołudnia)</small></td><td>1</td><td>200 g</td></tr>
        <tr><td class="dcol">Bielizna</td><td>5</td><td>250 g</td></tr>
        <tr><td class="dcol">Skarpety <small>(bez dziur — buty zdejmuje się kilka razy dziennie)</small></td><td>5</td><td>250 g</td></tr>
        <tr><td class="dcol">Koszulka do spania <small>(w ryokanie jest yukata)</small></td><td>1</td><td>200 g</td></tr>
        <tr><td class="dcol">Buty wsuwane lub klapki</td><td>1 para</td><td>350 g</td></tr>
        <tr><td class="dcol">Kurtka przeciwdeszczowa, składana</td><td>1</td><td>250 g</td></tr>
        <tr><td class="dcol">Parasol składany</td><td>1</td><td>250 g</td></tr>
        <tr><td class="dcol">Kosmetyczka <small>(wszystko do 100 ml — reszta jest w hotelu)</small></td><td>—</td><td>400 g</td></tr>
        <tr><td class="dcol">Apteczka podręczna</td><td>—</td><td>200 g</td></tr>
        <tr><td class="dcol">Ładowarka, kable, powerbank, adapter typu A</td><td>—</td><td>540 g</td></tr>
        <tr><td class="dcol">Płócienna torba na zakupy + worek na brudne</td><td>2</td><td>150 g</td></tr>
        <tr><td class="dcol"><b>Razem w bagażu</b></td><td></td><td><b>~4,2 kg</b></td></tr>
        <tr><td class="dcol"><b>Z miękką walizką 1,5 kg</b></td><td></td><td><b>~5,7 kg — zapas 1,3 kg</b></td></tr>
      </tbody>
    </table></div></div>
    <p class="note" style="margin-top:10px">Na sobie w dniu lotu: buty do chodzenia, długie spodnie, T-shirt i bluza. To ~2 kg, których nikt nie waży.</p>

    <div class="card" style="padding:0;overflow:hidden;margin-top:16px"><div style="overflow-x:auto"><table class="rhythm">
      <thead><tr><th>Dziecko (10 i 13 lat) — do bagażu</th><th>Ile</th><th>Waga</th></tr></thead>
      <tbody>
        <tr><td class="dcol">T-shirty</td><td>4</td><td>400 g</td></tr>
        <tr><td class="dcol">Bluza</td><td>1</td><td>350 g</td></tr>
        <tr><td class="dcol">Spodnie zapasowe</td><td>1</td><td>300 g</td></tr>
        <tr><td class="dcol">Szorty</td><td>1</td><td>150 g</td></tr>
        <tr><td class="dcol">Bielizna</td><td>5</td><td>175 g</td></tr>
        <tr><td class="dcol">Skarpety</td><td>5</td><td>175 g</td></tr>
        <tr><td class="dcol">Piżama</td><td>1</td><td>200 g</td></tr>
        <tr><td class="dcol">Klapki</td><td>1 para</td><td>250 g</td></tr>
        <tr><td class="dcol">Kurtka przeciwdeszczowa</td><td>1</td><td>200 g</td></tr>
        <tr><td class="dcol">Kosmetyczka</td><td>—</td><td>150 g</td></tr>
        <tr><td class="dcol">Na lot: słuchawki, konsola albo tablet, książka</td><td>—</td><td>600 g</td></tr>
        <tr><td class="dcol">Butelka na wodę <small>(pusta przez kontrolę, potem z kranu)</small></td><td>1</td><td>100 g</td></tr>
        <tr><td class="dcol">Notes i długopisy <small>(pieczątki goshuin i bilety)</small></td><td>—</td><td>150 g</td></tr>
        <tr><td class="dcol"><b>Razem w bagażu</b></td><td></td><td><b>~3,2 kg</b></td></tr>
        <tr><td class="dcol"><b>Z walizką dziecięcą 1,2 kg</b></td><td></td><td><b>~4,4 kg — zapas 2,6 kg</b></td></tr>
      </tbody>
    </table></div></div>
    <p class="note" style="margin-top:10px">Bagaże dzieci są najlżejsze i to jest zamierzone: ten zapas 2,6 kg na osobę to miejsce na streetwear z Cat Street i pluszaki z Nihombashi. Cała rodzina wyjeżdża z ~20 kg z 28 dostępnych.</p>

    <h2 class="stitle" style="margin-top:34px">Czego nie pakować</h2>
    <div class="card"><ul class="tips">
      <li><b>Ręczników, piżamy na Hakone i kosmetyków podstawowych.</b> Ryokan daje yukatę, ręczniki i wszystko do onsenu; MIMARU i hotel w Abu Zabi dają szampon i mydło.</li>
      <li><b>Dużego opakowania detergentu.</b> Sposób dozowania i ewentualny zakup środka do prania sprawdźcie w pralni lub recepcji.</li>
      <li><b>Nożyczek, scyzoryka, płynów powyżej 100 ml.</b> Lecimy bez bagażu rejestrowanego w obie strony, więc podręczny przechodzi przez kontrolę z całą zawartością.</li>
      <li><b>Zapasowych butów „na wszelki wypadek”.</b> Jedna para na nogach plus wsuwane to komplet; para butów to 700–900 g, czyli 15% przydziału.</li>
      <li>Weźcie za to <b>małą wagę bagażową</b> (~80 g). Przy limicie 7 kg i zakupach w Tokio to jedyny sposób, żeby nie zgadywać przed odprawą.</li>
    </ul></div>

    <h2 class="stitle" style="margin-top:34px">Pranie — gdzie i kiedy</h2>
    <p class="lead-p">Pakujemy na pięć dni, więc jedno porządne pranie w połowie wyjazdu domyka garderobę do końca. Oba MIMARU mają <b>pralnie samoobsługowe</b>, nie pralki w pokojach.</p>
    <div class="card" style="padding:0;overflow:hidden"><div style="overflow-x:auto"><table class="rhythm">
      <thead><tr><th>Kiedy</th><th>Gdzie</th><th>Co robimy</th></tr></thead>
      <tbody>
        <tr><td class="dcol">29.04, czwartek, wieczór</td><td>MIMARU Kyoto Station</td><td>Nie pranie, tylko ratunek: strój z Abu Zabi po dniu w 40°C przepierzcie ręcznie i powieście. Reszta czeka.</td></tr>
        <tr><td class="dcol"><b>2.05, niedziela, po 16:15</b></td><td><b>MIMARU Kyoto Station</b></td><td><b>Główne pranie wyjazdu.</b> Po powrocie z warsztatu. Dostępność maszyn, detergent i cenę sprawdźcie na miejscu. Zarezerwujcie około 2-3 godzin z suszeniem; kolacja blisko hotelu.</td></tr>
        <tr><td class="dcol">5.05, środa, 21:00</td><td>MIMARU Tokyo Akasaka</td><td>Dogrywka przy pakowaniu, jeśli chcecie wrócić w czystych rzeczach. Detergent kupujecie na recepcji.</td></tr>
      </tbody>
    </table></div></div>
    <div class="card" style="margin-top:16px"><ul class="tips">
      <li><b>Pierzcie po południu, nie wieczorem.</b> Pralnia w Kiocie robi się zatłoczona po 19:00, gdy wszyscy wracają ze zwiedzania. O 14:30 zwykle jest pusta.</li>
      <li><b>Suszarka jest wolniejsza niż pralka.</b> Pranie 30 minut, suszenie realnie 60–90 minut. Maszyny mogą być zajęte. Jeden rodzic może dopilnować prania, a drugi wyjść z dziećmi na krótki posiłek; nie planujcie na ten wieczór sztywnej rezerwacji.</li>
      <li><b>Nie ma prania w Hakone.</b> Ryokan to jedna noc i jedziemy stamtąd prosto na lotnisko, więc 5.05 w Tokio to ostatnia okazja.</li>
    </ul></div>

    <h2 class="stitle" style="margin-top:34px">Pogoda w bagażu — od 40°C do 9°C</h2>
    <div class="card"><ul class="tips">
      <li><b>Rozpiętość jest ekstremalna:</b> Abu Zabi 28.04 potrafi mieć 40°C, a noc w Hakone 6.05 schodzi do 9°C. Dlatego warstwy, nie grube rzeczy.</li>
      <li><b>Strój na meczet trzymajcie na wierzchu</b> — zakryte ramiona i nogi; kobiety dostają abaję na miejscu. To jedyny dzień, gdy to jest potrzebne.</li>
      <li>Lekka kurtka lub wiatrówka i składany parasol — w maju pada zwykle przelotnie, ~9 dni w miesiącu.</li>
      <li>Buty łatwe do zdejmowania — świątynie, tatami, warsztat kaligrafii i ryokan wymagają tego kilka razy dziennie.</li>
      <li>Krem z filtrem i nakrycie głowy: słońce o tej porze operuje mocno, zwłaszcza w Narze i na Fushimi.</li>
    </ul></div>
  </section>

  <section>
    <h2 class="stitle">Plan B na deszcz — miasto po mieście</h2>
    <div class="card"><ul class="tips">
      <li><b>Tokio:</b> Round1 (Ikebukuro), rodzinne karaoke (Big Echo / Karaoke Kan, przed 22:00), Pokémon Center — a Shibuya Sky przekładać: taras odkryty, w chmurach szkoda biletu.</li>
      <li><b>Hakone:</b> kolejka linowa staje przy wietrze (status: hakonenavi.jp) → Hakone Open-Air Museum (pawilon Picassa, rzeźby do wspinania) + rejs po Ashi, który pływa prawie zawsze.</li>
      <li><b>Kioto:</b> Kyoto Railway Museum (symulator shinkansena; <b>w środy zamknięte — w Kiocie jesteśmy czwartek–poniedziałek, więc otwarte</b>), teamLab Biovortex przy dworcu, kryte pasaże Nishiki/Teramachi, klasa ninja w muzeum.</li>
      
    </ul></div>
  </section>
  ${footer('')}`;
  return shell({title:'Przed wyjazdem · Japonia 2027',desc:'Pogoda na przełomie kwietnia i maja w Japonii i lista rzeczy do spakowania.',prefix:'',active:'pogoda.html',inner,pillsIdx:null});
}

/* ---- atrakcje (reuse existing card content under new shell) ---- */
/* Katalog atrakcji — TREŚĆ ŹRÓDŁOWA.
   Wcześniej `atrakcjePage()` czytała własny poprzedni wynik z `atrakcje.html`, przez co:
   (a) build nie był deterministyczny (plik puchł o pustą linię przy każdym uruchomieniu),
   (b) treść istniała wyłącznie w wygenerowanym HTML — skasowanie pliku wywracało build
       i bezpowrotnie gubiło 41 kart. Teraz źródłem jest ta stała. */
function niezbednikPage(){
  const seg=(t,items)=>`<div class="card" style="margin-bottom:14px"><h3 style="font-family:var(--serif);font-weight:500;font-size:20px;margin:0 0 10px">${t}</h3><ul class="tips">${items.map(i=>`<li>${i}</li>`).join('')}</ul></div>`;
  const inner=`
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(120deg,rgba(27,58,107,.60),rgba(18,39,64,.44)),url('${IMG.tokyostation}') center/cover"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Wszystko, czego szukasz w biegu</p>
    <h1>Niezbędnik</h1>
    <p class="lead">Numery alarmowe, pieniądze, bilety, internet, gniazdka i zwyczaje — w jednym miejscu, żeby nie szukać po całym serwisie. Ta strona działa też offline.</p>
    </div>
  </header>

  <section>
    <h2 class="stitle">Gdyby coś poszło nie tak</h2>
    <p class="lead-p">Najpilniejsze rzeczy na górze — żeby nie trzeba było przewijać, gdy się spieszysz.</p>
    <div class="card">
      <div class="sos">
        <a href="tel:110"><b>110</b><span>policja</span></a>
        <a href="tel:119"><b>119</b><span>pogotowie · straż</span></a>
      </div>
      <p class="note" style="margin:10px 0 0">Oba numery działają z każdego telefonu, także bez karty SIM i bez zasięgu sieci własnego operatora.</p>

      <div class="sosblock">
        <h4>Ambasada RP w Tokio</h4>
        <p>2-13-5 Mita, Meguro-ku, 153-0062 Tokio · centrala <a href="tel:+81357947020">+81 3 5794 7020</a></p>
        <p><b>Telefon dyżurny, całodobowy — tylko sytuacje nagłe:</b> <a href="tel:+818046107020">+81 80 4610 7020</a><br>
        Wypadek, zatrzymanie, zgon, klęska żywiołowa. To nie jest infolinia ani zapisy na wizyty.</p>
        <p>Sprawy paszportowe: wtorek–czwartek 9:30–12:00, po umówieniu przez e-Konsulat.</p>
      </div>

      <ul class="tips" style="margin-top:16px">
        <li><b>Zgubiony paszport:</b> najpierw zgłoszenie na policji (dostaniecie zaświadczenie), potem ambasada wydaje paszport tymczasowy. Miejcie <b>zdjęcia paszportów w telefonie</b> — bardzo przyspiesza sprawę.</li>
        <li><b>Zgubiona rzecz:</b> w Japonii niemal wszystko wraca. Pytajcie w budce policyjnej <i lang="ja">kōban</i> (交番) albo w biurze rzeczy znalezionych na stacji.</li>
        <li><b>Ubezpieczenie:</b> numer polisy i telefon assistance zapiszcie offline — szpital zapyta o nie od razu.</li>
      </ul>
    </div>
  </section>

  <section>
    <h2 class="stitle">Na co dzień</h2>
    ${seg('💴 Pieniądze i płatności',[
      'Japonia wciąż lubi <b>gotówkę</b> — małe knajpki, świątynie, targi i automaty często nie przyjmą karty.',
      'Karty zagraniczne obsługują m.in. bankomaty <b>Seven Bank</b> i <b>Japan Post</b>. Godziny zależą od lokalizacji i przerw serwisowych; miejcie nieduży zapas gotówki.',
      'Karta zbliżeniowa działa w sieciówkach, dużych sklepach i na dworcach.',
      '<b>Napiwków się nie daje</b> — próba zostawienia reszty bywa odbierana jako niezręczność.'])}
    ${seg('🚃 Poruszanie się po miastach',[
      'Karty <b>IC</b> — Suica/PASMO (Tokio) albo ICOCA (Kansai) — działają w wielu uczestniczących sieciach transportu i sklepach, ale nie na każdej trasie. Nie zastępują automatycznie biletu i miejscówki na shinkansen ani dopłaty na pociąg ekspresowy.',
      'Dla <b>10-latki karta dziecięca</b> z dokumentem wieku; 13-latek korzysta na kolei z taryfy dorosłej. Sprawdźcie obsługę kart dziecięcych w wybranym systemie.',
      'Na iPhonie: <b>Suica w Apple Wallet</b>, doładowanie kartą — można założyć jeszcze przed wyjazdem.'])}
    ${seg('🚄 Przejazdy między miastami',[
      '<b>JR Pass się przy naszej trasie nie opłaca</b> (~50 000 ¥/os.) — bilety punktowe wychodzą około dwa razy taniej.',
      'Do Hakone: <b>Hakone Free Pass</b> (Odakyu) — obejmuje kolejkę linową, statek po jeziorze, autobusy i pociąg górski.',
      'Bagaż: <b>tylko podręczny 7 kg/os.</b>, jedzie z nami — kurier między bazami niepotrzebny. W Hakone można go oddać przy dworcu Yumoto i odebrać w ryokanie (~800–1 100 ¥/szt.).',
      'Szczegółowe ceny naszych odcinków są w <a href="koszty.html">Kosztach</a>.'])}
    ${seg('📶 Internet i prąd',[
      'Przy wspólnym zwiedzaniu pocket WiFi może wystarczyć. Gdy rodzina rozdziela się na warsztaty, <b>każdy dorosły potrzebuje niezależnego internetu</b> i zapisanych adresów.',
      'Alternatywa: <b>eSIM w zgodnym telefonie</b>, przygotowana przed wylotem. Sprawdźcie aktywację, roaming danych i osobne pokrycie ZEA oraz Japonii; nazwa pakietu „Japan” nie oznacza internetu w Abu Zabi.',
      '<b>Prąd: 100 V, gniazdka typu A</b> (dwa płaskie bolce) — polskie wtyczki nie pasują, potrzebny adapter. Ładowarki 100–240 V działają bez przetwornicy.'])}
    ${seg('🙇 Zwyczaje, które warto znać',[
      '<b>Buty zdejmujemy</b> w ryokanie, świątyniach i części restauracji — stąd buty łatwe do zdejmowania.',
      'W pociągach obowiązuje <b>cisza</b>, telefon na milczek, rozmowy szeptem.',
      '<b>Koszy na śmieci prawie nie ma</b> — noście małą torebkę na odpadki i wyrzucajcie w hotelu albo w konbini.',
      'Nie je się i nie pije w ruchu — zwykle staje się obok automatu albo sklepu.',
      '<b>Onsen:</b> sprawdźcie regulamin publicznych łaźni, m.in. zasady tatuaży i kąpieli dzieci. Wasz pokój Hanaori Deluxe ma już prywatną kąpiel na świeżym powietrzu - dodatkowa rezerwacja nie jest potrzebna.'])}
    ${seg('🛍️ Tax-free i aplikacje',[
      '<b>Od 1.11.2026 obowiązuje nowy system zwrotu</b>, więc dotyczy waszego wyjazdu. W sklepie tax-free okazujecie paszport i płacicie kwotę brutto; zwrot następuje po potwierdzeniu wywozu przez urząd celny, zgodnie z procedurą sklepu/operatora.',
      'Zachowajcie towary i dokumenty do kontroli przed wywozem, także przed oddaniem bagażu rejestrowanego. Nie zakładajcie automatycznej wypłaty gotówki na lotnisku. <a href="https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00019.html" target="_blank" rel="noopener">Oficjalne zasady nowego systemu →</a>',
      'Warto mieć: <b>Google Maps</b>, <b>Google Translate</b> (tłumaczy menu aparatem — bardzo się przydaje), <b>Navitime</b> lub Japan Travel do połączeń kolejowych.'])}
    ${seg('🗣️ Pięć zwrotów, które załatwiają 90% sytuacji',[
      '<i lang="ja">Sumimasen</i> (すみません) — „przepraszam / przepraszam, czy mogę…" — uniwersalne zagajenie.',
      '<i lang="ja">Arigatō gozaimasu</i> (ありがとうございます) — „dziękuję" w formie grzecznej.',
      '<i lang="ja">Onegaishimasu</i> (お願いします) — „poproszę".',
      '<i lang="ja">Eigo de ii desu ka?</i> (英語でいいですか) — „czy może być po angielsku?"',
      '<i lang="ja">Kore o kudasai</i> (これをください) — „poproszę to" (wskazując palcem — działa zawsze).'])}
  </section>

  <section>
    <h2 class="stitle">Dalej</h2>
    <div class="quick">
      <a class="qcard" href="pogoda.html"><div class="qi">☀️</div><div class="qh">Pogoda i pakowanie</div><div class="qd">Czego się spodziewać na przełomie kwietnia i maja, co spakować i plany B na deszcz.</div></a>
      <a class="qcard" href="hotele.html"><div class="qi">🏨</div><div class="qh">Noclegi</div><div class="qd">Adresy po japońsku do pokazania taksówkarzowi.</div></a>
      <a class="qcard" href="druk.html"><div class="qi">📄</div><div class="qh">Plan do druku</div><div class="qd">Całość na kartkach — na wypadek rozładowanego telefonu.</div></a>
    </div>
  </section>
  ${footer('')}`;
  return shell({title:'Niezbędnik — numery, pieniądze, transport · Japonia 2027',desc:'Numery alarmowe, ambasada, pieniądze, karty IC, internet, gniazdka i zwyczaje — praktyczny niezbędnik na wyjazd do Japonii.',prefix:'',active:'niezbednik.html',inner,pillsIdx:null});
}

const ATR_BODY = fill(fs.readFileSync(DIR + '/data/atrakcje.html','utf8'));

function atrakcjePage(){
  let body = ATR_BODY;
  // map old classes to new ones
  body = body.split('class="grid"').join('class="agrid"');
  body = body.split('class="acard"').join('class="acard"'); // same
  // section headings -> stitle
  body = body.replace(/<h2 id="([^"]+)">([^<]+)<\/h2>/g,'<h2 id="$1" class="stitle" style="scroll-margin-top:80px">$2</h2>');
  const toc = `<nav class="toc" style="margin-bottom:18px">
    <a href="#guide-tips">Wskazówki przewodników</a><a href="#abuzabi">🕌 Abu Zabi</a><a href="#kioto">⛩️ Kioto</a><a href="#osaka">Osaka</a><a href="#tokio">🏙️ Tokio</a><a href="#hakone">♨️ Hakone</a>
    <a href="#praktyczne">🧳 Praktyczne</a><a href="#poza-planem">Poza planem</a></nav>`;
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
  <section id="guide-tips"><h2 class="stitle">Wskazówki przewodników w naszym planie</h2>
    <div class="card"><ul class="tips">
      <li><a href="days/2027-04-30.html">30.04: Fushimi, ramen, sjesta i Gion</a>. Ninomaru przeniesione na opcjonalne popołudnie zamiast Kiyomizu, nie jako kolejny zabytek.</li>
      <li><a href="days/2027-05-01.html">1.05: dzień w Osace</a>. <a href="#sushiro-esaka">Sushiro Esaka ze zdjęcia</a>, muzeum życia codziennego i Dōtonbori. <a href="#nara-variant">Nara zostaje alternatywą</a>.</li>
      <li><a href="days/2027-05-02.html">2.05: KOTO, Kinugasa i opcjonalne Nishiki</a>. Herbaciarnia ze zdjęcia zastępuje MAIKOYA. Sklep przy Ryōan-ji wskazany pinezką najprawdopodobniej to Kinugasa; warsztat pakowania wymaga uzgodnienia. Nie dokładamy kaligrafii.</li>
      <li>Wachlarze obejrzycie już w <a href="#kinugasa">Kinugasa</a>. <a href="#sensu">Miyawaki Baisenan</a> i <a href="#kura">Kura Sushi</a> to adresy zapasowe, bez obowiązkowych kolejnych zakupów i sushi.</li>
      <li><a href="#housing-living">Muzeum w Osace</a> jest wyborem domyślnym. <a href="#osaka-castle">Zamek</a> może je zastąpić, ale nie dopisujemy obu.</li>
      <li><a href="pogoda.html#kwitnienie">Kwitnienie i ogrody Tokio</a>: przegląd publikacji zimą, decyzja o konkretnym spacerze 48-72 godziny wcześniej. Bez obietnicy majowej sakury.</li>
    </ul><p class="note">Weryfikacja nowych wskazówek: 20.09.2026. Linki do źródeł są przy miejscach. Godziny na Golden Week 2027 i dostępność sesji wymagają ponownego sprawdzenia; niczego tu nie zarezerwowano.</p></div>
  </section>
  ${body}
  <p class="note" style="margin-top:16px">Starsze karty: orientacyjne dane z lipca 2026. Nowe wskazówki przewodników sprawdzone 20.09.2026; nie jest to potwierdzenie cenników ani godzin na 2027. Przed rezerwacją sprawdźcie strony oficjalne.</p>
  ${footer('')}`;
  return shell({title:'Atrakcje: godziny, ceny, rezerwacje · Japonia 2027',desc:'Katalog atrakcji wyjazdu do Japonii z godzinami, cenami i linkami do rezerwacji.',prefix:'',active:'atrakcje.html',inner,pillsIdx:null});
}

/* ============================ WRITE ============================ */
DAYS.forEach((d,i)=>page(`days/${d.date}.html`, dayPage(d,i)));
const ATR = atrakcjePage(); // read old before overwriting index (index doesn't touch atrakcje)
page('index.html', indexPage());
page('hotele.html', hotelePage());
page('decyzje.html', decyzjePage());
page('druk.html', drukPage());
page('loty.html', lotyPage());
page('koszty.html', kosztyPage());
page('pogoda.html', pogodaPage());
page('niezbednik.html', niezbednikPage());
/* ===== Rezerwacje poza stroną: private/rezerwacje.md -> samodzielny plik private/rezerwacje-offline.html.
   Plik nie trafia do repo ani na Vercel; zapisuje się go w telefonach dorosłych (AirDrop, Pliki). ===== */
{
  const srcP = DIR + '/private/rezerwacje.md';
  if (fs.existsSync(srcP)) {
    const e = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
    const lines = fs.readFileSync(srcP,'utf8').split('\n');
    const rows = lines.filter(l=>/^\|/.test(l) && !/^\|\s*-/.test(l)).map(l=>l.split('|').slice(1,-1).map(c=>e(c.trim())));
    const rest = lines.filter(l=>l.trim() && !/^\|/.test(l) && !/^#/.test(l)).map(l=>'<p>'+e(l)+'</p>').join('');
    const table = '<table><thead><tr>'+rows[0].map(c=>'<th>'+c+'</th>').join('')+'</tr></thead><tbody>'+rows.slice(1).map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
    fs.writeFileSync(DIR + '/private/rezerwacje-offline.html', '<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Rezerwacje · Japonia 2027</title><style>body{font:16px/1.5 -apple-system,system-ui,sans-serif;margin:0;padding:20px 16px;color:#15203a;background:#fff}h1{font-size:22px;margin:0 0 4px}p{margin:10px 0 0;font-size:14px}table{border-collapse:collapse;width:100%;font-size:14px;margin-top:14px}th,td{border-top:1px solid #d5d9e0;padding:9px 8px;text-align:left;vertical-align:top}th{font-size:12px;color:#5b6477}.w{overflow-x:auto}@media(prefers-color-scheme:dark){body{background:#10151f;color:#e8ebf2}th,td{border-color:#2b3445}th{color:#9aa4b8}}</style></head><body><h1>Rezerwacje · Japonia 2027</h1><p>Plik prywatny, działa bez internetu. Nie publikować.</p><div class="w">'+table+'</div>'+rest+'</body></html>');
  }
  fs.rmSync(DIR + '/rezerwacje.html', {force:true});
}

page('atrakcje.html', ATR);

/* ---- OFFLINE: service worker + manifest + ikona ----
   Cel: plan ma działać w Japonii bez zasięgu i bez roamingu.
   Strategia: przy instalacji cache'ujemy CAŁY serwis (strony + style + zdjęcia),
   potem serwujemy z cache i w tle odświeżamy (stale-while-revalidate).
   Mapy (Leaflet/OSM) i pogoda wymagają sieci — bez niej po prostu się nie pokażą. */
const PRECACHE = [
  './','index.html','decyzje.html','atrakcje.html','hotele.html','loty.html','koszty.html','pogoda.html','niezbednik.html','druk.html',
  'assets/style.css','assets/app.js','assets/icon.svg',
  ...DAYS.map(d=>`days/${d.date}.html`),
  ...[...new Set(Object.values(DAYIMG))].map(p=>p.replace(/^\//,'')),
  ...HOTELS.map(h=>`assets/img/hotels/${h.img||h.id+'.webp'}`),
];
/* Wersja cache = skrót TREŚCI wszystkich generowanych plików. Dzięki temu każda zmiana
   na stronie unieważnia cache, a brak zmian daje identyczny build (determinizm zachowany).
   Wersja oparta na dacie NIE działa — zmiany treści bez zmiany daty zostawiały starą stronę. */
const contentHash = crypto.createHash('sha1');
PRECACHE.filter(u=>u!=='./').forEach(u=>{ try{ contentHash.update(fs.readFileSync(DIR+'/'+u)); }catch(e){} });
const SWVER = contentHash.digest('hex').slice(0,10);
const SW = `/* Service worker planu Japonia 2027 — wersja ${SWVER} · HTML/CSS/JS network-first, obrazy cache-first */
const CACHE = 'jp2027-${SWVER}';
const PRECACHE = ${JSON.stringify(PRECACHE)};
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    // pojedyncze błędy nie mogą wywrócić instalacji
    return Promise.all(PRECACHE.map(function(u){return c.add(u).catch(function(){});}));
  }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
function store(req,res){ if(res && res.status===200){ var cp=res.clone(); caches.open(CACHE).then(function(c){c.put(req,cp);}); } return res; }
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method!=='GET') return;
  var url = new URL(req.url);
  if(url.origin !== location.origin) return;           // mapy, pogoda, Google — tylko z sieci
  var isDoc  = req.mode==='navigate' || req.destination==='document' || /\\.html$|\\/$/.test(url.pathname);
  var isCode = /assets\\/(style\\.css|app\\.js)$/.test(url.pathname);
  if(isDoc || isCode){
    // NETWORK FIRST: strona i kod zawsze świeże; cache tylko gdy nie ma sieci
    e.respondWith(fetch(req).then(function(res){ return store(req,res); }).catch(function(){
      return caches.match(req).then(function(hit){ return hit || caches.match('index.html'); });
    }));
    return;
  }
  // obrazy, ikony, manifest: CACHE FIRST z odświeżaniem w tle
  e.respondWith(caches.match(req).then(function(hit){
    var net = fetch(req).then(function(res){ return store(req,res); }).catch(function(){ return hit; });
    return hit || net;
  }));
});
`;
fs.writeFileSync(DIR + '/sw.js', SW);

fs.writeFileSync(DIR + '/manifest.webmanifest', JSON.stringify({
  name:'Japonia 2027 — plan podróży', short_name:'Japonia 2027',
  description:'Plan rodzinnego wyjazdu do Japonii 27 kwietnia – 8 maja 2027.',
  start_url:'./index.html', scope:'./', display:'standalone',
  background_color:'#f5f1e8', theme_color:'#0f1c2e', lang:'pl',
  icons:[{src:'assets/icon.svg', sizes:'any', type:'image/svg+xml', purpose:'any maskable'}]
}, null, 2));

/* ikona: czerwone koło (hinomaru) na granatowym tle — czytelne w małym rozmiarze */
fs.writeFileSync(DIR + '/assets/icon.svg',
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#0f1c2e"/><circle cx="256" cy="238" r="118" fill="#c8402c"/><text x="256" y="446" text-anchor="middle" font-family="Georgia,serif" font-size="86" fill="#b98a34">2027</text></svg>`);

console.log('OK · day pages:', DAYS.length, '· timeline items:', DAYS.reduce((a,d)=>a+d.tl.length,0),
  '· pc:', DAYS.filter(d=>d.pc).length);
