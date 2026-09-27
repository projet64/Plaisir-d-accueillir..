const CACHE="plaisir-accueillir-v01";
const CORE=["./","./index.html","./manifest.webmanifest"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
    const copy=resp.clone();
    if(e.request.method==="GET") caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
    return resp;
  }).catch(()=>caches.match("./index.html"))));
});