import { AppLocaleType, type LocalizedText } from '@bus/shared'
import { getEnumValues } from '../shared/getEnumValues'
import { getLocalizedText } from './getLocalizedText'

export const EMPTY_LOCALIZED_TEXT: LocalizedText = {
  [AppLocaleType.ZH_TW]: '',
  [AppLocaleType.EN]: '',
  [AppLocaleType.JA]: '',
  [AppLocaleType.KO]: '',
}

export function withLocalizedFallback(
  primary: LocalizedText,
  fallback: LocalizedText,
): LocalizedText {
  return getEnumValues(AppLocaleType).reduce(
    (text, locale) => ({
      ...text,
      [locale]:
        getLocalizedText(primary, locale) || getLocalizedText(fallback, locale),
    }),
    EMPTY_LOCALIZED_TEXT,
  )
}
