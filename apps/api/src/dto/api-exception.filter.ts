import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import type { Response } from 'express'
import { ErrorCode, type ApiErrorResponse } from '@bus/shared'
import { API_ERROR_MESSAGE_BY_CODE } from './api-response.messages.js'

const ERROR_CODE_BY_STATUS: Readonly<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    const status = this.getStatus(exception)
    const code = this.getErrorCode(status)

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

  private getErrorCode(status: number): ErrorCode {
    return ERROR_CODE_BY_STATUS[status] ?? ErrorCode.INTERNAL_SERVER_ERROR
  }
}
