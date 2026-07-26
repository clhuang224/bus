import { HttpStatus } from '@nestjs/common'
import { ErrorCode } from '@bus/shared'
import { API_ERROR_MESSAGE_BY_CODE } from './api-response.messages.js'
import { FTBError } from './ftb-error.js'

describe('FTBError', () => {
  it('uses the default message for the error code', () => {
    const error = new FTBError(ErrorCode.ROUTE_NOT_FOUND, HttpStatus.NOT_FOUND)

    expect(error.code).toBe(ErrorCode.ROUTE_NOT_FOUND)
    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND)
    expect(error.message).toBe(API_ERROR_MESSAGE_BY_CODE.ROUTE_NOT_FOUND)
    expect(error.customMessage).toBeUndefined()
  })

  it('accepts a custom message option', () => {
    const error = new FTBError(
      ErrorCode.ROUTE_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      { message: 'Custom route message.' },
    )

    expect(error.message).toBe('Custom route message.')
    expect(error.customMessage).toBe('Custom route message.')
  })

  it('keeps the original error cause', () => {
    const cause = new Error('Database failed.')
    const error = new FTBError(
      ErrorCode.ROUTE_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      {
        cause,
      },
    )

    expect(error.message).toBe(API_ERROR_MESSAGE_BY_CODE.ROUTE_NOT_FOUND)
    expect(error.cause).toBe(cause)
  })

  it('accepts a custom message with a cause', () => {
    const cause = new Error('Database failed.')
    const error = new FTBError(
      ErrorCode.ROUTE_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      {
        cause,
        message: 'Custom route message.',
      },
    )

    expect(error.message).toBe('Custom route message.')
    expect(error.cause).toBe(cause)
  })
})
