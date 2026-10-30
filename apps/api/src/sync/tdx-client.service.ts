import { Injectable } from '@nestjs/common'
import type {
  CityNameType,
  TdxBusRoute,
  TdxStation,
  TdxStationGroup,
  TdxStop,
  TdxStopOfRoute,
} from '@bus/shared'
import { SyncResourceType as PrismaSyncResourceType } from '../generated/prisma/enums.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { TdxAuthService } from '../tdx/tdx-auth.service.js'
import {
  createRequestTimeout,
  toRequestError,
  type RequestTimeout,
} from '../tdx/tdx-request-timeout.js'
import {
  AdvisoryLockNamespace,
  TdxQuotaLockId,
} from './advisory-lock.constants.js'
import { isTdxBusRoute } from './validators/tdx-route.validator.js'
import {
  isTdxStation,
  isTdxStationGroup,
  isTdxStop,
  isTdxStopOfRoute,
} from './validators/tdx-stop-data.validator.js'
import { getSyncErrorMessage } from './sync-error-message.js'

const TDX_BUS_BASE_URL = 'https://tdx.transportdata.tw/api/basic/v2/Bus'
const REQUEST_LIMIT_PER_MINUTE = 5
const BASIC_MONTHLY_POINTS = 3
const REQUESTS_PER_POINT = 1500
const BYTES_PER_POINT = 150 * 1024 * 1024
const MONTHLY_REQUEST_LIMIT = BASIC_MONTHLY_POINTS * REQUESTS_PER_POINT
const MONTHLY_BYTE_LIMIT = BASIC_MONTHLY_POINTS * BYTES_PER_POINT
const QUOTA_WINDOW_MS = 60_000

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
  private quotaQueue: Promise<void> = Promise.resolve()

  constructor(
    private readonly prismaService: PrismaService,
    private readonly tdxAuthService: TdxAuthService,
  ) {}

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

  async fetchStationGroups(
    city: CityNameType,
    syncRunId: string,
  ): Promise<TdxStationGroup[]> {
    return this.fetchJsonArray(
      `/StationGroup/City/${city}`,
      {
        syncRunId,
        resource: PrismaSyncResourceType.STOPS,
      },
      isTdxStationGroup,
    )
  }

  async fetchStations(
    city: CityNameType,
    syncRunId: string,
  ): Promise<TdxStation[]> {
    return this.fetchJsonArray(
      `/Station/City/${city}`,
      {
        syncRunId,
        resource: PrismaSyncResourceType.STOPS,
      },
      isTdxStation,
    )
  }

  async fetchStops(city: CityNameType, syncRunId: string): Promise<TdxStop[]> {
    return this.fetchJsonArray(
      `/Stop/City/${city}`,
      {
        syncRunId,
        resource: PrismaSyncResourceType.STOPS,
      },
      isTdxStop,
    )
  }

  async fetchStopOfRoutes(
    city: CityNameType,
    syncRunId: string,
  ): Promise<TdxStopOfRoute[]> {
    return this.fetchJsonArray(
      `/StopOfRoute/City/${city}`,
      {
        syncRunId,
        resource: PrismaSyncResourceType.STOPS,
      },
      isTdxStopOfRoute,
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

    const accessToken = await this.tdxAuthService.getAccessToken()
    const response = await this.fetchWithQuota(url, accessToken, context)

    if (response.response.status === 401) {
      await this.readResponseText(response, url, false)
      this.tdxAuthService.clearAccessToken(accessToken)

      const refreshedAccessToken = await this.tdxAuthService.getAccessToken()
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
    const timeout = createRequestTimeout()

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
      const requestError = toRequestError(error, timeout, 'TDX request')
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
        : this.createHttpErrorMessage(response, responseText, url)

      await this.finishRequestLog(reservation, {
        statusCode: response.status,
        responseBytes: new TextEncoder().encode(responseText).byteLength,
        errorMessage,
      })

      if (errorMessage && throwOnHttpError) throw new Error(errorMessage)

      return responseText
    } catch (error) {
      const requestError = toRequestError(error, timeout, 'TDX request')

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

  private createHttpErrorMessage(
    response: Response,
    responseText: string,
    url: URL,
  ): string {
    const responseDetail = responseText.trim().replace(/\s+/g, ' ')
    const maxDetailLength = 1000
    const truncatedDetail =
      responseDetail.length > maxDetailLength
        ? `${responseDetail.slice(0, maxDetailLength)}...`
        : responseDetail

    if (!truncatedDetail) {
      return `TDX request failed: ${response.status} ${url.pathname}`
    }

    return `TDX request failed: ${response.status} ${url.pathname}: ${truncatedDetail}`
  }

  private getErrorMessage(error: unknown): string {
    return getSyncErrorMessage(error)
  }
}
