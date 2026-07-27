import { HttpException, type HttpStatus } from '@nestjs/common'
import type { HttpExceptionOptions } from '@nestjs/common'
import { type ErrorCode } from '@bus/shared'
import { DEFAULT_API_ERROR_MESSAGE_BY_CODE } from './api-response.messages.js'

interface FTBErrorOptions extends HttpExceptionOptions {
  message?: string
}

export class FTBError extends HttpException {
  readonly customMessage: string | undefined

  constructor(
    readonly code: ErrorCode,
    status: HttpStatus,
    options?: FTBErrorOptions,
  ) {
    const defaultMessage = DEFAULT_API_ERROR_MESSAGE_BY_CODE[code]
    const { message, ...exceptionOptions } = options ?? {}

    super(message ?? defaultMessage, status, exceptionOptions)
    this.customMessage = message
  }
}
