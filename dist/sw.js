"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceWorkerTemplate = (plugin) => {
    return `const cacheList = ${JSON.stringify(plugin.cacheList)}
          const skipWaiting = ${plugin.options.skipWaiting}
          const cacheName = '${plugin.options.cacheStorageName}'

          async function cleanUp () {
            const keys = await caches.keys()
            for (const key of keys) {
              if (key !== cacheName) await caches.delete(key)
            }
            const cache = await caches.open(cacheName)
            const requests = await cache.keys()
            
            const resource = new Set(cacheList.map(url => new Request(url).url))

            const needCleanList = requests.filter(request => !resource.has(request.url))

            return Promise.all(needCleanList.map(request => cache.delete(request.url)))
          }

          self.addEventListener('install', event => {
            event.waitUntil(
              caches.open(cacheName).then(cache => cache.addAll(cacheList))
            )
            skipWaiting && self.skipWaiting()
          })

          self.addEventListener('activate', event => {
            event.waitUntil(
              Promise.all([cleanUp(), skipWaiting && self.clients.claim()])
            )
          })

          self.addEventListener('fetch', event => {
            event.respondWith(
              caches.match(event.request)
                    .then(res => res || fetch(event.request))
            )
          })`;
};
