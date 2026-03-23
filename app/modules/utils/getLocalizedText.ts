import { AppLocaleType } from '../enums/AppLocaleType'
import type { LocalizedText } from '../types/LocalizedText'

type LocalizedTextLike = Pick<LocalizedText, 'zh_TW' | 'en'>

export function getLocalizedText(
  text: LocalizedTextLike | null | undefined,
  locale: AppLocaleType
) {
  if (!text) return ''

  if (locale === AppLocaleType.EN) {
    const englishText = text.en?.trim()
    if (englishText) return englishText
  }

  return text.zh_TW
}
