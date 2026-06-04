import type { AppLocaleType } from '../enums/AppLocaleType.js'

export type AppLocale = `${AppLocaleType}`

export type LocalizedText<K extends string = AppLocale> = {
  [key in K]: string
}
