import { describe, expect, it } from 'vitest'
import { AppLocaleType } from '@bus/shared'
import { getLocalizedText } from './getLocalizedText'

describe('getLocalizedText', () => {
  it('returns zh-TW text in Traditional Chinese mode', () => {
    expect(
      getLocalizedText(
        {
          'zh-TW': '藍1',
          en: 'Blue 1',
          ja: '',
          ko: '',
        },
        AppLocaleType.ZH_TW,
      ),
    ).toBe('藍1')
  })

  it('prefers English text in English mode', () => {
    expect(
      getLocalizedText(
        {
          'zh-TW': '藍1',
          en: 'Blue 1',
          ja: '',
          ko: '',
        },
        AppLocaleType.EN,
      ),
    ).toBe('Blue 1')
  })

  it('falls back to zh-TW when English text is missing in English mode', () => {
    expect(
      getLocalizedText(
        {
          'zh-TW': '捷運昆陽站',
          en: '  ',
          ja: '',
          ko: '',
        },
        AppLocaleType.EN,
      ),
    ).toBe('捷運昆陽站')
  })

  it.each([
    [AppLocaleType.JA, 'ブルー1'],
    [AppLocaleType.KO, '블루 1'],
  ])('returns the requested localized text in %s mode', (locale, expected) => {
    expect(
      getLocalizedText(
        {
          'zh-TW': '藍1',
          en: 'Blue 1',
          ja: 'ブルー1',
          ko: '블루 1',
        },
        locale,
      ),
    ).toBe(expected)
  })

  it.each([AppLocaleType.JA, AppLocaleType.KO])(
    'falls back to zh-TW when localized text is missing in %s mode',
    (locale) => {
      expect(
        getLocalizedText(
          {
            'zh-TW': '藍1',
            en: 'Blue 1',
            ja: '',
            ko: '',
          },
          locale,
        ),
      ).toBe('藍1')
    },
  )

  it('returns an empty string when localized text is missing', () => {
    expect(getLocalizedText(null, AppLocaleType.EN)).toBe('')
  })
})
