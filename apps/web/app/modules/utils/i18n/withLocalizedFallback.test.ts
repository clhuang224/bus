import { AppLocaleType } from '@bus/shared'
import { describe, expect, it } from 'vitest'
import { getEnumValues } from '../shared/getEnumValues'
import { getLocalizedText } from './getLocalizedText'
import {
  EMPTY_LOCALIZED_TEXT,
  withLocalizedFallback,
} from './withLocalizedFallback'

describe('withLocalizedFallback', () => {
  it.each([
    {
      case: 'primary has every locale',
      primary: { ...EMPTY_LOCALIZED_TEXT, 'zh-TW': '藍1', en: 'Blue 1' },
      fallback: { ...EMPTY_LOCALIZED_TEXT, 'zh-TW': '路線', en: 'Route' },
    },
    {
      case: 'primary has only Chinese',
      primary: { ...EMPTY_LOCALIZED_TEXT, 'zh-TW': '藍1' },
      fallback: { ...EMPTY_LOCALIZED_TEXT, 'zh-TW': '路線', en: 'Route' },
    },
    {
      case: 'primary is empty',
      primary: EMPTY_LOCALIZED_TEXT,
      fallback: { ...EMPTY_LOCALIZED_TEXT, 'zh-TW': '路線', en: 'Route' },
    },
  ])(
    'renders like "primary, else fallback" in every locale when $case',
    ({ primary, fallback }) => {
      const text = withLocalizedFallback(primary, fallback)

      for (const locale of getEnumValues(AppLocaleType)) {
        expect(getLocalizedText(text, locale)).toBe(
          getLocalizedText(primary, locale) ||
            getLocalizedText(fallback, locale),
        )
      }
    },
  )
})
