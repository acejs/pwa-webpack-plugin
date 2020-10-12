"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const sw_1 = require("./sw");
const manifest_1 = require("./manifest");
class PWAWebpackPlugin {
    constructor(options) {
        this.webpackConfig = {
            path: '',
            publicPath: '',
        };
        this.cacheList = [];
        this.noStaticAssets = ['index.html']; // webpack打包中，非静态资源，这些资源通常置于服务器上
        this.noCache = []; // 不需要缓存的文件列表
        this.skipWaiting = true; // 是否跳过等待
        this.cacheStorageName = 'runtime-storage'; // cache storage 库名
        this.manifestFilename = 'manifest.webmanifest';
        this.serviceWorkerFilename = 'sw.js';
        this.manifest = {
            name: 'Progressive Web App',
            short_name: 'PWA',
            start_url: '/',
            background_color: '#FFF',
            theme_color: '#f4f4f4',
            display: 'fullscreen',
            icons: [],
        };
        const { skipWaiting, cacheStorageName, noCache, manifest, manifestFilename, serviceWorkerFilename, noStaticAssets, } = options;
        if (utils_1.isType(manifest, 'Object'))
            Object.assign(this.manifest, manifest);
        if (typeof skipWaiting === 'boolean')
            this.skipWaiting = skipWaiting;
        cacheStorageName && (this.cacheStorageName = cacheStorageName);
        manifestFilename && (this.manifestFilename = manifestFilename);
        serviceWorkerFilename &&
            (this.serviceWorkerFilename = serviceWorkerFilename);
        Array.isArray(noCache) && (this.noCache = noCache);
        Array.isArray(noStaticAssets) && (this.noStaticAssets = noStaticAssets);
    }
    apply(compiler) {
        const self = this;
        const { publicPath, path: outPath } = compiler.options.output || {};
        Object.assign(this.webpackConfig, {
            publicPath: publicPath || '',
            path: outPath || path_1.default.join(process.cwd(), 'dist'),
        });
        // index.html 中引用注册表文件和注册 service worker
        compiler.hooks.compilation.tap(self.constructor.name, (compilation) => {
            // This is set in html-webpack-plugin pre-v4.
            let hook = compilation.hooks
                .htmlWebpackPluginAlterAssetTags;
            if (!hook) {
                if (!Array.isArray(compiler.options.plugins)) {
                    utils_1.warn(`No plugin has registered.`);
                    process.exit(0);
                }
                const [htmlPlugin] = compiler.options.plugins.filter((plugin) => plugin.constructor.name === 'HtmlWebpackPlugin');
                // temp
                hook = htmlPlugin.constructor.getHooks(compilation)
                    .alterAssetTagGroups;
            }
            hook.tapAsync(self.constructor.name, (htmlPluginData, cb) => {
                writeInHtmlWebpackPlugin(self, htmlPluginData);
                cb();
            });
        });
        // 获取所有资源目录，并添加到缓存文件列表
        compiler.hooks.emit.tap(self.constructor.name, (compilation) => {
            const { assets } = compilation;
            for (const file of Object.keys(assets)) {
                if (self.noCache.includes(file))
                    continue;
                const cachePath = self.noStaticAssets.includes(file)
                    ? file
                    : path_1.default.join(self.webpackConfig.publicPath, file);
                // spa 项目通常将 index.html 文件置于服务器
                this.cacheList.push(cachePath);
            }
        });
        // 写入注册表文件 和 service worker
        compiler.hooks.done.tapAsync(self.constructor.name, (compilation, cb) => {
            Promise.all([sw_1.writeServiceWorker(self), manifest_1.writeManifest(self)])
                .then(() => {
                this.cacheList = [];
                cb();
            })
                .catch(({ message }) => {
                utils_1.warn(message);
            });
        });
    }
}
/**
 * service worker and manifest refrence by html-webpack-plugin
 * @param plugin
 * @param htmlPluginData
 */
function writeInHtmlWebpackPlugin(plugin, htmlPluginData) {
    const { plugin: { version }, } = htmlPluginData;
    let head = [];
    let body = [];
    if (version === 4) {
        head = htmlPluginData.headTags;
        body = htmlPluginData.bodyTags;
    }
    else {
        head = htmlPluginData.head;
        body = htmlPluginData.body;
    }
    // 引入注册表文件
    head.unshift({
        tagName: 'link',
        voidTag: true,
        attributes: {
            rel: 'manifest',
            href: plugin.manifestFilename,
        },
    });
    // 注册 service worker 脚本
    body.push({
        tagName: 'script',
        voidTag: false,
        innerHTML: `if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('${plugin.serviceWorkerFilename}')
        .then(e => {
          console.log('serviceWorker register success!')
        })
        .catch(err => {
          console.log(err)
        })
    }`,
    });
}
exports.default = PWAWebpackPlugin;
