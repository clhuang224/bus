import { applyDecorators, type Type } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
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
  type: Type<unknown> | readonly Type<unknown>[]
}

interface ApiDefaultErrorResponsesOptions {
  exclude?: number[]
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

export function ApiDefaultErrorResponses({
  exclude = [],
}: ApiDefaultErrorResponsesOptions = {}) {
  const schema = { $ref: getSchemaPath(ApiErrorResponseDto) }
  const excludedStatuses = new Set(exclude)
  const decorators = [
    ApiExtraModels(ApiErrorDto, ApiErrorResponseDto),
    ...(excludedStatuses.has(400)
      ? []
      : [
          ApiBadRequestResponse({
            description: 'Request failed validation or parsing.',
            schema,
            example: createErrorExample(400, ErrorCode.SYSTEM_BAD_REQUEST),
          }),
        ]),
    ...(excludedStatuses.has(401)
      ? []
      : [
          ApiUnauthorizedResponse({
            description: 'Authentication or API key is required.',
            schema,
            example: createErrorExample(401, ErrorCode.SYSTEM_UNAUTHORIZED),
          }),
        ]),
    ...(excludedStatuses.has(403)
      ? []
      : [
          ApiForbiddenResponse({
            description: 'The authenticated caller is not allowed to do this.',
            schema,
            example: createErrorExample(403, ErrorCode.SYSTEM_FORBIDDEN),
          }),
        ]),
    ...(excludedStatuses.has(409)
      ? []
      : [
          ApiConflictResponse({
            description: 'Request failed due to a state conflict.',
            schema,
            example: createErrorExample(409, ErrorCode.SYSTEM_CONFLICT),
          }),
        ]),
    ...(excludedStatuses.has(500)
      ? []
      : [
          ApiInternalServerErrorResponse({
            description: 'Unexpected server error.',
            schema,
            example: createErrorExample(
              500,
              ErrorCode.SYSTEM_INTERNAL_SERVER_ERROR,
            ),
          }),
        ]),
  ]

  return applyDecorators(...decorators)
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
