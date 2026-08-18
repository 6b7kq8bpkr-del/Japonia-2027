/* Service worker planu Japonia 2027 — wersja d00641e1aa */
const CACHE = 'jp2027-d00641e1aa';
const PRECACHE = ["./","index.html","decyzje.html","atrakcje.html","hotele.html","loty.html","koszty.html","pogoda.html","niezbednik.html","druk.html","assets/style.css","assets/app.js","assets/icon.svg","days/2027-05-03.html","days/2027-05-04.html","days/2027-05-05.html","days/2027-05-06.html","days/2027-05-07.html","days/2027-05-08.html","days/2027-05-09.html","days/2027-05-10.html","days/2027-05-11.html","days/2027-05-12.html","days/2027-05-13.html","days/2027-05-14.html","days/2027-05-15.html","assets/img/abudhabi.webp","assets/img/mosque.webp","assets/img/sensoji.webp","assets/img/shibuya.webp","assets/img/fuji.webp","assets/img/yasaka.webp","assets/img/fushimi.webp","assets/img/kinkakuji.webp","assets/img/todaiji.webp","assets/img/bamboo.webp","assets/img/dotonbori.webp","assets/img/sumo.webp","assets/img/tokyostation.webp","assets/img/hotels/auh.webp","assets/img/hotels/tokio1.webp","assets/img/hotels/hakone.webp","assets/img/hotels/kioto.webp","assets/img/hotels/osaka.webp","assets/img/hotels/tokio2.webp"];
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
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method!=='GET') return;
  var url = new URL(req.url);
  if(url.origin !== location.origin) return;           // mapy, pogoda, Google — tylko z sieci
  e.respondWith(
    caches.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && res.status===200) caches.open(CACHE).then(function(c){c.put(req,res.clone());});
        return res;
      }).catch(function(){ return hit || caches.match('index.html'); });
      return hit || net;                                 // cache first, odświeżanie w tle
    })
  );
});
