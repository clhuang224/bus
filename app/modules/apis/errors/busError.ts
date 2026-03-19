import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { OpenGlobalModalPayload } from '../../slices/globalModalSlice'

export enum TdxHttpErrorStatus {
  UNAUTHORIZED = 401,
  RATE_LIMIT = 429
}

export enum BaseQueryErrorStatus {
  FETCH_ERROR = 'FETCH_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CUSTOM_ERROR = 'CUSTOM_ERROR'
}

// Development only
export const tdxUnauthorizedModal: OpenGlobalModalPayload = {
  title: 'TDX TOKEN 已過期',
  message: '你的 TDX TOKEN 已過期，請更新 .env.local 並重新執行專案。',
  variant: 'alert',
  confirmText: '重整頁面',
  confirmAction: 'refresh'
}

export const tdxRateLimitModal: OpenGlobalModalPayload = {
  title: '目前查詢人數較多',
  message: '系統暫時無法取得公車資料，請稍候一段時間再試。',
  variant: 'alert',
  confirmText: '重整頁面',
  confirmAction: 'refresh'
}

export const tdxSystemErrorModal: OpenGlobalModalPayload = {
  title: '系統暫時無法使用',
  message: '目前無法取得公車資料，請稍後再試。',
  variant: 'alert',
  confirmText: '重整頁面',
  confirmAction: 'refresh'
}

function isTdxSystemStatus(status: number) {
  return status >= 500
}

export const getBusErrorModal = (error: FetchBaseQueryError) => {
  switch (error.status) {
    case TdxHttpErrorStatus.UNAUTHORIZED:
      return tdxUnauthorizedModal
    case TdxHttpErrorStatus.RATE_LIMIT:
      return null
    case BaseQueryErrorStatus.PARSING_ERROR:
      switch (error.originalStatus) {
        case TdxHttpErrorStatus.UNAUTHORIZED:
          return tdxUnauthorizedModal
        case TdxHttpErrorStatus.RATE_LIMIT:
          return null
        default:
          // A non-JSON or malformed TDX response is effectively a server-side outage.
          return tdxSystemErrorModal
      }
    case BaseQueryErrorStatus.FETCH_ERROR:
    case BaseQueryErrorStatus.TIMEOUT_ERROR:
    case BaseQueryErrorStatus.CUSTOM_ERROR:
      return null
    default:
      if (typeof error.status === 'number' && isTdxSystemStatus(error.status)) {
        return tdxSystemErrorModal
      }

      return null
  }
}
