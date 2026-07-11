import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { map, Observable } from 'rxjs'
import type { Response } from 'express'
import type { ApiSuccessResponse } from '@bus/shared'

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<unknown> | undefined> {
    return next.handle().pipe(
      map((data: unknown) => {
        const response = context.switchToHttp().getResponse<Response>()
        const status = response.statusCode

        if (status === 204) return undefined

        return {
          status,
          message: null,
          data,
        }
      }),
    )
  }
}
