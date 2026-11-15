// Service worker: makes Astronaut Vitals work offline after the first visit.
// Same-origin files: network first (so updates, e.g. the real engine, arrive),
// falling back to cache when offline. CDN files (Chart.js): cache first.
// AI-generated code (Claude) — see README "AI tools used".

const CACHE = 'astronaut-vitals-v2';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/styles/main.css',
  './src/ui/app.js',
  './src/ui/engine.js',
  './src/ui/body.js',
  './src/ui/charts.js',
  './src/ui/stubs.js',
  './src/ui/logic.js',
  './icons/icon.svg',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
];
// Files owned by the logic branch; cached if present, skipped if not yet created.
const OPTIONAL = ['./src/engine/evaluate.js', './config/thresholds.json'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all([...CORE, ...OPTIONAL].map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res.ok) await cache.put(url, res);
      } catch (_) { /* offline during install or missing optional file */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Let the browser stream media (range requests) and the demo page directly.
  if (req.headers.has('range') || /\.(mp4|webm)$/i.test(url.pathname) || url.pathname.includes('/demo/')) return;

  if (url.origin !== self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    })());
    return;
  }

  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    } catch (_) {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const shell = await caches.match('./index.html');
        if (shell) return shell;
      }
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});
