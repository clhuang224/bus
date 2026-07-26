import { ErrorCode } from '@bus/shared'

export const en = {
  [ErrorCode.SYSTEM_BAD_REQUEST]: 'Please check that the request is valid.',
  [ErrorCode.SYSTEM_UNAUTHORIZED]: 'Authentication is required.',
  [ErrorCode.SYSTEM_FORBIDDEN]: 'You are not allowed to perform this action.',
  [ErrorCode.SYSTEM_NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.SYSTEM_CONFLICT]:
    'The request conflicts with the current resource state. Please refresh and try again.',
  [ErrorCode.SYSTEM_INTERNAL_SERVER_ERROR]:
    'An unexpected error occurred. Please try again later.',
  [ErrorCode.ROUTE_NOT_FOUND]: 'The requested route was not found.',
} satisfies Record<ErrorCode, string>
