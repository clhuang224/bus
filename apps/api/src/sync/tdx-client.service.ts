import { Injectable } from '@nestjs/common'
import type { CityNameType, TdxBusRoute } from '@bus/shared'
import { SyncResourceType as PrismaSyncResourceType } from '../generated/prisma/enums.js'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  AdvisoryLockNamespace,
  TdxQuotaLockId,
} from './advisory-lock.constants.js'

const TDX_BUS_BASE_URL = 'https://tdx.transportdata.tw/api/basic/v2/Bus'
const TDX_TOKEN_ENDPOINT =
  'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token'
// TODO(sync): Add abort timeouts to token, upstream fetch, and body reads so a
// hung TDX connection cannot keep a sync run alive indefinitely.
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
  // TODO(sync): Share an in-flight token refresh promise so concurrent feature
  // syncs do not request duplicate access tokens.
  private quotaQueue: Promise<void> = Promise.resolve()

  constructor(private readonly prismaService: PrismaService) {}

  async fetchRoutes(
    city: CityNameType,
    syncRunId: string,
  ): Promise<TdxBusRoute[]> {
    return this.fetchJsonArray<TdxBusRoute>(`/Route/City/${city}`, {
      syncRunId,
      resource: PrismaSyncResourceType.ROUTES,
    })
  }

  private async fetchJsonArray<T>(
    path: string,
    context: TdxRequestContext,
  ): Promise<T[]> {
    const responseText = await this.fetchText(path, context)
    const payload: unknown = JSON.parse(responseText)

    if (!Array.isArray(payload)) {
      throw new Error(`Expected TDX response to be an array for ${path}.`)
    }

    // TODO(sync): Validate every upstream record and fail the city import when
    // any item is malformed instead of silently dropping data before soft-delete.
    return payload.filter((value) => this.isRecord(value)) as T[]
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
      this.clearAccessToken()

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

    try {
      const response = await fetch(url, {
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
      })

      return { response, reservation }
    } catch (error) {
      await this.finishRequestLog(reservation, {
        errorMessage: this.getErrorMessage(error),
      })
      throw error
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
    const { response, reservation } = loggedResponse

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
      if (
        !(
          error instanceof Error &&
          error.message.startsWith('TDX request failed:')
        )
      ) {
        await this.finishRequestLog(reservation, {
          statusCode: response.status,
          errorMessage: this.getErrorMessage(error),
        })
      }

      throw error
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

    const clientId = process.env.TDX_CLIENT_ID
    const clientSecret = process.env.TDX_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new TdxClientConfigError(
        'TDX_CLIENT_ID and TDX_CLIENT_SECRET are required to sync TDX data.',
      )
    }

    const tokenResponse = await fetch(TDX_TOKEN_ENDPOINT, {
      method: 'POST',
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

    const tokenPayload = (await tokenResponse.json()) as TdxTokenResponse

    this.accessToken = tokenPayload.access_token
    this.accessTokenExpiresAt = Date.now() + tokenPayload.expires_in * 1000

    return this.accessToken
  }

  private clearAccessToken(): void {
    this.accessToken = null
    this.accessTokenExpiresAt = 0
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
}
