/* Service worker planu Japonia 2027 — wersja e3e0d3b2a3 · HTML/CSS/JS network-first, obrazy cache-first */
const CACHE = 'jp2027-e3e0d3b2a3';
const PRECACHE = ["./","index.html","decyzje.html","atrakcje.html","hotele.html","loty.html","koszty.html","pogoda.html","niezbednik.html","druk.html","assets/style.css","assets/app.js","assets/icon.svg","days/2027-04-27.html","days/2027-04-28.html","days/2027-04-29.html","days/2027-04-30.html","days/2027-05-01.html","days/2027-05-02.html","days/2027-05-03.html","days/2027-05-04.html","days/2027-05-05.html","days/2027-05-06.html","days/2027-05-07.html","assets/img/fushimi.webp","assets/img/todaiji.webp","assets/img/abudhabi.webp","assets/img/mosque.webp","assets/img/yasaka.webp","assets/img/akihabara.webp","assets/img/shibuya.webp","assets/img/fuji.webp","assets/img/sensoji.webp","assets/img/bamboo.webp","assets/img/tokyostation.webp","assets/img/hotels/auh.webp","assets/img/hotels/kioto.webp","assets/img/hotels/tokio1.webp","assets/img/hotels/hakone-ashi.webp"];
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
  var isDoc  = req.mode==='navigate' || req.destination==='document' || /\.html$|\/$/.test(url.pathname);
  var isCode = /assets\/(style\.css|app\.js)$/.test(url.pathname);
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
