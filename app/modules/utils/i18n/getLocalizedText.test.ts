import { describe, expect, it } from 'vitest'
import { AppLocaleType } from '../../enums/AppLocaleType'
import { getLocalizedText } from './getLocalizedText'

describe('getLocalizedText', () => {
  it('returns zh-TW text in Traditional Chinese mode', () => {
    expect(getLocalizedText({
      zh_TW: '藍1',
      en: 'Blue 1'
    }, AppLocaleType.ZH_TW)).toBe('藍1')
  })

  it('prefers English text in English mode', () => {
    expect(getLocalizedText({
      zh_TW: '藍1',
      en: 'Blue 1'
    }, AppLocaleType.EN)).toBe('Blue 1')
  })

  it('falls back to zh-TW when English text is missing in English mode', () => {
    expect(getLocalizedText({
      zh_TW: '捷運昆陽站',
      en: '  '
    }, AppLocaleType.EN)).toBe('捷運昆陽站')
  })

  it('returns an empty string when localized text is missing', () => {
    expect(getLocalizedText(null, AppLocaleType.EN)).toBe('')
  })
})
