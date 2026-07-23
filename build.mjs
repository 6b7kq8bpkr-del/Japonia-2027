import fs from 'node:fs';
const DIR = '/Users/urban/Desktop/Piaskownica/japonia-2027';
fs.mkdirSync(DIR + '/days', { recursive: true });
fs.mkdirSync(DIR + '/assets', { recursive: true });

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
(function(){
  var geoEl=document.getElementById('geo'); if(!geoEl) return;
  var btn=document.getElementById('mapActivate'), mapDiv=document.getElementById('map');
  if(!btn||!mapDiv) return;
  btn.addEventListener('click',function(){
    btn.style.display='none'; mapDiv.style.display='block';
    ensureLeaflet(function(){ render(JSON.parse(geoEl.textContent)); });
  });
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
{id:'hakone',name:'Hakone Kowakien TEN-YU',stay:'Hakone · 1 noc (7–8.05) · prywatny onsen',
 desc:'Wyższa półka na jedyną noc, gdy nocleg JEST atrakcją: nowoczesny luksusowy ryokan, w którym pokoje mają PRYWATNĄ odkrytą kąpiel onsen (rotenburo) na tarasie — kąpiel o każdej porze, bez wspólnych łaźni. Wielodaniowe kaiseki, przyjazny rodzinom, na pętli Hakone przy Gōrze. Alternatywa z widokiem na dolinę: Hakone Ginyu. Zdjęcie: przykładowy rotenburo.',
 price:'~2 400–3 200 zł/noc z HB dla 4 os. (wyższa półka)',near:'rejon Gōra, na pętli Hakone',
 site:'https://www.hakone-tenyu.com/en/'},
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

/* ============================ TEMPLATES ============================ */
const TABS = [['index.html','Plan'],['decyzje.html','Dlaczego'],['atrakcje.html','Atrakcje'],['hotele.html','Hotele'],['koszty.html','Koszty'],['pogoda.html','Pogoda']];
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
</head>
<body>
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
  const hid = DAYHOTEL[d.date];
  const hotelBox = hid ? (()=>{const H=HOTELS.find(h=>h.id===hid);
    return `<a class="hotelbox" href="../hotele.html#${H.id}">🏨 <span><b>Nocleg: ${H.name}</b> — szczegóły, cena i kod QR do mapy →</span></a>`;})() : '';
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
  <header class="hero" style="background:${heroBg(d.city, DAYIMG[d.date])}">
    <p class="eyebrow">Dzień ${i+1} z ${DAYS.length} · ${d.dow} · ${d.dd}</p>
    <h1>${d.title}</h1>
    <p class="lead">${d.lead}</p>
    <div class="chips">${d.chips.map(c=>`<span class="chip">${c}</span>`).join('')}</div>
  </header>

  <section>
    <h2 class="stitle">Plan dnia</h2>
    <div class="card"><ul class="tline">${tl}</ul></div>
  </section>

  <section>
    <h2 class="stitle">W skrócie</h2>
    <div class="facts">${facts}</div>
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
  const cards = DAYS.map((d,i)=>`<a class="dcard" href="days/${d.date}.html" style="background:${cardBg(d.city, DAYIMG[d.date])}">
    <div class="dn">${i+1}</div>
    <div class="dd">${d.dow} · ${d.dd}</div>
    <div class="dt">${d.title}</div>
  </a>`).join('');
  const quick = `<div class="quick">
    <a class="qcard" href="decyzje.html"><div class="qi">🧭</div><div class="qh">Dlaczego tak?</div><div class="qd">Logika planu: rytm, decyzje i jak go modyfikować.</div></a>
    <a class="qcard" href="atrakcje.html"><div class="qi">🎟️</div><div class="qh">Atrakcje</div><div class="qd">Godziny, ceny i linki do rezerwacji — 32 miejsca.</div></a>
    <a class="qcard" href="hotele.html"><div class="qi">🏨</div><div class="qh">Hotele</div><div class="qd">5 baz na 11 nocy, pokoje rodzinne + QR do map.</div></a>
    <a class="qcard" href="koszty.html"><div class="qi">💴</div><div class="qh">Bilety i koszty</div><div class="qd">Strategia zakupu lotów, progi cen i kalkulator budżetu.</div></a>
    <a class="qcard" href="pogoda.html"><div class="qi">☀️</div><div class="qh">Pogoda i pakowanie</div><div class="qd">Czego się spodziewać w maju i co zabrać.</div></a>
  </div>`;
  const inner = `
  <header class="hero" style="background:linear-gradient(120deg,rgba(27,58,107,.56),rgba(138,43,35,.40)),url('${IMG.fuji}') center/cover">
    <p class="eyebrow">Plan rodzinny · 2+2 · 13 dni</p>
    <h1>Japonia 2027</h1>
    <p class="lead">3–15 maja 2027 · Abu Zabi (stopover) – Tokio – Hakone – Kioto – Osaka. Klasyka pierwszego razu z odrobiną tradycyjnej kultury, Pokémonami dla dzieci i turniejem sumo na finał.</p>
    <div class="chips"><span class="chip">✈️ Etihad</span><span class="chip">🕌 noc w Abu Zabi gratis</span><span class="chip">🏨 11 nocy</span><span class="chip">🥋 turniej sumo</span><span class="chip">♨️ ryokan z onsenem</span></div>
  </header>

  <section>
    <h2 class="stitle">Dzień po dniu</h2>
    <p class="lead-p">Kliknij dowolny dzień, żeby zobaczyć plan godzinowy, wskazówki i „w skrócie". Golden Week kończy się 5 maja, więc główne przejazdy robimy już po szczycie tłumów.</p>
    <div class="dgrid">${cards}</div>
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
  <header class="hero" style="background:linear-gradient(135deg,#122740,#2f6d4f)">
    <p class="eyebrow">Bilety lotnicze i budżet</p>
    <h1>Bilety i koszty</h1>
    <p class="lead">Ceny Etihad WAW→Tokio falują o ±30% w skali tygodnia. Poniżej progi „kup / czekaj", kalendarz wyprzedaży i kalkulator budżetu dla całej rodziny.</p>
  </header>

  <section>
    <h2 class="stitle">Strategia biletowa</h2>
    <div class="pflag">✈️ <span><b>Lot dziś (23.07.2026): ok. 13 900 zł</b> za 4 os. (Etihad) — cena faluje 13,9–18 tys.</span></div>
    ${seg('🎯 Progi decyzyjne (4 os., w obie strony, z bagażem)',['<b>≤ 13 000 zł</b> — okazja, kupować natychmiast','<b>13–15 tys. zł</b> — cena uczciwa, można kupić dla pewności miejsc','<b>≥ 16 tys. zł</b> — górka, czekać na wyprzedaż'])}
    ${seg('🗓️ Kalendarz polowania',['<b>~20.11–2.12.2026</b> — Black Friday Etihad/Qatar (historycznie do −35%, podróże do 30.06)','<b>22.12.2026 – poł. stycznia 2027</b> — Qatar Travel Festival + Etihad January Sale','<b>Koniec stycznia 2027</b> — twardy deadline zakupu (4 miejsca w jednej rezerwacji znikają szybko)','Plan B: Air China z Warszawy przez Pekin (~3,3–4 tys. zł/os, bagaż w cenie)','Bilet kupujemy jako Etihad ze stopoverem: nocleg 4★ w Abu Zabi gratis (postój >24 h, pakiet na etihad.com ≥3 dni przed; przy zakupie potwierdzić, że promocja obejmuje maj 2027 i że multi-city nie podnosi taryfy)'])}
    ${seg('🔔 Aktywne alerty',['Google Flights — monitoring ceny 3→15.05 (mail przy zmianie)','Automatyczne kontrole Claude: 1.10, 20.11, 22.12.2026 oraz 12.01 i 25.01.2027','Do dołożenia ręcznie: alert w Kayak + obserwacja fly4free.pl (tag Tokio)'])}
  </section>

  <section>
    <h2 class="stitle">Kalkulator kosztów</h2>
    <p class="lead-p">Szacunek dla <b>4 osób</b> na cały wyjazd. Wszystkie pola możesz edytować — suma liczy się na bieżąco, a zmiany zapisują się w przeglądarce.</p>
    <div class="card calc">
      <table>
        <thead><tr><th>Kategoria</th><th style="text-align:right">Ilość / stawka</th><th style="text-align:right">Kwota (zł)</th></tr></thead>
        <tbody>
          <tr><td class="cat">✈️ Loty<span class="hint">Etihad, całość za 4 os. (+ bagaż)</span></td><td class="num">—</td><td class="num"><input type="number" id="flights" value="14000" min="0" step="100"></td></tr>
          <tr><td class="cat">🏨 Noclegi<span class="hint">średnia z 10 nocy: aparthotele ~820 zł + 1 noc ryokan z prywatnym onsenem ~2 700 zł (Abu Zabi gratis)</span></td><td class="num"><input type="number" id="nights" class="sm" value="10" min="0"><span class="x">×</span><input type="number" id="nightRate" class="sm" value="1000" min="0" step="10"></td><td class="num" id="hotelAmt">—</td></tr>
          <tr><td class="cat">🚄 Transport w Japonii<span class="hint">shinkanseny + metro + NEX</span></td><td class="num">—</td><td class="num"><input type="number" id="transport" value="4000" min="0" step="100"></td></tr>
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
    var D={flights:14000,nights:10,nightRate:1000,transport:4000,days:13,foodRate:500,attractions:2600,extras:3000};
    var ids=Object.keys(D),KEY="jp2027.calc";
    var fmt=function(n){return Math.round(n).toLocaleString("pl-PL")+" zł";};
    function num(id){var v=parseFloat(document.getElementById(id).value);return isNaN(v)?0:v;}
    function css(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
    try{var s=JSON.parse(localStorage.getItem(KEY))||{};ids.forEach(function(id){if(s[id]!=null)document.getElementById(id).value=s[id];});}catch(e){}
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
      var o={};ids.forEach(function(id){o[id]=num(id);});try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}
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
        <div class="links"><a href="${gmapsQ(H.name)}" target="_blank" rel="noopener">Google Maps →</a><a href="${H.site}" target="_blank" rel="noopener">strona hotelu →</a></div>
      </div>
      <a class="hphoto" href="${H.id==='auh'?H.site:gmapsQ(H.name)}" target="_blank" rel="noopener">
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
  <header class="hero" style="background:linear-gradient(120deg,rgba(27,58,107,.58),rgba(18,39,64,.40)),url('${IMG.tokyostation}') center/cover">
    <p class="eyebrow">Noclegi · 10 nocy w Japonii + gratis Abu Zabi · pokoje rodzinne 4-os.</p>
    <h1>Hotele</h1>
    <p class="lead">Pięć baz w Japonii pod rodzinę 2+2 (aparthotele MIMARU i ryokan z onsenem) plus darmowa noc stopover w Abu Zabi od Etihadu. Kliknij zdjęcie hotelu, aby otworzyć jego lokalizację w Google Maps.</p>
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
  <header class="hero" style="background:linear-gradient(120deg,rgba(27,58,107,.62),rgba(200,64,44,.5)),url('${IMG.fushimi}') center/cover">
    <p class="eyebrow">Zrozum i zmień plan</p>
    <h1>Dlaczego tak?</h1>
    <p class="lead">Cała logika za tym planem w jednym miejscu — co jest stałe, co możesz ruszyć i jak. Żebyście modyfikowali go świadomie, nie na wyczucie.</p>
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
function pogodaPage(){
  const rows=[
    ['🏙️ Tokio','~23°C','~14°C','przyjemnie, słonecznie; sporadyczny przelotny deszcz'],
    ['♨️ Hakone (góry)','~19°C','~10°C','chłodniej i wilgotniej — weź ciepłą warstwę; Fudżi najlepiej widać rano'],
    ['⛩️ Kioto / Nara','~25°C','~14°C','cieplej niż w Tokio; w kotlinie w słońcu bywa parno'],
    ['🏯 Osaka','~25°C','~15°C','ciepło, miejsko; wieczory łagodne'],
    ['🕌 Abu Zabi (stopover)','35–40°C','~26°C','upał! zwiedzanie rano, w południe klimatyzacja (Luwr), dużo wody'],
  ].map(r=>`<tr><td class="cat">${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td>${r[3]}</td></tr>`).join('');
  const inner=`
  <header class="hero" style="background:linear-gradient(120deg,rgba(31,94,90,.56),rgba(18,44,42,.42)),url('${IMG.fuji}') center/cover">
    <p class="eyebrow">Klimat i pakowanie</p>
    <h1>Pogoda w maju</h1>
    <p class="lead">Maj to jeden z najlepszych miesięcy na Japonię: ciepło, słonecznie i sucho — przed sezonem deszczowym, który na głównej wyspie zaczyna się dopiero w czerwcu.</p>
  </header>
  <section>
    <h2 class="stitle">Typowe temperatury</h2>
    <div class="wxwrap"><table>
      <thead><tr><th>Region</th><th style="text-align:right">Dzień</th><th style="text-align:right">Noc</th><th>Uwaga</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <p class="note" style="margin-top:10px">Wartości to średnie klimatyczne — dokładna prognoza na 2027 pojawi się bliżej wyjazdu.</p>
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
  <header class="hero" style="background:linear-gradient(120deg,rgba(138,43,35,.56),rgba(70,32,20,.42)),url('${IMG.sensoji}') center/cover">
    <p class="eyebrow">Godziny · ceny · rezerwacje</p>
    <h1>Atrakcje</h1>
    <p class="lead">Wszystkie miejsca z planu w jednym katalogu — z godzinami, orientacyjnymi cenami (¥100 ≈ 2,6 zł) i linkami do oficjalnych rezerwacji.</p>
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
fs.writeFileSync(DIR + '/koszty.html', kosztyPage());
fs.writeFileSync(DIR + '/pogoda.html', pogodaPage());
fs.writeFileSync(DIR + '/atrakcje.html', ATR);

console.log('OK · day pages:', DAYS.length, '· timeline items:', DAYS.reduce((a,d)=>a+d.tl.length,0),
  '· pc:', DAYS.filter(d=>d.pc).length);
