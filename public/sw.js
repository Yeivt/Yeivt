// Only this explicit list of public, non-personal resources can enter CacheStorage.
const CACHE = 'misterio-public-v1';
const PUBLIC_PATHS = [
  '/', '/templos/', '/privacidad/', '/manifest.webmanifest', '/icon.svg',
  '/icons/icon-192.png', '/icons/icon-512.png',
  '/oraciones/ave-maria/', '/oraciones/salve/', '/oraciones/rosario/',
  '/oraciones/angelus/', '/oraciones/bajo-tu-amparo/', '/oraciones/acuerdate/', '/oraciones/magnificat/',
  ...Array.from({ length: 7 }, (_, i) => `/images/maria-${i + 1}.svg`),
];
const PUBLIC_SET = new Set(PUBLIC_PATHS);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PUBLIC_PATHS);
    // Astro's hashed CSS/JS referenced by public HTML is required offline too.
    for (const path of PUBLIC_PATHS.filter(path => path.endsWith('/'))) {
      const response = await cache.match(path);
      const html = await response.text();
      const assets = [...html.matchAll(/(?:src|href)="(\/_astro\/[^"?#]+\.(?:css|js))"/g)].map(match => match[1]);
      if (assets.length) await cache.addAll([...new Set(assets)]);
    }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('misterio-public-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.search) return;
  if (!PUBLIC_SET.has(url.pathname) && !/^\/_astro\/[^/]+\.(css|js)$/.test(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch {
      return await cache.match(event.request) || new Response('Necesitas conexión para abrir esta página.', { status: 503 });
    }
  })());
});
