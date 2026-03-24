import { AppLocaleType } from '../../enums/AppLocaleType'
import type { LocalizedText } from '../../types/LocalizedText'

type LocalizedTextLike = Pick<LocalizedText, 'zh-TW' | 'en'>
type LegacyLocalizedTextLike = {
  zh_TW?: string
  en?: string
}

export function getLocalizedText(
  text: LocalizedTextLike | LegacyLocalizedTextLike | null | undefined,
  locale: AppLocaleType
) {
  if (!text) return ''

  const zhText = ('zh-TW' in text ? text['zh-TW'] : text.zh_TW)?.trim() ?? ''
  const englishText = text.en?.trim() ?? ''

  if (locale === AppLocaleType.EN) {
    if (englishText) return englishText
  }

  return zhText
}
