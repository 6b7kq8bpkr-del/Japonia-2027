/* Service worker planu Japonia 2027 — wersja a6833c8dbd · HTML/CSS/JS network-first, obrazy cache-first */
const CACHE = 'jp2027-a6833c8dbd';
const PRECACHE = ["./","index.html","decyzje.html","atrakcje.html","hotele.html","loty.html","koszty.html","pogoda.html","niezbednik.html","druk.html","druk-skrot.html","pokaz.html","druga-para.html","assets/pokaz.css","assets/pokaz.js","assets/style.css","assets/app.js","assets/icon.svg","days/2027-04-27.html","days/2027-04-28.html","days/2027-04-29.html","days/2027-04-30.html","days/2027-05-01.html","days/2027-05-02.html","days/2027-05-03.html","days/2027-05-04.html","days/2027-05-05.html","days/2027-05-06.html","days/2027-05-07.html","assets/img/p/abudhabi.webp","assets/img/p/abudhabi-s.webp","assets/img/mosque.webp","assets/img/p/shinkansen.webp","assets/img/p/shinkansen-s.webp","assets/img/p/fushimi.webp","assets/img/p/fushimi-s.webp","assets/img/p/deer.webp","assets/img/p/deer-s.webp","assets/img/p/kinkakuji.webp","assets/img/p/kinkakuji-s.webp","assets/img/p/sensoji.webp","assets/img/p/sensoji-s.webp","assets/img/p/shibuya.webp","assets/img/p/shibuya-s.webp","assets/img/p/pokemon.webp","assets/img/p/pokemon-s.webp","assets/img/p/fuji.webp","assets/img/p/fuji-s.webp","assets/img/p/nex.webp","assets/img/p/nex-s.webp","assets/img/hotels/auh.webp","assets/img/hotels/kioto.webp","assets/img/hotels/tokio1.webp","assets/img/hotels/hakone-ashi.webp","assets/img/p/abudhabi.webp","assets/img/p/mosquealley.webp","assets/img/p/louvre.webp","assets/img/p/nex.webp","assets/img/p/shinkansen.webp","assets/img/p/kyotostation.webp","assets/img/p/fushimi.webp","assets/img/p/kiyomizu.webp","assets/img/p/yasaka.webp","assets/img/p/deer.webp","assets/img/p/todaiji.webp","assets/img/p/mochi.webp","assets/img/p/kinkakuji.webp","assets/img/p/tea.webp","assets/img/p/furoshiki.webp","assets/img/p/nishiki.webp","assets/img/p/sensoji.webp","assets/img/p/sumo.webp","assets/img/p/meiji.webp","assets/img/p/harajuku.webp","assets/img/p/shibuya.webp","assets/img/p/pokemon.webp","assets/img/p/teamlab.webp","assets/img/p/akihabara.webp","assets/img/p/romancecar.webp","assets/img/p/hakonetozan.webp","assets/img/p/owakudani.webp","assets/img/p/ashi.webp","assets/img/p/fuji.webp"];
const BUILD = '4f7949e';
const CRITICAL = PRECACHE.filter(u=>/\.html$|assets\/(style\.css|app\.js|pokaz\.css|pokaz\.js)$/.test(u));
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    // Pojedynczy błąd nie może wywrócić instalacji ani zostawić dziury: gdy pliku nie da się pobrać,
    // przenosimy jego poprzednią kopię ze starej pamięci, zanim zostanie ona usunięta przy aktywacji.
    var failed=[];return Promise.all(PRECACHE.map(function(u){return c.add(u).catch(function(){ failed.push(u);
      return caches.match(u,{ignoreSearch:true}).then(function(old){ if(old) return c.put(u,old); });
    });})).then(function(){return c.put('/offline-status.json',new Response(JSON.stringify({build:BUILD,savedAt:new Date().toISOString(),ready:!CRITICAL.some(u=>failed.includes(u)),missing:failed}),{headers:{'Content-Type':'application/json'}}));});
  }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k.startsWith('jp2027-')&&k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener('message',function(e){if(e.data==='offline-status'&&e.ports[0]) e.waitUntil(caches.open(CACHE).then(c=>c.match('/offline-status.json')).then(r=>r?r.json():null).then(s=>e.ports[0].postMessage(s)));});
function store(req,res){ if(res && res.status===200){ var cp=res.clone(); caches.open(CACHE).then(function(c){c.put(req,cp);}); } return res; }
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method!=='GET') return;
  var url = new URL(req.url);
  if(url.pathname.startsWith('/api/')||url.pathname==='/rezerwacje.html') return;
  if(url.origin !== location.origin) return;           // mapy, pogoda, Google — tylko z sieci
  var isDoc  = req.mode==='navigate' || req.destination==='document' || /\.html$|\/$/.test(url.pathname);
  var isCode = /assets\/(style\.css|app\.js|pokaz\.css|pokaz\.js)$/.test(url.pathname);
  if(isDoc || isCode){
    // NETWORK FIRST: strona i kod zawsze świeże; cache tylko gdy nie ma sieci
    e.respondWith((async function(){
      var controller = new AbortController(), timer = setTimeout(function(){controller.abort();},5000);
      try { var response=await fetch(req,{signal:controller.signal}); if(response.status>=500) throw new Error('server unavailable'); return store(req,response); }
      catch { var hit = await caches.match(req,{ignoreSearch:true});
        if(hit) return hit;
        if(isDoc) return (await caches.match('index.html')) || new Response('Brak zapisanej strony. Połącz się z internetem.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
        return new Response('',{status:503});
      } finally { clearTimeout(timer); }
    })());
    return;
  }
  // obrazy, ikony, manifest: CACHE FIRST z odświeżaniem w tle
  e.respondWith(caches.match(req).then(function(hit){
    var net = fetch(req).then(function(res){ return store(req,res); }).catch(function(){ return hit; });
    return hit || net;
  }));
});
