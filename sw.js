// ── FUTSAL MANAGER — Service Worker v1 ─────────────────────────
// Cache todos os arquivos para funcionar offline

const CACHE = 'futsal-manager-v11';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './ui.js',
  './gameState.js',
  './globalSystems.js',
  './aiManager.js',
  './careerSystems.js',
  './matchEngine.js',
  './matchLive.js',
  './sounds.js',
  './dragdrop.js',
  './logos.js',
  './players.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&family=Nunito+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;1,400&display=swap'
];

// Instalar: cachear todos os assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      console.log('[SW] Cacheando assets...');
      return cache.addAll(ASSETS).catch(err => {
        console.warn('[SW] Alguns assets não cacheados:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Ativar: limpar caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first para assets locais, network-first para externos
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Fontes e APIs externas — network primeiro, cache como fallback
  if (url.hostname !== location.hostname && !url.hostname.includes('fonts.g')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Assets locais — cache primeiro
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback para index.html em caso de erro de navegação
        if (e.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
