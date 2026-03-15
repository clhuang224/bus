import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { OpenGlobalModalPayload } from '../../slices/globalModalSlice'

export enum TdxErrorStatus {
  RATE_LIMIT = 429,
  FETCH_ERROR = 'FETCH_ERROR'
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
    default:
      return null
  }
}
