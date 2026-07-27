import { AppLocaleType } from '@bus/shared'
import {
  DEFAULT_API_ERROR_LOCALE,
  getApiErrorLocale,
} from './api-error-locale.js'

describe('getApiErrorLocale', () => {
  it('defaults to Traditional Chinese when the header is absent', () => {
    expect(getApiErrorLocale(undefined)).toBe(DEFAULT_API_ERROR_LOCALE)
  })

  it('uses English when the exact supported locale is requested', () => {
    expect(getApiErrorLocale('en, zh-TW;q=0.9')).toBe(AppLocaleType.EN)
  })

  it('matches supported locale tags without regard to casing', () => {
    expect(getApiErrorLocale('ZH-tw, en;q=0.9')).toBe(AppLocaleType.ZH_TW)
  })

  it('uses the highest-priority supported language', () => {
    expect(getApiErrorLocale('ja, en;q=0.8, zh-TW;q=0.6')).toBe(
      AppLocaleType.EN,
    )
  })

  it('falls back for unsupported and unacceptable locales', () => {
    expect(getApiErrorLocale('zh-CN, en-US;q=0.9')).toBe(
      DEFAULT_API_ERROR_LOCALE,
    )
    expect(getApiErrorLocale('ja, en;q=0')).toBe(DEFAULT_API_ERROR_LOCALE)
  })
})
