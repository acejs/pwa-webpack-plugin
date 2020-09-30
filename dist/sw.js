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
const terser_1 = require("terser");
// 拼接文件内容
const template = (plugin) => {
    return `const cacheList = ${JSON.stringify(plugin.cacheList)}
          self.addEventListener('install', event => {
            event.waitUntil(caches.open('${plugin.runtimeCache}').then(cache => cache.addAll(cacheList)))
            ${plugin.skipWaiting && `self.skipWaiting()`}
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
    const { code } = yield terser_1.minify(str);
    const sw = path_1.default.join(plugin.webpackConfig.path, `${plugin.serviceWorkerFilename}.js`);
    if (!code)
        return new Error('Service worker register error');
    fs_1.default.writeFileSync(sw, code, 'utf8');
});
