import { applyDecorators, type Type } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'
import type { ErrorCode } from '@bus/shared'
import {
  ApiErrorDto,
  ApiErrorResponseDto,
  ApiSuccessResponseDto,
} from './api-response.dto.js'
import { API_ERROR_MESSAGE_BY_CODE } from './api-response.messages.js'

interface ApiSuccessResponseOptions {
  description?: string
  status?: number
  type: Type<unknown> | readonly Type<unknown>[]
}

export function ApiSuccessResponse({
  description,
  status = 200,
  type,
}: ApiSuccessResponseOptions) {
  const isArray = isDtoTypeArray(type)
  if (isArray && type.length !== 1) {
    throw new Error(
      'ApiSuccessResponse expects "type" to be a single DTO or a 1-element array [Dto] for list responses.',
    )
  }

  const dataType = isArray ? type[0] : type
  if (!dataType) {
    throw new Error('ApiSuccessResponse expects a DTO type.')
  }

  const dataSchema = isArray
    ? {
        type: 'array',
        items: { $ref: getSchemaPath(dataType) },
      }
    : { $ref: getSchemaPath(dataType) }

  return applyDecorators(
    ApiExtraModels(ApiSuccessResponseDto, dataType),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiSuccessResponseDto) },
          {
            type: 'object',
            required: ['data'],
            properties: {
              data: dataSchema,
            },
          },
        ],
      },
    }),
  )
}

export function ApiErrorResponse({
  code,
  description,
  status,
}: {
  code: ErrorCode
  description: string
  status: number
}) {
  return applyDecorators(
    ApiExtraModels(ApiErrorDto, ApiErrorResponseDto),
    ApiResponse({
      status,
      description,
      schema: { $ref: getSchemaPath(ApiErrorResponseDto) },
      example: createErrorExample(status, code),
    }),
  )
}

function createErrorExample(status: number, code: ErrorCode) {
  return {
    status,
    error: {
      code,
      message: API_ERROR_MESSAGE_BY_CODE[code],
    },
  }
}

function isDtoTypeArray(
  type: ApiSuccessResponseOptions['type'],
): type is readonly Type<unknown>[] {
  return Array.isArray(type)
}
