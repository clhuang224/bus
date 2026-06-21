import { Injectable } from '@nestjs/common'
import type { CityNameType, TdxBusRoute } from '@bus/shared'
import { SyncResourceType as PrismaSyncResourceType } from '../generated/prisma/enums.js'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  AdvisoryLockNamespace,
  TdxQuotaLockId,
} from './advisory-lock.constants.js'
import { isTdxBusRoute } from './validators/tdx-route.validator.js'

const TDX_BUS_BASE_URL = 'https://tdx.transportdata.tw/api/basic/v2/Bus'
const TDX_TOKEN_ENDPOINT =
  'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token'
const REQUEST_TIMEOUT_MS = 30 * 1000
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000
const REQUEST_LIMIT_PER_MINUTE = 5
const BASIC_MONTHLY_POINTS = 3
const REQUESTS_PER_POINT = 1500
const BYTES_PER_POINT = 150 * 1024 * 1024
const MONTHLY_REQUEST_LIMIT = BASIC_MONTHLY_POINTS * REQUESTS_PER_POINT
const MONTHLY_BYTE_LIMIT = BASIC_MONTHLY_POINTS * BYTES_PER_POINT
const QUOTA_WINDOW_MS = 60 * 1000

interface TdxTokenResponse {
  access_token: string
  expires_in: number
}

interface TdxRequestContext {
  syncRunId: string
  resource: PrismaSyncResourceType
}

interface RequestReservation {
  id: string
  startedAt: number
}

interface QuotaReservation {
  type: 'reserved'
  reservation: RequestReservation
}

interface QuotaWait {
  type: 'wait'
  retryAt: Date
}

type QuotaResult = QuotaReservation | QuotaWait

interface LoggedResponse {
  response: Response
  reservation: RequestReservation
  timeout: RequestTimeout
}

interface RequestTimeout {
  signal: AbortSignal
  cancel: () => void
  didTimeout: () => boolean
}

export class TdxClientConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TdxClientConfigError'
  }
}

export class TdxMonthlyQuotaExceededError extends Error {
  constructor(
    message: string,
    readonly retry_at: Date,
  ) {
    super(message)
    this.name = 'TdxMonthlyQuotaExceededError'
  }
}

@Injectable()
export class TdxClientService {
  private accessToken: string | null = null
  private accessTokenExpiresAt = 0
  private accessTokenRefresh: Promise<string> | null = null
  private quotaQueue: Promise<void> = Promise.resolve()

  constructor(private readonly prismaService: PrismaService) {}

  async fetchRoutes(
    city: CityNameType,
    syncRunId: string,
  ): Promise<TdxBusRoute[]> {
    return this.fetchJsonArray(
      `/Route/City/${city}`,
      {
        syncRunId,
        resource: PrismaSyncResourceType.ROUTES,
      },
      isTdxBusRoute,
    )
  }

  private async fetchJsonArray<T>(
    path: string,
    context: TdxRequestContext,
    isItem: (value: unknown) => value is T,
  ): Promise<T[]> {
    const responseText = await this.fetchText(path, context)
    const payload: unknown = JSON.parse(responseText)

    if (!Array.isArray(payload)) {
      throw new Error(`Expected TDX response to be an array for ${path}.`)
    }

    const items: T[] = []

    for (const [index, value] of payload.entries()) {
      if (!isItem(value)) {
        throw new Error(`Invalid TDX record at index ${index} for ${path}.`)
      }

      items.push(value)
    }

    return items
  }

  private async fetchText(
    path: string,
    context: TdxRequestContext,
  ): Promise<string> {
    const url = new URL(`${TDX_BUS_BASE_URL}${path}`)
    url.searchParams.set('$format', 'JSON')

    const accessToken = await this.getAccessToken()
    const response = await this.fetchWithQuota(url, accessToken, context)

    if (response.response.status === 401) {
      await this.readResponseText(response, url, false)
      this.clearAccessToken(accessToken)

      const refreshedAccessToken = await this.getAccessToken()
      const retryResponse = await this.fetchWithQuota(
        url,
        refreshedAccessToken,
        context,
      )

      return this.readResponseText(retryResponse, url)
    }

    return this.readResponseText(response, url)
  }

