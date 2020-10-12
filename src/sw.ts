import fs from 'fs'
import path from 'path'
import PWAWebpackPlugin from './index'

// 拼接文件内容
const template = (plugin: PWAWebpackPlugin): string => {
  return `const cacheList = ${JSON.stringify(plugin.cacheList)}
          const skipWaiting = ${plugin.skipWaiting}
          self.addEventListener('install', event => {
            event.waitUntil(
              caches.open('${
                plugin.cacheStorageName
              }').then(cache => cache.addAll(cacheList))
            )
            skipWaiting && self.skipWaiting()
          })

          self.addEventListener('activate', event => {
            event.waitUntil(new Promise((resolve, reject) => {
              try {
                caches.keys().then(keyList => Promise.all(
                  keyList.map(key => !cacheList.includes(key) && caches.delete(key))
                ))
                skipWaiting && clients.claim()
                resolve()
              } catch (err) {
                reject(err)
              }
            }))
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
