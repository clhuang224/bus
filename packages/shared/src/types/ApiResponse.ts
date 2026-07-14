import type { ErrorCode } from '../enums/ErrorCode.js'

export interface ApiSuccessResponse<T> {
  status: number
  message: string | null
  data: T
}

export interface ApiErrorResponse {
  status: number
  error: {
    code: ErrorCode
    message: string
  }
}

export interface PaginatedData<T> {
  list: T[]
  page_index: number
  page_size: number
  total: number
}