  private async fetchWithQuota(
    url: URL,
    accessToken: string,
    context: TdxRequestContext,
  ): Promise<LoggedResponse> {
    const reservation = await this.acquireQuotaSlot(url, context)
    const timeout = this.createRequestTimeout()

    try {
      const response = await fetch(url, {
        signal: timeout.signal,
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
      })

      return { response, reservation, timeout }
    } catch (error) {
      timeout.cancel()
      const requestError = this.toRequestError(error, timeout, 'TDX request')
      await this.finishRequestLog(reservation, {
        errorMessage: this.getErrorMessage(requestError),
      })
      throw requestError
    }
  }

  private async acquireQuotaSlot(
    url: URL,
    context: TdxRequestContext,
  ): Promise<RequestReservation> {
    const previous = this.quotaQueue
    let release!: () => void

    this.quotaQueue = new Promise<void>((resolve) => {
      release = resolve
    })

    await previous

    try {
      while (true) {
        const result = await this.reservePersistedQuotaSlot(url, context)

        if (result.type === 'reserved') return result.reservation

        await this.sleep(result.retryAt.getTime() - Date.now())
      }
    } finally {
      release()
    }
  }

  private reservePersistedQuotaSlot(
    url: URL,
    context: TdxRequestContext,
  ): Promise<QuotaResult> {
    return this.prismaService.$transaction(async (transaction) => {
      await transaction.$executeRaw`
        SELECT pg_advisory_xact_lock(
          ${AdvisoryLockNamespace.TDX_QUOTA},
          ${TdxQuotaLockId.GLOBAL}
        )
      `

      const now = new Date()
      const monthStart = this.getMonthStart(now)
      const [monthlyRequestCount, monthlyBytes, recentRequests] =
        await Promise.all([
          transaction.tdxRequestLog.count({
            where: { requested_at: { gte: monthStart } },
          }),
          transaction.tdxRequestLog.aggregate({
            where: { requested_at: { gte: monthStart } },
            _sum: { response_bytes: true },
          }),
          transaction.tdxRequestLog.findMany({
            where: {
              requested_at: {
                gt: new Date(now.getTime() - QUOTA_WINDOW_MS),
              },
            },
            orderBy: { requested_at: 'asc' },
            select: { requested_at: true },
            take: REQUEST_LIMIT_PER_MINUTE,
          }),
        ])

      if (monthlyRequestCount >= MONTHLY_REQUEST_LIMIT) {
        throw new TdxMonthlyQuotaExceededError(
          'TDX monthly request quota has been exhausted.',
          this.getNextMonthStart(now),
        )
      }

      if ((monthlyBytes._sum.response_bytes ?? 0) >= MONTHLY_BYTE_LIMIT) {
        throw new TdxMonthlyQuotaExceededError(
          'TDX monthly response byte quota has been exhausted.',
          this.getNextMonthStart(now),
        )
      }

      if (recentRequests.length >= REQUEST_LIMIT_PER_MINUTE) {
        return {
          type: 'wait',
          retryAt: new Date(
            recentRequests[0].requested_at.getTime() + QUOTA_WINDOW_MS,
          ),
        }
      }

      const requestLog = await transaction.tdxRequestLog.create({
        data: {
          sync_run_id: context.syncRunId,
          resource: context.resource,
          method: 'GET',
          path: `${url.pathname}${url.search}`,
          request_bytes: new TextEncoder().encode(url.toString()).byteLength,
          requested_at: now,
        },
        select: { id: true },
      })

      return {
        type: 'reserved',
        reservation: {
          id: requestLog.id,
          startedAt: Date.now(),
        },
      }
    })
  }

