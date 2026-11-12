
(function(){
  document.addEventListener('DOMContentLoaded',function(){
    var button=document.getElementById('timelineToggle');
    if(!button)return;
    var items=Array.from(document.querySelectorAll('.tline details'));
    function sync(){var all=items.length>0&&items.every(function(d){return d.open;});button.textContent=all?'Zwiń szczegóły':'Rozwiń szczegóły';button.setAttribute('aria-expanded',String(all));}
    button.addEventListener('click',function(){var open=!items.every(function(d){return d.open;});items.forEach(function(d){d.open=open;});sync();});
    items.forEach(function(d){d.addEventListener('toggle',sync);});
  });
})();
document.addEventListener('keydown',function(e){
  if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,button,summary,[contenteditable],#map')) return;
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
if(cd){var days=Math.max(0,Math.ceil((new Date('2027-04-27T00:00:00')-new Date())/86400000));cd.textContent=days;}
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
    var routeEl=document.getElementById('geo-route');
    var linePts=routeEl?JSON.parse(routeEl.textContent):pts;
    if(linePts.length>1) L.polyline(linePts,{color:'#c8402c',weight:3,dashArray:'6 6',opacity:.85}).addTo(map);
    map.fitBounds(pts,{padding:[34,34]});
    setTimeout(function(){map.invalidateSize();},80);
  }
})();

/* ---- kopiowanie japońskiego adresu (do pokazania taksówkarzowi) ---- */
(function(){
  document.querySelectorAll('.jpcopy').forEach(function(b){
    b.addEventListener('click',function(){
      var t=b.getAttribute('data-addr'), old=b.textContent;
      function done(){b.textContent='Skopiowano';b.classList.add('ok');
        setTimeout(function(){b.textContent=old;b.classList.remove('ok');},1600);}
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){});}
      else{var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();
           try{document.execCommand('copy');done();}catch(e){} a.remove();}
    });
  });
})();

/* ---- checklista rezerwacji (stan w localStorage) ---- */
(function(){
  var list=document.querySelector('.cklist'); if(!list) return;
  var KEY='jp2027.checklist.v2', boxes=[].slice.call(list.querySelectorAll('input[data-ck]'));
  var saved={}; try{
    var current=localStorage.getItem(KEY);
    saved=JSON.parse(current)||{};
    if(current===null){
      var old=JSON.parse(localStorage.getItem('jp2027.checklist'))||{};
      ['pass',null,'flight-total',null,'furoshiki','tea','sumo','rail','insurance','sky',null,'internet','vjw',null,'ic',null].forEach(function(id,i){if(id&&old[i])saved[id]=true;});
      localStorage.setItem(KEY,JSON.stringify(saved));
    }
  }catch(e){}
  function draw(){
    var done=0;
    boxes.forEach(function(b){
      var li=b.closest('li');
      if(b.checked){done++; li.classList.add('done');} else li.classList.remove('done');
    });
    var pct=boxes.length?Math.round(done/boxes.length*100):0;
    document.getElementById('ckcount').textContent=done+' / '+boxes.length;
    document.getElementById('ckfill').style.width=pct+'%';
    var next=boxes.filter(function(b){return !b.checked;})[0];
    document.getElementById('cknext').textContent = next
      ? 'następne: '+next.closest('li').querySelector('.ckwhat b').textContent
      : 'lista odhaczona - sprawdźcie potwierdzenia rezerwacji';
  }
  boxes.forEach(function(b,i){
    b.checked=!!saved[b.dataset.ck];
    b.addEventListener('change',function(){
      saved[b.dataset.ck]=b.checked;
      try{localStorage.setItem(KEY,JSON.stringify(saved));}catch(e){}
      draw();
    });
  });
  var rb=document.getElementById('ckreset');
  if(rb) rb.addEventListener('click',function(){
    boxes.forEach(function(b,i){b.checked=false; saved[b.dataset.ck]=false;});
    try{localStorage.setItem(KEY,JSON.stringify(saved));}catch(e){}
    draw();
  });
  draw();
})();

