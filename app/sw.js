// Klassieke (niet-module) service worker: cachet de app-bestanden zodat alles ook
// zonder internet werkt, en zodat de app blijft werken als onze eigen website plat ligt.
// VERSIE moet gelijk zijn aan js/versie.js (bewaakt door tests/unit/sw.test.mjs).
const VERSIE = '1.2.0';
const CACHE_NAAM = `signaalwoorden-${VERSIE}`;

// Exact de bestanden onder app/ (plus './' voor de map zelf). Bij elke wijziging aan
// een bestand: VERSIE hier én in js/versie.js ophogen, en deze lijst bijwerken.
const PRECACHE = [
  './',
  './index.html',
  './leerkracht.html',
  './handleiding.html',
  './manifest.webmanifest',
  './css/app.css',
  './css/handleiding.css',
  './js/leerling.js',
  './js/leerkracht.js',
  './js/handleiding.js',
  './js/sw-register.js',
  './js/soorten.js',
  './js/zin.js',
  './js/codec.js',
  './js/set.js',
  './js/ronde.js',
  './js/opties.js',
  './js/dieren.js',
  './js/datum.js',
  './js/versie.js',
  './data/beginset.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAAM).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE_NAAM).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

// Cache-first: eerst uit de cache, anders het netwerk (en dan bijwerken voor de volgende keer).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // nooit vreemde origins cachen

  event.respondWith(
    caches.match(event.request).then((gecached) => {
      if (gecached) return gecached;
      return fetch(event.request)
        .then((respons) => {
          if (respons.ok) {
            const kopie = respons.clone();
            caches.open(CACHE_NAAM).then((cache) => cache.put(event.request, kopie));
          }
          return respons;
        })
        .catch(() => gecached);
    }),
  );
});
