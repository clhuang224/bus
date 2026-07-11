import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import type { Response } from 'express'
import { ErrorCode, type ApiErrorResponse } from '@bus/shared'
import { ApiErrorException } from './api-error.exception.js'
import { API_ERROR_MESSAGE_BY_CODE } from './api-response.messages.js'

const ERROR_CODE_BY_STATUS: Readonly<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.SYSTEM_BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.SYSTEM_UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.SYSTEM_FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.SYSTEM_NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.SYSTEM_CONFLICT,
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    const status = this.getStatus(exception)
    const code = this.getErrorCode(exception, status)

    response.status(status).json({
      status,
      error: {
        code,
        message: API_ERROR_MESSAGE_BY_CODE[code],
      },
    } satisfies ApiErrorResponse)
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus()
    }

    return HttpStatus.INTERNAL_SERVER_ERROR
  }

  private getErrorCode(exception: unknown, status: number): ErrorCode {
    if (exception instanceof ApiErrorException) {
      return exception.code
    }

    return (
      ERROR_CODE_BY_STATUS[status] ?? ErrorCode.SYSTEM_INTERNAL_SERVER_ERROR
    )
  }
}
