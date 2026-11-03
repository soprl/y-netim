const worker = self as unknown as ServiceWorkerGlobalScope;
const CACHE='ya-yonet-europe-v2.5.2';
const ASSETS=['./','./index.html','./assets/game.js','./expansion.css','./world-life.css','./assets/city-atlas.webp','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
worker.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'}))))));
worker.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')worker.skipWaiting();});
worker.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ya-yonet-europe-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>worker.clients.claim())));
worker.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==worker.location.origin)return;e.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(e.request);if(hit)return hit;try{return await fetch(e.request)}catch(err){if(e.request.mode==='navigate')return (await cache.match('./index.html'))||Response.error();return Response.error();}}));});
