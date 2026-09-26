// Service worker minimo: sin el, manifest.json no sirve para nada (el
// navegador exige uno para instalar la PWA de verdad) y abrir sin conexion
// simplemente falla en blanco.
//
// Estrategia deliberadamente simple, dos casos:
// - Navegacion (cargar una pagina) y /api/*: red primero. El contenido
//   cambia constantemente (noticias, marcador en directo, estadisticas);
//   servir una copia vieja por defecto seria peor que fallar. Si no hay
//   red, se cae a lo ultimo que haya en cache para esa URL exacta, o a la
//   portada si tampoco hay eso.
// - Estatico (css/js/img/manifest): cache primero + revalidar en segundo
//   plano ("stale-while-revalidate"). Esto es lo que hace que la web
//   cargue instantanea en visitas repetidas y funcione sin conexion.
//
// Sube CACHE_VERSION cuando se quiera forzar a los navegadores a soltar
// una cache vieja de golpe (no hace falta para cada despliegue: el
// revalidado en segundo plano ya mantiene el estatico al dia solo).
const CACHE_VERSION = 'v1';
const CACHE_NAME = `elrompearos-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/css/style.css',
  '/manifest.json',
  '/img/brand-mark.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // fuentes, CDN de logos, APIs externas: fuera

  if (request.mode === 'navigate' || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
