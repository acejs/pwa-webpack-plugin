import PWAWebpackPlugin from './index'
import { ICustIcons, IItemIcons, IIcons } from './types'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const dir = 'manifest-icon'

export const writeManifest = async (plugin: PWAWebpackPlugin) => {
  const {
    webpackConfig: { path: output },
    manifest,
    manifest: { icons },
    manifestFilename,
  } = plugin

  // 创建 icon 文件夹
  fs.mkdirSync(path.join(output, dir))

  const result = await dealWithIcons(icons, output)

  if (result instanceof Error) return result

  plugin.manifest.icons = result

  fs.writeFileSync(
    path.join(output, manifestFilename),
    JSON.stringify(manifest),
    'utf8'
  )
}

/**
 * deal width option icon
 * @param icons options
 * @param output output path
 */
const dealWithIcons = async (
  icons: IIcons,
  output: string
): Promise<Error | IItemIcons[]> => {
  function isCust(target: IIcons | IItemIcons): target is ICustIcons {
    return typeof target === 'object' && 'targetSizes' in target
  }

  let result: IItemIcons[] = []

  if (isCust(icons)) {
    result = await genIcons(icons, output)
  } else {
    for (const value of icons.values()) {
      if (isCust(value)) {
        result = result.concat(await genIcons(value, output))
      } else {
        const copy = await copyIcons(value, output)

        if (copy instanceof Error) return copy

        result.push({ ...value, src: copy })
      }
    }
  }

  return result
}

/**
 * copy option icon to output path
 * @param icon
 * @param output
 */
export const copyIcons = async (
  icon: IItemIcons,
  output: string
): Promise<string | Error> => {
  const { src } = icon
  // 默认截取最后的为文件名
  const name = src.split('/').pop()

  if (!name) return new Error(`File: ${String(src)} does't exist`)

  const newSrc = path.join(dir, name)

  fs.copyFileSync(src, path.join(output, newSrc))

  return newSrc
}

/**
 * generate different size of icon by option icon and put them into output path
 * @param icons
 * @param output
 */
export const genIcons = async (
  icons: ICustIcons,
  output: string
): Promise<IItemIcons[]> => {
  const result: IItemIcons[] = []

  const { src, type, targetSizes } = icons
  const list = targetSizes.map((size) =>
    size.split('x').map((i) => Number.parseInt(i, 10))
  )
  const pipeline = sharp(src)

  const suffix = type.split('/')[1]

  for (const size of list.values()) {
    const sizes = size.join('x')
    const src = path.join(dir, `icon${sizes}.${suffix}`)

    await pipeline
      .clone()
      .resize(...size)
      .toFile(path.join(output, src))

    result.push({ src, sizes, type })
  }

  return result
}
