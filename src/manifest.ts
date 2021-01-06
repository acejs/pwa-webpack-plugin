import { IOptions } from './types'
import { ICustIcons, IItemIcons, IIcons, IDealedIcons } from './types'
import sharp from 'sharp'
import path from 'path'
import { warn } from './utils'

export const writeManifest = async (options: IOptions, publicPath: string) => {
  const { manifest, manifestFilename, manifestIconDir } = options

  const result = await dealWithIcons(manifest.icons)

  const map = new Map<string, any>()

  manifest.icons = result.map((item) => {
    const src = path.join(manifestIconDir, item.icon.src)
    map.set(src, item.source)
    return { ...item.icon, src: `${publicPath}${src}` }
  })

  map.set(manifestFilename, JSON.stringify(manifest))

  return map
}

/**
 * deal width option icon
 * @param icons options
 * @param output output path
 */
const dealWithIcons = async (icons: IIcons): Promise<IDealedIcons[]> => {
  function isCust(target: IIcons | IItemIcons): target is ICustIcons {
    return typeof target === 'object' && 'targetSizes' in target
  }

  let result: IDealedIcons[] = []

  if (isCust(icons)) {
    result = await genIcons(icons)
  } else {
    for (const value of icons.values()) {
      if (isCust(value)) {
        result = result.concat(await genIcons(value))
      } else {
        result.push(await copyIcons(value))
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
export const copyIcons = async (icon: IItemIcons): Promise<IDealedIcons> => {
  const { src } = icon
  // get File name
  const name = src.split('/').pop()

  if (!name) {
    warn(`File: ${String(src)} does't exist`)
    process.exit(1)
  }

  return {
    icon: { ...icon, src: name },
    source: await sharp(src).toBuffer(),
  }
}

/**
 * generate different size of icon by option icon and put them into output path
 * @param icons
 * @param output
 * @returns { icon: { src, sizes, type }, source: { name: source } }
 */
export const genIcons = async (icons: ICustIcons): Promise<IDealedIcons[]> => {
  const result: IDealedIcons[] = []

  const { src, type, targetSizes } = icons
  const list = targetSizes.map((size) =>
    size.split('x').map((i) => Number.parseInt(i, 10))
  )
  // file type
  const suffix = type.split('/')[1]

  const pipeline = await sharp(src)

  for (const size of list.values()) {
    const sizes = size.join('x')
    const src = `icon${sizes}.${suffix}`

    const source = await pipeline
      .clone()
      .resize(...size)
      .toBuffer()

    result.push({ icon: { src, sizes, type }, source })
  }

  return result
}
