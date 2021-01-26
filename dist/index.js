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
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const sw_1 = require("./sw");
const manifest_1 = require("./manifest");
const webpack_sources_1 = require("webpack-sources");
const pluginName = 'PWAWebpackPlugin';
class PWAWebpackPlugin {
    constructor(options) {
        this.webpackConfig = {
            path: '',
            publicPath: '',
        };
        this.cacheList = [];
        this.options = {
            noStaticAssets: ['index.html'],
            manifest: {
                name: 'Progressive Web App',
                short_name: 'PWA',
                start_url: '/',
                background_color: '#FFF',
                theme_color: '#f4f4f4',
                display: 'fullscreen',
                icons: [],
            },
            noCache: [],
            skipWaiting: true,
            cacheStorageName: 'runtime-storage',
            manifestFilename: 'manifest.webmanifest',
            manifestIconDir: 'manifest-icon',
            serviceWorkerFilename: 'sw.js',
        };
        if (utils_1.toRawType(options) === 'Object') {
            const exists = {};
            for (const [key, value] of Object.entries(options)) {
                if (key === 'manifest')
                    Object.assign(this.options.manifest, value);
                else if (key in this.options) {
                    exists[key] = value;
                }
            }
            Object.assign(this.options, exists);
        }
    }
    apply(compiler) {
        const self = this;
        const { options } = self;
        const { publicPath, path: outPath } = compiler.options.output || {};
        Object.assign(self.webpackConfig, {
            publicPath: publicPath || '',
            path: outPath || path_1.default.join(process.cwd(), 'dist'),
        });
        compiler.hooks.compilation.tap(pluginName, (compilation) => {
            // load manifest and service worker in index.html
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
            hook.tapAsync(pluginName, (htmlPluginData, cb) => {
                refrenceByHWP(options, htmlPluginData);
                cb();
            });
        });
        // Get all resource directories and add them to the cache-storage list
        compiler.hooks.emit.tapAsync(pluginName, (compilation, cb) => __awaiter(this, void 0, void 0, function* () {
            const { assets } = compilation;
            loop: for (const file of Object.keys(assets)) {
                if (options.noCache.length > 0) {
                    for (const pattern of options.noCache) {
                        if (pattern instanceof RegExp) {
                            if (pattern.test(file))
                                continue loop;
                        }
                        else {
                            if (file === pattern)
                                continue loop;
                        }
                    }
                }
                // SPA project usually places the index.html on the server
                // Don`t use path join, publicPath //xxx  while be replaced
                const cachePath = options.noStaticAssets.includes(file)
                    ? file
                    : `${self.webpackConfig.publicPath}${file}`;
                self.cacheList.push(cachePath);
            }
            // Write Manifest and Service Worker during emit phase
            compilation.assets[options.serviceWorkerFilename] = new webpack_sources_1.RawSource(sw_1.serviceWorkerTemplate(self));
            const manifestMap = yield manifest_1.writeManifest(options, self.webpackConfig.publicPath);
            for (const [key, value] of manifestMap.entries()) {
                compilation.assets[key] = new webpack_sources_1.RawSource(value);
            }
            cb();
        }));
    }
}
/**
 * service worker and manifest refrence by html-webpack-plugin
 * @param plugin
 * @param htmlPluginData
 */
function refrenceByHWP(options, htmlPluginData) {
    const manifestLink = {
        tagName: 'link',
        voidTag: true,
        attributes: {
            rel: 'manifest',
            href: `/${options.manifestFilename}`,
        },
    };
    const serviceWorkerScript = {
        tagName: 'script',
        voidTag: false,
        innerHTML: `if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/${options.serviceWorkerFilename}')
        .then(e => {
          console.log('serviceWorker register success!')
        })
        .catch(err => {
          console.log(err)
        })
    }`,
        attributes: {},
    };
    if (htmlPluginData.plugin.version >= 4) {
        htmlPluginData.headTags.unshift(manifestLink);
        htmlPluginData.bodyTags.push(serviceWorkerScript);
    }
    else {
        htmlPluginData.head.unshift(manifestLink);
        htmlPluginData.body.push(serviceWorkerScript);
    }
}
exports.default = PWAWebpackPlugin;
