import { HttpException, HttpStatus } from '@nestjs/common'
import { ErrorCode } from '@bus/shared'
import { API_ERROR_MESSAGE_BY_CODE } from './api-response.messages.js'

export class FTBError extends HttpException {
  constructor(
    readonly code: ErrorCode,
    status: HttpStatus,
    message = API_ERROR_MESSAGE_BY_CODE[code],
  ) {
    super(message, status)
  }
}
