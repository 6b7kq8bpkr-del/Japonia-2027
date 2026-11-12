/* Service worker planu Japonia 2027 — wersja 15e7a7af88 · HTML/CSS/JS network-first, obrazy cache-first */
const CACHE = 'jp2027-15e7a7af88';
const PRECACHE = ["./","index.html","decyzje.html","atrakcje.html","hotele.html","loty.html","koszty.html","pogoda.html","niezbednik.html","druk.html","pokaz.html","assets/pokaz.css","assets/pokaz.js","assets/style.css","assets/app.js","assets/icon.svg","days/2027-04-27.html","days/2027-04-28.html","days/2027-04-29.html","days/2027-04-30.html","days/2027-05-01.html","days/2027-05-02.html","days/2027-05-03.html","days/2027-05-04.html","days/2027-05-05.html","days/2027-05-06.html","days/2027-05-07.html","assets/img/p/abudhabi.webp","assets/img/p/abudhabi-s.webp","assets/img/mosque.webp","assets/img/p/shinkansen.webp","assets/img/p/shinkansen-s.webp","assets/img/p/fushimi.webp","assets/img/p/fushimi-s.webp","assets/img/p/deer.webp","assets/img/p/deer-s.webp","assets/img/p/kinkakuji.webp","assets/img/p/kinkakuji-s.webp","assets/img/p/sensoji.webp","assets/img/p/sensoji-s.webp","assets/img/p/shibuya.webp","assets/img/p/shibuya-s.webp","assets/img/p/pokemon.webp","assets/img/p/pokemon-s.webp","assets/img/p/fuji.webp","assets/img/p/fuji-s.webp","assets/img/p/nex.webp","assets/img/p/nex-s.webp","assets/img/hotels/auh.webp","assets/img/hotels/kioto.webp","assets/img/hotels/tokio1.webp","assets/img/hotels/hakone-ashi.webp"];
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    // Pojedynczy błąd nie może wywrócić instalacji ani zostawić dziury: gdy pliku nie da się pobrać,
    // przenosimy jego poprzednią kopię ze starej pamięci, zanim zostanie ona usunięta przy aktywacji.
    return Promise.all(PRECACHE.map(function(u){return c.add(u).catch(function(){
      return caches.match(u,{ignoreSearch:true}).then(function(old){ if(old) return c.put(u,old); });
    });}));
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
  var isDoc  = req.mode==='navigate' || req.destination==='document' || /\.html$|\/$/.test(url.pathname);
  var isCode = /assets\/(style\.css|app\.js|pokaz\.css|pokaz\.js)$/.test(url.pathname);
  if(isDoc || isCode){
    // NETWORK FIRST: strona i kod zawsze świeże; cache tylko gdy nie ma sieci
    e.respondWith(fetch(req).then(function(res){ return store(req,res); }).catch(function(){
      return caches.match(req,{ignoreSearch:true}).then(function(hit){ return hit || caches.match('index.html'); });
    }));
    return;
  }
  // obrazy, ikony, manifest: CACHE FIRST z odświeżaniem w tle
  e.respondWith(caches.match(req).then(function(hit){
    var net = fetch(req).then(function(res){ return store(req,res); }).catch(function(){ return hit; });
    return hit || net;
  }));
});
