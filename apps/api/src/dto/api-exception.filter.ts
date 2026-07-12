import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Response } from 'express'
import { ErrorCode, type ApiErrorResponse } from '@bus/shared'
import { FTBError } from './ftb-error.js'
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
  private readonly logger = new Logger(ApiExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    const status = this.getStatus(exception)
    const code = this.getErrorCode(exception, status)
    const message =
      exception instanceof FTBError
        ? exception.message
        : API_ERROR_MESSAGE_BY_CODE[code]

    this.logUnexpectedServerError(exception, status)

    response.status(status).json({
      status,
      error: {
        code,
        message,
      },
    } satisfies ApiErrorResponse)
  }

  private logUnexpectedServerError(exception: unknown, status: number): void {
    if (exception instanceof FTBError || status < 500) return

    if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack)
      return
    }

    this.logger.error(String(exception))
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus()
    }

    return HttpStatus.INTERNAL_SERVER_ERROR
  }

  private getErrorCode(exception: unknown, status: number): ErrorCode {
    if (exception instanceof FTBError) {
      return exception.code
    }

    return (
      ERROR_CODE_BY_STATUS[status] ?? ErrorCode.SYSTEM_INTERNAL_SERVER_ERROR
    )
  }
}
