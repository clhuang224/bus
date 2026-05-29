// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { APP_LOCALE_STORAGE_KEY, DEFAULT_APP_LOCALE } from '../consts/i18n'
import { AppLocaleType } from '../enums/AppLocaleType'
import { getInitialAppLocale, loadLocaleFromStorage, setLocaleInStorage } from './locale'

describe('loadLocaleFromStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns the stored locale when it is supported', () => {
    localStorage.setItem(APP_LOCALE_STORAGE_KEY, AppLocaleType.EN)

    expect(loadLocaleFromStorage()).toBe(AppLocaleType.EN)
  })

  it.each([
    ['the stored value is invalid', 'invalid-locale'],
    ['storage is empty', null]
  ])('falls back to the default locale when %s', (_, storedValue) => {
    if (storedValue != null) {
      localStorage.setItem(APP_LOCALE_STORAGE_KEY, storedValue)
    }

    expect(loadLocaleFromStorage()).toBe(DEFAULT_APP_LOCALE)
  })

  it('persists the selected locale to storage', () => {
    const setItem = vi.fn()

    setLocaleInStorage({ setItem }, AppLocaleType.EN)

    expect(setItem).toHaveBeenCalledWith('appLocale', AppLocaleType.EN)
  })
})

describe('getInitialAppLocale', () => {
  it('uses the default locale for the initial app render', () => {
    expect(getInitialAppLocale()).toBe(DEFAULT_APP_LOCALE)
  })
})
