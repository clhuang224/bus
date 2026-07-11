import { applyDecorators, Type } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger'
import {
  ApiErrorDto,
  ApiErrorResponseDto,
  ApiSuccessResponseDto,
} from './api-response.dto.js'

interface ApiSuccessResponseOptions {
  description?: string
  status?: number
  type: Type<unknown> | [Type<unknown>]
}

export function ApiSuccessResponse({
  description,
  status = 200,
  type,
}: ApiSuccessResponseOptions) {
  const isArray = Array.isArray(type)
  const dataType = isArray ? type[0] : type
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

export function ApiDefaultErrorResponses() {
  const schema = { $ref: getSchemaPath(ApiErrorResponseDto) }

  return applyDecorators(
    ApiExtraModels(ApiErrorDto, ApiErrorResponseDto),
    ApiBadRequestResponse({
      description: 'Request failed validation or parsing.',
      schema,
    }),
    ApiNotFoundResponse({
      description: 'Requested resource was not found.',
      schema,
    }),
    ApiInternalServerErrorResponse({
      description: 'Unexpected server error.',
      schema,
    }),
  )
}
