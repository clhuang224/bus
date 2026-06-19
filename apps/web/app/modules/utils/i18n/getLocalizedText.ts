import { AppLocaleType } from '@bus/shared'
import type { LocalizedText } from '@bus/shared'

export function getLocalizedText(
  text: LocalizedText | null | undefined,
  locale: AppLocaleType,
) {
  if (!text) return ''

  const localizedText = text[locale].trim()

  if (localizedText) return localizedText

  return text[AppLocaleType.ZH_TW].trim()
}
