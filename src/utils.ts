import { LogFn } from './types'
import chalk from 'chalk'

export const isType = (target: unknown, type: string): boolean => {
  return Object.prototype.toString.call(target) === `[object ${type}]`
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
  process.exit(0)
}
