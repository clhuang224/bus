import { AppLocaleType, type ErrorCode } from '@bus/shared'
import { en } from './locales/en.js'
import { zhTW } from './locales/zh-TW.js'

export const API_ERROR_MESSAGE_BY_LOCALE = {
  [AppLocaleType.ZH_TW]: zhTW,
  [AppLocaleType.EN]: en,
} as const

export const DEFAULT_API_ERROR_MESSAGE_BY_CODE =
  API_ERROR_MESSAGE_BY_LOCALE[AppLocaleType.ZH_TW]

export function getApiErrorMessage(
  code: ErrorCode,
  locale: AppLocaleType.ZH_TW | AppLocaleType.EN,
): string {
  return API_ERROR_MESSAGE_BY_LOCALE[locale][code]
}
