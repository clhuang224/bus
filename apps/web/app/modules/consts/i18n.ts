import { AppLocaleType } from '@bus/shared'

export const APP_LOCALE_STORAGE_KEY = 'appLocale'
export const DEFAULT_APP_LOCALE = AppLocaleType.ZH_TW
export const SUPPORTED_APP_LOCALES = [
  AppLocaleType.ZH_TW,
  AppLocaleType.EN,
] as const

export type SupportedAppLocale = (typeof SUPPORTED_APP_LOCALES)[number]

export function isSupportedAppLocale(
  value: string,
): value is SupportedAppLocale {
  return SUPPORTED_APP_LOCALES.includes(value as SupportedAppLocale)
}
