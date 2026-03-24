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

  const zhTwModern = ('zh-TW' in text ? text['zh-TW'] : undefined)?.trim() ?? ''
  const zhTwLegacy = ('zh_TW' in text ? text.zh_TW : undefined)?.trim() ?? ''
  const zhText = zhTwModern || zhTwLegacy

  const englishText = text.en?.trim() ?? ''

  if (locale === AppLocaleType.EN) {
    if (englishText) return englishText
  }

  return zhText
}
