import fs from 'fs'
import path from 'path'
import PWAWebpackPlugin from './index'

// 拼接文件内容
const template = (plugin: PWAWebpackPlugin): string => {
  return `const cacheList = ${JSON.stringify(plugin.cacheList)}
          const skipWaiting = ${plugin.skipWaiting}
          const cacheName = '${plugin.cacheStorageName}'

          async function clearOldResource () {
            const keyList = await caches.keys()
            for (const key of keyList.values()) {
              if (key !== cacheName) await caches.delete(key)
            }
            const cache = await caches.open(cacheName)
            const requests = await cache.keys()
            
            const full = cacheList.map(url => new Request(url).url)
            const old = requests.filter(request => !full.includes(request.url))

            await Promise.all(old.map(request => cache.delete(request.url)))
          }

          self.addEventListener('install', event => {
            event.waitUntil(
              caches.open(cacheName).then(cache => cache.addAll(cacheList))
            )
            skipWaiting && self.skipWaiting()
          })

          self.addEventListener('activate', event => {
            event.waitUntil(
              Promise.all([clearOldResource(), skipWaiting && self.clients.claim()])
            )
          })

          self.addEventListener('fetch', event => {
            event.respondWith(
              caches.match(event.request)
                    .then(res => res || fetch(event.request))
            )
          })`
}

export const writeServiceWorker = async (plugin: PWAWebpackPlugin) => {
  const str = template(plugin)

  const sw = path.join(plugin.webpackConfig.path, plugin.serviceWorkerFilename)

  fs.writeFileSync(sw, str, 'utf8')
}
