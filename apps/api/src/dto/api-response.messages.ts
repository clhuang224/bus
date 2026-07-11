import { ErrorCode } from '@bus/shared'

export const API_ERROR_MESSAGE_BY_CODE = {
  [ErrorCode.BAD_REQUEST]: '請確認輸入資料是否正確。',
  [ErrorCode.UNAUTHORIZED]: '請先完成授權。',
  [ErrorCode.FORBIDDEN]: '你沒有權限執行這個操作。',
  [ErrorCode.NOT_FOUND]: '找不到資料。',
  [ErrorCode.CONFLICT]: '資料狀態衝突，請重新整理後再試一次。',
  [ErrorCode.INTERNAL_SERVER_ERROR]: '系統發生錯誤，請稍後再試。',
} satisfies Record<ErrorCode, string>
