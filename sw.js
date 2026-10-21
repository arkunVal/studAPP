const V='studium-v2',SHELL=['./','index.html','manifest.webmanifest','config.js','icon-192.png','icon-512.png'];
const SKIP=/\.supabase\.co$/;
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||SKIP.test(u.hostname))return;
  e.respondWith(caches.open(V).then(c=>c.match(r,{ignoreSearch:false}).then(hit=>{
    const net=fetch(r).then(res=>{if(res.ok||res.type==='opaque')c.put(r,res.clone());return res;})
      .catch(()=>hit||(r.mode==='navigate'?c.match('index.html'):Response.error()));
    return hit||net;
  })));
});
