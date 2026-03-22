import { APP_LOCALE_STORAGE_KEY, DEFAULT_APP_LOCALE, isSupportedAppLocale } from '../consts/i18n'
import type { AppLocaleType } from '../enums/AppLocaleType'

function readStoredLocale(storage: Pick<Storage, 'getItem'>) {
  const storedLocale = storage.getItem(APP_LOCALE_STORAGE_KEY)
  if (!storedLocale || !isSupportedAppLocale(storedLocale)) {
    return DEFAULT_APP_LOCALE
  }

  return storedLocale
}

export function getInitialAppLocale(): AppLocaleType {
  if (typeof window === 'undefined') {
    return DEFAULT_APP_LOCALE
  }

  try {
    return readStoredLocale(window.localStorage)
  } catch {
    return DEFAULT_APP_LOCALE
  }
}

export function getLocaleFromStorage(storage: Pick<Storage, 'getItem'>): AppLocaleType {
  return readStoredLocale(storage)
}

export function setLocaleInStorage(
  storage: Pick<Storage, 'setItem'>,
  locale: AppLocaleType
) {
  storage.setItem(APP_LOCALE_STORAGE_KEY, locale)
}
