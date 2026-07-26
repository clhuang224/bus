import { AppLocaleType, ErrorCode } from '@bus/shared'
import type { ApiErrorLocale } from './api-error-locale.js'

export const API_ERROR_MESSAGE_BY_LOCALE = {
  [AppLocaleType.ZH_TW]: {
    [ErrorCode.SYSTEM_BAD_REQUEST]: '請確認輸入資料是否正確。',
    [ErrorCode.SYSTEM_UNAUTHORIZED]: '請先完成授權。',
    [ErrorCode.SYSTEM_FORBIDDEN]: '你沒有權限執行這個操作。',
    [ErrorCode.SYSTEM_NOT_FOUND]: '找不到資料。',
    [ErrorCode.SYSTEM_CONFLICT]: '資料狀態衝突，請重新整理後再試一次。',
    [ErrorCode.SYSTEM_INTERNAL_SERVER_ERROR]: '系統發生錯誤，請稍後再試。',
    [ErrorCode.ROUTE_NOT_FOUND]: '找不到路線資料。',
  },
  [AppLocaleType.EN]: {
    [ErrorCode.SYSTEM_BAD_REQUEST]: 'Please check that the request is valid.',
    [ErrorCode.SYSTEM_UNAUTHORIZED]: 'Authentication is required.',
    [ErrorCode.SYSTEM_FORBIDDEN]: 'You are not allowed to perform this action.',
    [ErrorCode.SYSTEM_NOT_FOUND]: 'The requested resource was not found.',
    [ErrorCode.SYSTEM_CONFLICT]:
      'The request conflicts with the current resource state. Please refresh and try again.',
    [ErrorCode.SYSTEM_INTERNAL_SERVER_ERROR]:
      'An unexpected error occurred. Please try again later.',
    [ErrorCode.ROUTE_NOT_FOUND]: 'The requested route was not found.',
  },
} satisfies Record<ApiErrorLocale, Record<ErrorCode, string>>

export const API_ERROR_MESSAGE_BY_CODE =
  API_ERROR_MESSAGE_BY_LOCALE[AppLocaleType.ZH_TW]

export function getApiErrorMessage(
  code: ErrorCode,
  locale: ApiErrorLocale,
): string {
  return API_ERROR_MESSAGE_BY_LOCALE[locale][code]
}
