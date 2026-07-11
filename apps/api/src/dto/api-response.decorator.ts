import { applyDecorators, Type } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger'
import { ErrorCode } from '@bus/shared'
import {
  ApiErrorDto,
  ApiErrorResponseDto,
  ApiSuccessResponseDto,
} from './api-response.dto.js'
import { API_ERROR_MESSAGE_BY_CODE } from './api-response.messages.js'

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
      example: createErrorExample(400, ErrorCode.SYSTEM_BAD_REQUEST),
    }),
    ApiUnauthorizedResponse({
      description: 'Authentication or API key is required.',
      schema,
      example: createErrorExample(401, ErrorCode.SYSTEM_UNAUTHORIZED),
    }),
    ApiForbiddenResponse({
      description: 'The authenticated caller is not allowed to do this.',
      schema,
      example: createErrorExample(403, ErrorCode.SYSTEM_FORBIDDEN),
    }),
    ApiNotFoundResponse({
      description: 'Requested resource was not found.',
      schema,
      example: createErrorExample(404, ErrorCode.SYSTEM_NOT_FOUND),
    }),
    ApiInternalServerErrorResponse({
      description: 'Unexpected server error.',
      schema,
      example: createErrorExample(500, ErrorCode.SYSTEM_INTERNAL_SERVER_ERROR),
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
