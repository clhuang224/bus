import { AppLocaleType } from '../../enums/AppLocaleType'
import type { LocalizedText } from '../../types/LocalizedText'

type LocalizedTextLike = Pick<LocalizedText, 'zh_TW' | 'en'>

export function getLocalizedText(
  text: LocalizedTextLike | null | undefined,
  locale: AppLocaleType
) {
  if (!text) return ''

  const zhText = text.zh_TW?.trim() ?? ''
  const englishText = text.en?.trim() ?? ''

  if (locale === AppLocaleType.EN) {
    if (englishText) return englishText
  }

  return zhText
}
