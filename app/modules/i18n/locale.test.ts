import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_APP_LOCALE } from '../consts/i18n'
import { AppLocaleType } from '../enums/AppLocaleType'
import { getLocaleFromStorage, setLocaleInStorage } from './locale'

describe('getLocaleFromStorage', () => {
  it('returns the stored locale when it is supported', () => {
    expect(getLocaleFromStorage({
      getItem: () => AppLocaleType.EN
    })).toBe(AppLocaleType.EN)
  })

  it('falls back to the default locale when the stored value is invalid', () => {
    expect(getLocaleFromStorage({
      getItem: () => 'ja'
    })).toBe(DEFAULT_APP_LOCALE)
  })

  it('falls back to the default locale when storage is empty', () => {
    expect(getLocaleFromStorage({
      getItem: () => null
    })).toBe(DEFAULT_APP_LOCALE)
  })

  it('persists the selected locale to storage', () => {
    const setItem = vi.fn()

    setLocaleInStorage({ setItem }, AppLocaleType.EN)

    expect(setItem).toHaveBeenCalledWith('appLocale', AppLocaleType.EN)
  })
})
