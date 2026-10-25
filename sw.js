const CACHE='rst-v12';
const FILES=['./','index.html','qrgen.js','jsQR.js','THIRD-PARTY-LICENSES.txt','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE)
    .then(c=>Promise.all(FILES.map(f=>fetch(new Request(f,{cache:'reload'})).then(r=>{if(r.ok)return c.put(f,r)}).catch(()=>{}))))
    .then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
// Network first (so updates show up), falling back to the saved copy when offline or slow.
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const res=await Promise.race([
        fetch(e.request.url,{cache:'no-cache'}),
        new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),3000))
      ]);
      if(res&&res.ok)cache.put(e.request,res.clone());
      return res;
    }catch(err){
      const hit=(await cache.match(e.request,{ignoreSearch:true}))||(e.request.mode==='navigate'?await cache.match('index.html'):null);
      return hit||Response.error();
    }
  })());
});