  private async readResponseText(
    loggedResponse: LoggedResponse,
    url: URL,
    throwOnHttpError = true,
  ): Promise<string> {
    const { response, reservation, timeout } = loggedResponse

    try {
      const responseText = await response.text()
      const errorMessage = response.ok
        ? null
        : `TDX request failed: ${response.status} ${url.pathname}`

      await this.finishRequestLog(reservation, {
        statusCode: response.status,
        responseBytes: new TextEncoder().encode(responseText).byteLength,
        errorMessage,
      })

      if (errorMessage && throwOnHttpError) throw new Error(errorMessage)

      return responseText
    } catch (error) {
      const requestError = this.toRequestError(error, timeout, 'TDX request')

      if (
        !(
          requestError instanceof Error &&
          requestError.message.startsWith('TDX request failed:')
        )
      ) {
        await this.finishRequestLog(reservation, {
          statusCode: response.status,
          errorMessage: this.getErrorMessage(requestError),
        })
      }

      throw requestError
    } finally {
      timeout.cancel()
    }
  }

  private finishRequestLog(
    reservation: RequestReservation,
    {
      statusCode,
      responseBytes,
      errorMessage,
    }: {
      statusCode?: number
      responseBytes?: number
      errorMessage: string | null
    },
  ): Promise<unknown> {
    return this.prismaService.tdxRequestLog.update({
      where: { id: reservation.id },
      data: {
        status_code: statusCode,
        response_bytes: responseBytes,
        duration_ms: Date.now() - reservation.startedAt,
        error_message: errorMessage,
      },
    })
  }

  private async getAccessToken(): Promise<string> {
    if (
      this.accessToken &&
      Date.now() + TOKEN_REFRESH_BUFFER_MS < this.accessTokenExpiresAt
    ) {
      return this.accessToken
    }

    if (this.accessTokenRefresh) return this.accessTokenRefresh

    const refresh = this.requestAccessToken()
    this.accessTokenRefresh = refresh

    try {
      return await refresh
    } finally {
      if (this.accessTokenRefresh === refresh) this.accessTokenRefresh = null
    }
  }

  private async requestAccessToken(): Promise<string> {
    const clientId = process.env.TDX_CLIENT_ID
    const clientSecret = process.env.TDX_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new TdxClientConfigError(
        'TDX_CLIENT_ID and TDX_CLIENT_SECRET are required to sync TDX data.',
      )
    }

    const timeout = this.createRequestTimeout()

    try {
      const tokenResponse = await fetch(TDX_TOKEN_ENDPOINT, {
        method: 'POST',
        signal: timeout.signal,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      })

      if (!tokenResponse.ok) {
        const responseText = (await tokenResponse.text()).trim()
        const responseDetail = responseText ? `: ${responseText}` : ''

        throw new Error(
          `Failed to get TDX token: ${tokenResponse.status}${responseDetail}`,
        )
      }

      const tokenPayload: unknown = await tokenResponse.json()

      if (!this.isTdxTokenResponse(tokenPayload)) {
        throw new Error('TDX token response is malformed.')
      }

      this.accessToken = tokenPayload.access_token
      this.accessTokenExpiresAt = Date.now() + tokenPayload.expires_in * 1000

      return this.accessToken
    } catch (error) {
      throw this.toRequestError(error, timeout, 'TDX token request')
    } finally {
      timeout.cancel()
    }
  }

  private clearAccessToken(rejectedToken: string): void {
    if (this.accessToken !== rejectedToken) return

    this.accessToken = null
    this.accessTokenExpiresAt = 0
  }

  private createRequestTimeout(): RequestTimeout {
    const controller = new AbortController()
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, REQUEST_TIMEOUT_MS)
    timer.unref()

    return {
      signal: controller.signal,
      cancel: () => clearTimeout(timer),
      didTimeout: () => timedOut,
    }
  }

  private toRequestError(
    error: unknown,
    timeout: RequestTimeout,
    requestName: string,
  ): unknown {
    if (!timeout.didTimeout()) return error

    return new Error(
      `${requestName} timed out after ${REQUEST_TIMEOUT_MS}ms.`,
      {
        cause: error,
      },
    )
  }

  private getMonthStart(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  }

  private getNextMonthStart(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
  }

  private sleep(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, Math.max(durationMs, 0))
    })
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }

  private isTdxTokenResponse(value: unknown): value is TdxTokenResponse {
    return (
      this.isRecord(value) &&
      this.isNonEmptyString(value.access_token) &&
      typeof value.expires_in === 'number' &&
      Number.isFinite(value.expires_in) &&
      value.expires_in > 0
    )
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0
  }
}
