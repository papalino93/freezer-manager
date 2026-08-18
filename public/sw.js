// Service worker minimale: serve solo a rendere l'app installabile.
//
// Niente cache delle pagine HTML: sono personalizzate per chi è
// loggato (e per quale congelatore sta guardando), quindi metterle in
// cache condivisa rischierebbe di mostrare i dati di una persona a
// un'altra sullo stesso telefono. Cachiamo solo le icone, che sono
// asset pubblici e identici per tutti.
const CACHE_NAME = "congelatore-assets-v2";
const STATIC_ASSETS = ["/icon.svg", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Le richieste di navigazione (le pagine) vanno sempre e solo alla
  // rete: un Request in modalità "navigate" non può comunque essere
  // ripassato a fetch() da qui, e i dati devono sempre essere freschi.
  if (request.mode === "navigate" || request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !STATIC_ASSETS.includes(url.pathname)) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
