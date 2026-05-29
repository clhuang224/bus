import { AppLocaleType } from '../enums/AppLocaleType'

export const APP_LOCALE_STORAGE_KEY = 'appLocale'
export const DEFAULT_APP_LOCALE = AppLocaleType.ZH_TW
export const SUPPORTED_APP_LOCALES = [AppLocaleType.ZH_TW, AppLocaleType.EN] as const

export function isSupportedAppLocale(value: string): value is AppLocaleType {
  return SUPPORTED_APP_LOCALES.includes(value as AppLocaleType)
}
