import { AppLocaleType } from '@bus/shared'
import {
  DEFAULT_API_ERROR_LOCALE,
  getApiErrorLocale,
} from './api-error-locale.js'

describe('getApiErrorLocale', () => {
  it('defaults to Traditional Chinese when the header is absent', () => {
    expect(getApiErrorLocale(undefined)).toBe(DEFAULT_API_ERROR_LOCALE)
  })

  it('uses English for supported English variants', () => {
    expect(getApiErrorLocale('en-US,en;q=0.9')).toBe(AppLocaleType.EN)
  })

  it('uses Traditional Chinese for supported Chinese variants', () => {
    expect(getApiErrorLocale('zh-Hant-TW, en;q=0.9')).toBe(AppLocaleType.ZH_TW)
  })

  it('uses the highest-priority supported language', () => {
    expect(getApiErrorLocale('ja, en;q=0.8, zh-TW;q=0.6')).toBe(
      AppLocaleType.EN,
    )
  })

  it('ignores unsupported and unacceptable languages', () => {
    expect(getApiErrorLocale('ja, en;q=0')).toBe(DEFAULT_API_ERROR_LOCALE)
  })
})
