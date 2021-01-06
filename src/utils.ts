import { LogFn } from './types'
import chalk from 'chalk'

export const toRawType = (target: unknown): string => {
  return Object.prototype.toString.call(target).slice(8, -1)
}

export const log: LogFn = (message, color = 'blue') => {
  console.log(
    chalk[color](`
	
    ******************************** PWAWebpackPlugin ********************************

    ${message}
	
	`)
  )
}

export const warn: LogFn = (message, color = 'red'): void => {
  log(message, color)
  process.exit(1)
}
