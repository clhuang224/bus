import { describe, expect, it } from 'vitest'
import {
  getTdxHttpErrorStatus,
  getBusErrorModal,
  isTdxRateLimitError,
  tdxSystemErrorModal,
  tdxUnauthorizedModal
} from './busError'

describe('getTdxHttpErrorStatus', () => {
  it('returns the numeric status for direct HTTP errors', () => {
    expect(getTdxHttpErrorStatus({
      status: 429,
      data: {}
    })).toBe(429)
  })

  it('returns the original status for parsing errors', () => {
    expect(getTdxHttpErrorStatus({
      status: 'PARSING_ERROR',
      originalStatus: 429,
      data: 'Too Many Requests',
      error: 'SyntaxError'
    })).toBe(429)
  })

  it('returns null for non-http base query errors', () => {
    expect(getTdxHttpErrorStatus({
      status: 'FETCH_ERROR',
      error: 'Failed to fetch'
    })).toBeNull()
  })
})

describe('isTdxRateLimitError', () => {
  it('returns true for direct 429 errors', () => {
    expect(isTdxRateLimitError({
      status: 429,
      data: {}
    })).toBe(true)
  })

  it('returns true for parsing errors wrapped around a 429 response', () => {
    expect(isTdxRateLimitError({
      status: 'PARSING_ERROR',
      originalStatus: 429,
      data: 'Too Many Requests',
      error: 'SyntaxError'
    })).toBe(true)
  })

  it('returns false for non-rate-limit errors', () => {
    expect(isTdxRateLimitError({
      status: 500,
      data: {}
    })).toBe(false)
  })
})

describe('getBusErrorModal', () => {
  it('returns the unauthorized modal for numeric 401 errors', () => {
    expect(
      getBusErrorModal({
        status: 401,
        data: {}
      })
    ).toBe(tdxUnauthorizedModal)
  })

  it('returns the unauthorized modal when a 401 is wrapped as a parsing error', () => {
    expect(
      getBusErrorModal({
        status: 'PARSING_ERROR',
        originalStatus: 401,
        data: 'Unauthorized',
        error: 'SyntaxError: Unexpected token U in JSON at position 0'
      })
    ).toBe(tdxUnauthorizedModal)
  })

  it('does not open a modal for 429 errors', () => {
    expect(
      getBusErrorModal({
        status: 429,
        data: {}
      })
    ).toBeNull()
  })

  it('does not open a modal when a 429 is wrapped as a parsing error', () => {
    expect(
      getBusErrorModal({
        status: 'PARSING_ERROR',
        originalStatus: 429,
        data: 'Too Many Requests',
        error: 'SyntaxError: Unexpected token T in JSON at position 0'
      })
    ).toBeNull()
  })

  it('returns the system modal for 5xx errors', () => {
    expect(
      getBusErrorModal({
        status: 503,
        data: {}
      })
    ).toBe(tdxSystemErrorModal)
  })

  it('returns the system modal for parsing errors from non-auth non-rate-limit responses', () => {
    expect(
      getBusErrorModal({
        status: 'PARSING_ERROR',
        originalStatus: 500,
        data: '<html>server error</html>',
        error: 'SyntaxError: Unexpected token < in JSON at position 0'
      })
    ).toBe(tdxSystemErrorModal)
  })

  it('does not open a modal for fetch errors', () => {
    expect(
      getBusErrorModal({
        status: 'FETCH_ERROR',
        error: 'Failed to fetch'
      })
    ).toBeNull()
  })

  it('does not open a modal for timeout errors', () => {
    expect(
      getBusErrorModal({
        status: 'TIMEOUT_ERROR',
        error: 'Timed out'
      })
    ).toBeNull()
  })

  it('does not open a modal for custom errors', () => {
    expect(
      getBusErrorModal({
        status: 'CUSTOM_ERROR',
        error: 'Custom error',
        data: {}
      })
    ).toBeNull()
  })

  it('does not open a modal for other 4xx errors', () => {
    expect(
      getBusErrorModal({
        status: 404,
        data: {}
      })
    ).toBeNull()
  })
})