/* ---- pogoda na żywo (Open-Meteo) — wzorzec z planu Madery ---- */
(function(){
  var host=document.getElementById('livewx');
  if(!host) return;
  var LOC=[
    {n:'🕌 Abu Zabi',la:24.4539,lo:54.3773,tz:'Asia/Dubai'},
    {n:'⛩️ Kioto',la:35.0116,lo:135.7681,tz:'Asia/Tokyo'},
    {n:'Osaka',la:34.6937,lo:135.5023,tz:'Asia/Tokyo'},
    {n:'🏙️ Tokio',la:35.6723,lo:139.7367,tz:'Asia/Tokyo'},
    {n:'♨️ Hakone (jezioro Ashi)',la:35.2337,lo:139.0155,tz:'Asia/Tokyo'}
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
/* prognoza na konkretny dzień planu (Open-Meteo), widoczna ~16 dni przed */
(function(){var el=document.querySelector('.wxday');if(!el)return;
  var la=el.getAttribute('data-la'),lo=el.getAttribute('data-lo'),dt=el.getAttribute('data-date');if(!la||!lo||!dt)return;
  var diff=(new Date(dt+'T12:00:00')-new Date())/864e5;if(diff<-1||diff>15)return;
  var u='https://api.open-meteo.com/v1/forecast?latitude='+la+'&longitude='+lo+'&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date='+dt+'&end_date='+dt;
  function ico(c){return c===0?'☀️':c<=3?'⛅':(c===45||c===48)?'🌫️':(c>=51&&c<=57)?'🌦️':(c>=61&&c<=67)?'🌧️':(c>=71&&c<=77)?'🌨️':(c>=80&&c<=82)?'🌦️':c>=95?'⛈️':'☁️';}
  function lbl(c){return c===0?'bezchmurnie':c<=3?'częściowe zachmurzenie':(c===45||c===48)?'mgła':(c>=51&&c<=57)?'mżawka':(c>=61&&c<=67)?'deszcz':(c>=80&&c<=82)?'przelotny deszcz':c>=95?'burza':'zachmurzenie';}
  fetch(u).then(function(r){return r.json();}).then(function(j){var d=j.daily;if(!d||!d.time||!d.time.length)return;
    var c=d.weather_code[0],p=d.precipitation_probability_max[0];
    el.innerHTML='<b>🌤️ Prognoza na '+dt.slice(8)+'.'+dt.slice(5,7)+':</b> '+ico(c)+' '+lbl(c)+' · '+Math.round(d.temperature_2m_min[0])+'–'+Math.round(d.temperature_2m_max[0])+'°C · deszcz '+(p!=null?p+'%':'—')+(p>=50?' — <b>rozważcie plan „Jeśli pada”</b>':'');
    el.style.display='';}).catch(function(){});
})();

/* ---- kotwica wewnątrz zwiniętej sekcji: rozwiń ją i przewiń do celu ---- */
(function(){
  function reveal(){
    var id=decodeURIComponent((location.hash||'').slice(1)); if(!id) return;
    var el=document.getElementById(id); if(!el) return;
    var d=el.closest('details'), opened=false;
    while(d){ if(!d.open){ d.open=true; opened=true; } d=d.parentElement&&d.parentElement.closest('details'); }
    if(opened) el.scrollIntoView();
  }
  addEventListener('hashchange',reveal); reveal();
})();

/* ---- tryb „dziś”: w trakcie podróży strona główna pokazuje bieżący dzień i najbliższy krok,
   a oś czasu dnia zaznacza, gdzie jesteśmy. Podgląd: dopisz do adresu ?teraz=2027-04-30T02:00:00Z ---- */
(function(){
  var q=/[?&]teraz=([^&#]+)/.exec(location.search), now=q?new Date(decodeURIComponent(q[1])):new Date();
  if(isNaN(now)) return;
  var T=now.getTime();
  var START=Date.UTC(2027,3,26,22,0), LAND_AUH=Date.UTC(2027,3,27,15,35), DEP_AUH=Date.UTC(2027,3,28,17,25),
      DEP_NRT=Date.UTC(2027,4,7,9,0), HOME=Date.UTC(2027,4,8,4,50);
  if(T<START||T>HOME) return;
  // czas miejsca, w którym jest rodzina: Polska, potem ZEA, potem Japonia
  var off=T<LAND_AUH?2:(T<DEP_AUH?4:9), L=new Date(T+off*3600000).toISOString(), ds=L.slice(0,10), hm=L.slice(11,16);
  var inFlightHome=T>=DEP_NRT;
  function pick(steps){
    var cur=-1,next=-1;
    for(var i=0;i<steps.length;i++){ var t=steps[i][0]; if(!/^\d\d:\d\d$/.test(t)) continue;
      if(t<=hm) cur=i; else if(next<0) next=i; }
    return {cur:cur,next:next};
  }
  function el(tag,cls,text){ var e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; }
  var box=document.getElementById('dzis'), src=document.getElementById('agenda');
  if(box&&src){
    var days=[]; try{ days=JSON.parse(src.textContent); }catch(e){}
    var day=null; days.forEach(function(d){ if(d.d===ds) day=d; });
    if(inFlightHome){
      box.appendChild(el('p','eyebrow','W drodze do domu'));
      box.appendChild(el('h2',null,'Lądowanie w Warszawie w sobotę 8 maja o 06:50'));
      box.hidden=false;
    } else if(day){
      var p=pick(day.s);
      box.appendChild(el('p','eyebrow','Dziś · '+day.dd+' · '+hm+' czasu miejscowego'));
      var h=el('h2'), a=el('a',null,day.t); a.href='days/'+day.d+'.html'; h.appendChild(a); box.appendChild(h);
      var g=el('div','today-steps');
      function row(label,i){ if(i<0) return; var r=el('div'); r.appendChild(el('span',null,label)); r.appendChild(el('b',null,day.s[i][0]+' · '+day.s[i][1])); g.appendChild(r); }
      row('Teraz',p.cur); row('Następnie',p.next);
      if(g.children.length) box.appendChild(g);
      var l=el('a','today-link','Otwórz dzisiejszy plan →'); l.href='days/'+day.d+'.html#plan'; box.appendChild(l);
      box.hidden=false;
    }
  }
  var tl=document.querySelector('.tline[data-date]');
  if(tl&&!inFlightHome&&tl.getAttribute('data-date')===ds){
    var lis=[].slice.call(tl.children), steps=lis.map(function(li){ var tm=li.querySelector('.tm'); return [tm?tm.textContent.trim():'','']; });
    var pp=pick(steps);
    lis.forEach(function(li,i){
      if(i<pp.cur) li.classList.add('is-past');
      if(i===pp.cur||i===pp.next){
        li.classList.add(i===pp.cur?'is-now':'is-next');
        var hd=li.querySelector('summary')||li.querySelector('.bd');
        var tag=el('span','event-tag now',i===pp.cur?'teraz':'następnie'); hd.appendChild(tag);
        var d=li.querySelector('details'); if(d) d.open=true;
      }
    });
  }
})();
