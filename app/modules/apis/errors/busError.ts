import type { SerializedError } from '@reduxjs/toolkit'
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

export const tdxUnauthorizedModal: OpenGlobalModalPayload = {
  title: '公車資料服務驗證失敗',
  message: '目前無法驗證公車資料服務，請稍後再試。',
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

function isFetchBaseQueryError(error: FetchBaseQueryError | SerializedError): error is FetchBaseQueryError {
  return 'status' in error
}

export function getTdxHttpErrorStatus(error: FetchBaseQueryError | SerializedError | null | undefined) {
  if (!error) {
    return null
  }

  if (!isFetchBaseQueryError(error)) {
    return null
  }

  if (typeof error.status === 'number') {
    return error.status
  }

  if (error.status === BaseQueryErrorStatus.PARSING_ERROR && typeof error.originalStatus === 'number') {
    return error.originalStatus
  }

  return null
}

export function isTdxRateLimitError(error: FetchBaseQueryError | SerializedError | null | undefined) {
  return getTdxHttpErrorStatus(error) === TdxHttpErrorStatus.RATE_LIMIT
}

function isTdxSystemStatus(status: number) {
  return status >= 500
}

export const getBusErrorModal = (error: FetchBaseQueryError) => {
  const tdxHttpStatus = getTdxHttpErrorStatus(error)

  if (tdxHttpStatus === TdxHttpErrorStatus.UNAUTHORIZED) {
    return tdxUnauthorizedModal
  }

  if (tdxHttpStatus === TdxHttpErrorStatus.RATE_LIMIT) {
    return null
  }

  switch (error.status) {
    case TdxHttpErrorStatus.UNAUTHORIZED:
    case TdxHttpErrorStatus.RATE_LIMIT:
    case BaseQueryErrorStatus.PARSING_ERROR:
      // A non-JSON or malformed TDX response is effectively a server-side outage.
      return tdxSystemErrorModal
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
