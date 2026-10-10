import { ErrorCode } from '@bus/shared'
import { describe, expect, it } from 'vitest'
import { isDatabaseApiError } from './databaseError'

describe('isDatabaseApiError', () => {
  const notFound = {
    status: 404,
    data: {
      status: 404,
      error: { code: ErrorCode.ROUTE_NOT_FOUND, message: 'Route not found' },
    },
  }

  it('matches an API error response with the same code', () => {
    expect(isDatabaseApiError(notFound, ErrorCode.ROUTE_NOT_FOUND)).toBe(true)
  })

  it('rejects other codes and non-API errors', () => {
    expect(isDatabaseApiError(notFound, ErrorCode.SYSTEM_NOT_FOUND)).toBe(false)
    expect(
      isDatabaseApiError(
        { status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' },
        ErrorCode.ROUTE_NOT_FOUND,
      ),
    ).toBe(false)
    expect(isDatabaseApiError(null, ErrorCode.ROUTE_NOT_FOUND)).toBe(false)
  })
})
