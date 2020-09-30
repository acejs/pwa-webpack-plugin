import fs from 'fs'
import path from 'path'
import PWAWebpackPlugin from './index'
import { minify } from 'terser'

// 拼接文件内容
const template = (plugin: PWAWebpackPlugin): string => {
  return `const cacheList = ${JSON.stringify(plugin.cacheList)}
          self.addEventListener('install', event => {
            event.waitUntil(caches.open('${
              plugin.runtimeCache
            }').then(cache => cache.addAll(cacheList)))
            ${plugin.skipWaiting && `self.skipWaiting()`}
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

  const { code } = await minify(str)

  const sw = path.join(
    plugin.webpackConfig.path,
    `${plugin.serviceWorkerFilename}.js`
  )

  if (!code) return new Error('Service worker register error')

  fs.writeFileSync(sw, code, 'utf8')
}
