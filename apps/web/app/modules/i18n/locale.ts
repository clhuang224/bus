import { APP_LOCALE_STORAGE_KEY, DEFAULT_APP_LOCALE, isSupportedAppLocale } from '../consts/i18n'
import type { AppLocaleType } from '../enums/AppLocaleType'
import { getLocalStorage } from '../utils/shared/getLocalStorage'

export function getInitialAppLocale(): AppLocaleType {
  return DEFAULT_APP_LOCALE
}

function getLocaleFromStorage(storage: Pick<Storage, 'getItem'>): AppLocaleType {
  const storedLocale = storage.getItem(APP_LOCALE_STORAGE_KEY)

  if (!storedLocale || !isSupportedAppLocale(storedLocale)) {
    return DEFAULT_APP_LOCALE
  }

  return storedLocale
}

export function loadLocaleFromStorage(): AppLocaleType {
  const storage = getLocalStorage()
  return getLocaleFromStorage(storage)
}

export function setLocaleInStorage(
  storage: Pick<Storage, 'setItem'>,
  locale: AppLocaleType
) {
  storage.setItem(APP_LOCALE_STORAGE_KEY, locale)
}

export function persistLocaleInStorage(locale: AppLocaleType) {
  const storage = getLocalStorage()
  setLocaleInStorage(storage, locale)
}
