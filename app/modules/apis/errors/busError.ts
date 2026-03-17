import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { OpenGlobalModalPayload } from '../../slices/globalModalSlice'

export enum TdxErrorStatus {
  UNAUTHORIZED = 401,
  RATE_LIMIT = 429,
  FETCH_ERROR = 'FETCH_ERROR'
}

// Development only
const tdxUnauthorizedModal: OpenGlobalModalPayload = {
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

export const getBusErrorModal = (status: FetchBaseQueryError['status']) => {
  switch (status) {
    case TdxErrorStatus.RATE_LIMIT:
      return tdxRateLimitModal
    case TdxErrorStatus.FETCH_ERROR:
      return tdxSystemErrorModal
    case TdxErrorStatus.UNAUTHORIZED:
      return tdxUnauthorizedModal
    default:
      return null
  }
}
