import { compilation } from 'webpack'
import { AsyncSeriesWaterfallHook } from 'tapable'

interface IBasicIcons {
  src: string
  type: string
}

export interface IItemIcons extends IBasicIcons {
  sizes: string
}

// ['48x48', '96x96', '128x128', '256x256', '512x512']
export interface ICustIcons extends IBasicIcons {
  targetSizes: string[]
}

export type IIcons = (IItemIcons | ICustIcons)[] | ICustIcons

export interface IManifest {
  name: string
  short_name: string
  start_url?: string
  theme_color?: string
  background_color?: string
  display?: 'fullscreen' | 'standalone' | 'browser' | 'minimal-ui'
  icons: IIcons
}

export interface IOptions {
  skipWaiting?: boolean
  noCache?: string[]
  manifest: IManifest
  manifestFilename?: string
  serviceWorkerFilename?: string
  cacheStorageName?: string
  noStaticAssets?: string[]
}

export type LogFn = (message: string, color?: 'red' | 'blue' | 'green') => void

export interface CompilationHooksWithHtml extends compilation.CompilationHooks {
  htmlWebpackPluginAlterAssetTags: AsyncSeriesWaterfallHook
}
