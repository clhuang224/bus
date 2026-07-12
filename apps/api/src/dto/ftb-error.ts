import { HttpException, type HttpStatus } from '@nestjs/common'
import type { HttpExceptionOptions } from '@nestjs/common'
import { type ErrorCode } from '@bus/shared'
import { API_ERROR_MESSAGE_BY_CODE } from './api-response.messages.js'

interface FTBErrorOptions extends HttpExceptionOptions {
  message?: string
}

export class FTBError extends HttpException {
  constructor(
    readonly code: ErrorCode,
    status: HttpStatus,
    messageOrOptions: string | FTBErrorOptions = API_ERROR_MESSAGE_BY_CODE[
      code
    ],
    options?: HttpExceptionOptions,
  ) {
    const message =
      typeof messageOrOptions === 'string'
        ? messageOrOptions
        : (messageOrOptions.message ?? API_ERROR_MESSAGE_BY_CODE[code])
    const httpOptions =
      typeof messageOrOptions === 'string' ? options : messageOrOptions

    super(message, status, httpOptions)
  }
}
