import { APP_LOCALE_STORAGE_KEY, DEFAULT_APP_LOCALE, isSupportedAppLocale } from '../consts/i18n'
import type { AppLocaleType } from '../enums/AppLocaleType'
import { getLocalStorage } from '../utils/shared/getLocalStorage'

const STORED_LOCALE_UNAVAILABLE_ERROR = 'Stored locale is unavailable or invalid.'

function readStoredLocale(storage: Pick<Storage, 'getItem'>) {
  const storedLocale = storage.getItem(APP_LOCALE_STORAGE_KEY)
  if (!storedLocale || !isSupportedAppLocale(storedLocale)) {
    throw new Error(STORED_LOCALE_UNAVAILABLE_ERROR)
  }

  return storedLocale
}

export function getInitialAppLocale(): AppLocaleType {
  return DEFAULT_APP_LOCALE
}

export function getLocaleFromStorage(storage: Pick<Storage, 'getItem'>): AppLocaleType {
  try {
    return readStoredLocale(storage)
  } catch {
    return DEFAULT_APP_LOCALE
  }
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
