import type { ApiErrorResponse, ErrorCode } from '@bus/shared'

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false
  }

  const { error } = value

  return typeof error === 'object' && error !== null && 'code' in error
}

/** Whether a database API query error carries the given API error code. */
export function isDatabaseApiError(error: unknown, code: ErrorCode): boolean {
  if (typeof error !== 'object' || error === null || !('data' in error)) {
    return false
  }

  return isApiErrorResponse(error.data) && error.data.error.code === code
}
