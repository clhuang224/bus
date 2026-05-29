import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import i18n from '../../i18n'
import type { OpenGlobalModalPayload } from '../../slices/globalModalSlice'

export enum TdxHttpErrorStatus {
  UNAUTHORIZED = 401,
  URI_TOO_LONG = 414,
  RATE_LIMIT = 429
}

export enum BaseQueryErrorStatus {
  FETCH_ERROR = 'FETCH_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CUSTOM_ERROR = 'CUSTOM_ERROR'
}

function buildBusErrorModal(key: string): OpenGlobalModalPayload {
  return {
    title: i18n.t(`${key}.title`),
    message: i18n.t(`${key}.description`),
    variant: 'alert',
    confirmText: i18n.t('common.modal.refresh'),
    confirmAction: 'refresh'
  }
}

export function getTdxUnauthorizedModal(): OpenGlobalModalPayload {
  return buildBusErrorModal('messages.busService.unauthorized')
}

export function getTdxRateLimitModal(): OpenGlobalModalPayload {
  return buildBusErrorModal('messages.busService.rateLimited')
}

export function getTdxSystemErrorModal(): OpenGlobalModalPayload {
  return buildBusErrorModal('messages.busService.systemError')
}

function isFetchBaseQueryError(error: FetchBaseQueryError | SerializedError): error is FetchBaseQueryError {
  return 'status' in error
}

export function getTdxHttpErrorStatus(error: FetchBaseQueryError | SerializedError | null | undefined) {
  if (!error) {
    return null
  }

  if (!isFetchBaseQueryError(error)) {
    return null
  }

  if (typeof error.status === 'number') {
    return error.status
  }

  if (error.status === BaseQueryErrorStatus.PARSING_ERROR && typeof error.originalStatus === 'number') {
    return error.originalStatus
  }

  return null
}

export function isTdxRateLimitError(error: FetchBaseQueryError | SerializedError | null | undefined) {
  return getTdxHttpErrorStatus(error) === TdxHttpErrorStatus.RATE_LIMIT
}

function isTdxSystemStatus(status: number) {
  return status >= 500
}

export const getBusErrorModal = (error: FetchBaseQueryError) => {
  const tdxHttpStatus = getTdxHttpErrorStatus(error)

  if (tdxHttpStatus === TdxHttpErrorStatus.UNAUTHORIZED) {
    return getTdxUnauthorizedModal()
  }

  if (tdxHttpStatus === TdxHttpErrorStatus.RATE_LIMIT) {
    return null
  }

  if (tdxHttpStatus === TdxHttpErrorStatus.URI_TOO_LONG) {
    return null
  }

  switch (error.status) {
    case TdxHttpErrorStatus.UNAUTHORIZED:
    case TdxHttpErrorStatus.RATE_LIMIT:
    case BaseQueryErrorStatus.PARSING_ERROR:
      // A non-JSON or malformed TDX response is effectively a server-side outage.
      return getTdxSystemErrorModal()
    case BaseQueryErrorStatus.FETCH_ERROR:
    case BaseQueryErrorStatus.TIMEOUT_ERROR:
    case BaseQueryErrorStatus.CUSTOM_ERROR:
      return null
    default:
      if (typeof error.status === 'number' && isTdxSystemStatus(error.status)) {
        return getTdxSystemErrorModal()
      }

      return null
  }
}
