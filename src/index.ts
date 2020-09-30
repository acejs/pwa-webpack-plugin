import { Compiler } from 'webpack'
import { IOptions, IManifest } from './types'
import path from 'path'
import { warn, isType } from './utils'
import { writeServiceWorker } from './sw'
import { writeManifest } from './manifest'

class PWAWebpackPlugin {
  webpackConfig = {
    path: '',
    publicPath: '',
  }

  cacheList: string[] = []

  noStaticAssets: string[] = ['index.html'] // webpack打包中，非静态资源，这些资源通常置于服务器上

  noCache: string[] = [] // 不需要缓存的文件列表

  skipWaiting: boolean = true // 是否跳过等待

  runtimeCache: string = 'storage' // cache storage 库名

  manifestFilename: string = 'manifest.webmanifest'

  serviceWorkerFilename: string = 'sw'

  manifest: IManifest = {
    name: 'Progressive Web App',
    short_name: 'PWA',
    start_url: '/',
    background_color: '#FFF',
    theme_color: '#f4f4f4',
    display: 'fullscreen',
    icons: [],
  }

  constructor(options: IOptions) {
    const {
      skipWaiting,
      runtimeCache,
      noCache,
      manifest,
      manifestFilename,
      serviceWorkerFilename,
      noStaticAssets,
    } = options

    if (isType(manifest, 'Object')) Object.assign(this.manifest, manifest)

    if (typeof skipWaiting === 'boolean') this.skipWaiting = skipWaiting

    runtimeCache && (this.runtimeCache = runtimeCache)

    manifestFilename && (this.manifestFilename = manifestFilename)
    serviceWorkerFilename &&
      (this.serviceWorkerFilename = serviceWorkerFilename)

    Array.isArray(noCache) && (this.noCache = noCache)

    Array.isArray(noStaticAssets) && (this.noStaticAssets = noStaticAssets)
  }

  apply(compiler: Compiler) {
    const self = this
    const { publicPath, path: outPath } = compiler.options.output || {}

    Object.assign(this.webpackConfig, {
      publicPath: publicPath || '',
      path: outPath || path.join(process.cwd(), 'dist'),
    })

    // html-webpack-plugin hooks引用 在
    // index.html 中引用注册表文件和注册 service worker
    compiler.hooks.afterCompile.tap(self.constructor.name, (compilation) => {
      let alterAssetTags

      // alterAssetTags 是 html-webpack-plugin 注册的钩子
      for (const [key, value] of Object.entries(compilation.hooks)) {
        if (key === 'htmlWebpackPluginAlterAssetTags') {
          alterAssetTags = value
          break
        }
      }

      if (!alterAssetTags) {
        warn(
          `Unable to find an instance of HtmlWebpackPlugin in the current compilation`
        )
      }

      alterAssetTags.tapAsync(
        self.constructor.name,
        (htmlPluginData: any, cb: any) => {
          writeInHtmlWebpackPlugin(self, htmlPluginData)
          cb()
        }
      )
    })

    // 获取所有资源目录，并添加到缓存文件列表
    compiler.hooks.emit.tap(self.constructor.name, (compilation) => {
      const { assets } = compilation
      for (const file of Object.keys(assets)) {
        if (self.noCache.includes(file)) continue

        const cachePath = self.noStaticAssets.includes(file)
          ? file
          : path.join(self.webpackConfig.publicPath, file)

        // spa 项目通常将 index.html 文件置于服务器
        this.cacheList.push(cachePath)
      }
    })

    // 写入注册表文件 和 service worker
    compiler.hooks.done.tapAsync(self.constructor.name, (compilation, cb) => {
      Promise.all([writeServiceWorker(self), writeManifest(self)])
        .then(() => {
          this.cacheList = []
          cb()
        })
        .catch(({ message }) => {
          warn(message)
        })
    })
  }
}

/**
 * service worker and manifest refrence by html-webpack-plugin
 * @param plugin
 * @param htmlPluginData
 */
function writeInHtmlWebpackPlugin(
  plugin: PWAWebpackPlugin,
  htmlPluginData: any
) {
  // 3.2.0 版本的写法
  const { head, body } = htmlPluginData
  // 引入注册表文件
  head.unshift({
    tagName: 'link',
    voidTag: true,
    attributes: {
      rel: 'manifest',
      href: plugin.manifestFilename,
    },
  })

  // 注册 service worker 脚本
  body.push({
    tagName: 'script',
    voidTag: false,
    innerHTML: `if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('${plugin.serviceWorkerFilename}.js')
        .then(e => {
          console.log('serviceWorker register success!')
        })
        .catch(err => {
          console.log(err)
        })
    }`,
  })
}

export default PWAWebpackPlugin
