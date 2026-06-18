import type { AppLocaleType } from '../enums/AppLocaleType.js'

export type LocalizedText<K extends string = AppLocaleType> = {
  [key in K]: string
}
