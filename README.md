## pwa-webpack-plugin

### 概述

[渐进式 Web 引用(PWA)](https://developer.mozilla.org/zh-CN/docs/Web/Progressive_web_apps) 相关概念......

本插件赋能 webpack 打包应用，使应用能快速支持 PWA 相关技术。

包括：

- 应用清单，添加到系统桌面
- 注册 Service Worker，实现离线缓存

### 安装

```shell
yarn add @cdjs/pwa-webpack-plugin -D
// or
npm install @cdjs/pwa-webpack-plugin --save-dev
```

### 项目配置

```javascript
// webpack.config.js
const PWAWebpackPlugin = require('@cdjs/pwa-webpack-plugin')

plugins: [
  ...new PWAWebpackPlugin({
    ...options,
  }),
]
```

### 参数

- #### **`serviceWorkerFilename`: string**

  `require: false | default: 'sw.js' `

  Service Worker 注册脚本文件名.

- #### **`manifestFilename`: string**

  `require: false | default: 'manifest.webmanifest'`

  网页应用清单文件名.

- #### **`cacheStorageName`: string**

  `require: false | default: 'runtime-storage'`

  Cache Storage 库名

- #### **`noStaticAssets`: string[]**

  `require: false | default: ['index.html']`

  项目中非静态类型的资源。

  Vue SPA 为例：正常打包完都会将静态资源上传至 Webpack 配置的 `publicPath` 指向的地址，而将入口文件（一般为 _index.html_ ） 存在服务器，并配置 `Cache-Control: no-cache`。此时，就需要将 _index.html_ 传入该数组，因为在打开网页时，_index.html_ 是不同于其他静态资源的加载方式。

- #### **`noCache`: string[]**

  `require: false`

  不需要缓存的文件列表，打包后的文件

- #### **`skipWaiting`: boolean**

  `require: false | default: true`

  是否通过 `skipWaiting` 跳过 _waiting_ 状态，[官方文档](https://developer.mozilla.org/zh-CN/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting)

- #### **`manifest`: object**

  `require: true`

  应用清单文件，具体参数如下：

#### manifest 对象内容

- **`name`: string**

  `require: true`

  网站应用全称，用于应用安装提示及启动页面的显示。

- **`short_name`: string**

  `require: true`

  网站应用名简写，用于添加到主屏幕时的应用名展示，不要超过 12 个字符。

- **`start_url`: string**

  `require: false | default: '/'`

  定义添加到桌面后的启动 URL。

- **`background_color`: string**

  `require: false | default: '#FFF'`

  网站背景色，在启动页面时显示

- **`theme_color`: string**

  `require: false | default: '#f4f4f4'`

  网站主题色，定义浏览器 UI 的主题色

- **`display`: 'fullscreen' | 'standalone' | 'browser' | 'minimal-ui'**

  `require: false | default: 'fullscreen'`

  显示模式，[官方文档](https://developer.mozilla.org/en-US/docs/Web/Manifest/display)

- **`icons`: object | object[]**

  应用图标，支持依据指定图标生成不同尺寸格式的图标，格式如下：

  ```javascript
  // 复制已存在的 icon 列表
  icons: [
    (src: ''), // 路径
    (type: ''), // 文件类型，MIME 格式
    (sizes: ''), // 支持的格式列表，若是 .ico 这种支持多格式的文件，传入 '72x72 96x96 128x128 ... ...'
  ]

  // 生成指定格式的 icon
  icons: [
    (src: ''), // 路径
    (type: ''), // 文件类型，MIME 格式
    (targetSizes: [
      // 指定要生成的尺寸
      '96x96',
      '128x128',
      '512x512'
    ]),
  ]
  ```
