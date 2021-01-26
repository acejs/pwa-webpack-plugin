import { Compiler } from 'webpack'
import { IOptions, CompilationHooksWithHtml } from './types'
import path from 'path'
import { warn, toRawType } from './utils'
import { serviceWorkerTemplate } from './sw'
import { writeManifest } from './manifest'
import { HtmlTagObject } from 'html-webpack-plugin'
import { RawSource } from 'webpack-sources'

const pluginName = 'PWAWebpackPlugin'

class PWAWebpackPlugin {
  webpackConfig = {
    path: '',
    publicPath: '',
  }

  cacheList: string[] = []

  options: IOptions = {
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
  }

  constructor(options: IOptions) {
    if (toRawType(options) === 'Object') {
      const exists: { [props: string]: any } = {}
      for (const [key, value] of Object.entries(options)) {
        if (key === 'manifest') Object.assign(this.options.manifest, value)
        else if (key in this.options) {
          exists[key] = value
        }
      }
      Object.assign(this.options, exists)
    }
  }

  apply(compiler: Compiler) {
    const self = this
    const { options } = self
    const { publicPath, path: outPath } = compiler.options.output || {}

    Object.assign(self.webpackConfig, {
      publicPath: publicPath || '',
      path: outPath || path.join(process.cwd(), 'dist'),
    })

    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      // load manifest and service worker in index.html
      // This is set in html-webpack-plugin pre-v4.
      let hook = (compilation.hooks as CompilationHooksWithHtml)
        .htmlWebpackPluginAlterAssetTags

      if (!hook) {
        if (!Array.isArray(compiler.options.plugins)) {
          warn(`No plugin has registered.`)
          process.exit(0)
        }

        const [htmlPlugin] = compiler.options.plugins.filter(
          (plugin) => plugin.constructor.name === 'HtmlWebpackPlugin'
        )

        // temp
        hook = (htmlPlugin.constructor as any).getHooks(compilation)
          .alterAssetTagGroups
      }

      hook.tapAsync(pluginName, (htmlPluginData: any, cb: any) => {
        refrenceByHWP(options, htmlPluginData)
        cb()
      })
    })

    // Get all resource directories and add them to the cache-storage list
    compiler.hooks.emit.tapAsync(pluginName, async (compilation, cb) => {
      const { assets } = compilation
      loop: for (const file of Object.keys(assets)) {
        if (options.noCache.length > 0) {
          for (const pattern of options.noCache) {
            if (pattern instanceof RegExp) {
              if (pattern.test(file)) continue loop
            } else {
              if (file === pattern) continue loop
            }
          }
        }

        // SPA project usually places the index.html on the server
        // Don`t use path join, publicPath //xxx  while be replaced
        const cachePath = options.noStaticAssets.includes(file)
          ? file
          : `${self.webpackConfig.publicPath}${file}`

        self.cacheList.push(cachePath)
      }
      // Write Manifest and Service Worker during emit phase
      compilation.assets[options.serviceWorkerFilename] = new RawSource(
        serviceWorkerTemplate(self)
      )

      const manifestMap = await writeManifest(
        options,
        self.webpackConfig.publicPath
      )

      for (const [key, value] of manifestMap.entries()) {
        compilation.assets[key] = new RawSource(value)
      }

      cb()
    })
  }
}

/**
 * service worker and manifest refrence by html-webpack-plugin
 * @param plugin
 * @param htmlPluginData
 */
function refrenceByHWP(options: IOptions, htmlPluginData: any) {
  const manifestLink: HtmlTagObject = {
    tagName: 'link',
    voidTag: true,
    attributes: {
      rel: 'manifest',
      href: `/${options.manifestFilename}`,
    },
  }

  const serviceWorkerScript: HtmlTagObject = {
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
  }

  if (htmlPluginData.plugin.version >= 4) {
    htmlPluginData.headTags.unshift(manifestLink)
    htmlPluginData.bodyTags.push(serviceWorkerScript)
  } else {
    htmlPluginData.head.unshift(manifestLink)
    htmlPluginData.body.push(serviceWorkerScript)
  }
}

export default PWAWebpackPlugin
