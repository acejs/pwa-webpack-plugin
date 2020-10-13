"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// 拼接文件内容
const template = (plugin) => {
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
          })`;
};
exports.writeServiceWorker = (plugin) => __awaiter(void 0, void 0, void 0, function* () {
    const str = template(plugin);
    const sw = path_1.default.join(plugin.webpackConfig.path, plugin.serviceWorkerFilename);
    fs_1.default.writeFileSync(sw, str, 'utf8');
});
