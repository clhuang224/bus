import {
  AppLocaleType,
  type ApiLocalizedText,
  type LocalizedText,
} from '@bus/shared'

export function toLocalizedText(text: ApiLocalizedText): LocalizedText {
  return {
    [AppLocaleType.ZH_TW]: text[AppLocaleType.ZH_TW],
    [AppLocaleType.EN]: text[AppLocaleType.EN],
    [AppLocaleType.JA]: '',
    [AppLocaleType.KO]: '',
  }
}
