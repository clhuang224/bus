import { Injectable, Logger } from '@nestjs/common'
import type {
  CityNameType,
  TdxEstimatedArrival,
  TdxRealtimeByFrequency,
  TdxRealtimeNearStop,
} from '@bus/shared'
import { TdxAuthService } from '../tdx/tdx-auth.service.js'
import {
  createRequestTimeout,
  toRequestError,
} from '../tdx/tdx-request-timeout.js'
import {
  isTdxEstimatedArrival,
  isTdxRealtimeByFrequency,
  isTdxRealtimeNearStop,
} from './tdx-realtime.validator.js'

const TDX_BUS_BASE_URL = 'https://tdx.transportdata.tw/api/basic/v2/Bus'
const REQUESTS_PER_SECOND_ENV = 'TDX_REALTIME_REQUESTS_PER_SECOND'
const DEFAULT_REQUESTS_PER_SECOND = 5
const RATE_LIMIT_COOLDOWN_MS = 3 * 1000
const REQUEST_TIMEOUT_MS = 10 * 1000

export enum RealtimeSourceFailure {
  RATE_LIMITED = 'rate_limited',
  UNAVAILABLE = 'unavailable',
}

export type RealtimeSourceResult<T> =
  | { ok: true; data: T[] }
  | { ok: false; failure: RealtimeSourceFailure }

class TdxRateLimitedError extends Error {
  constructor(path: string) {
    super(`TDX rate limited realtime request: ${path}`)
    this.name = 'TdxRateLimitedError'
  }
}

/**
 * Calls TDX realtime endpoints for one route. Unlike sync requests, these are
 * not logged to the database or counted against the sync quota; an in-memory
 * per-second limit and a short cooldown after `429` keep the shared key safe.
 */
@Injectable()
export class TdxRealtimeClientService {
  private readonly logger = new Logger(TdxRealtimeClientService.name)
  private readonly requestsPerSecond = getRequestsPerSecond()
  private readonly recentRequestTimes: number[] = []
  private requestQueue: Promise<void> = Promise.resolve()
  private cooldownUntil = 0

  constructor(private readonly tdxAuthService: TdxAuthService) {}

  fetchEstimatedArrivals(
    city: CityNameType,
    routeUID: string,
  ): Promise<RealtimeSourceResult<TdxEstimatedArrival>> {
    return this.fetchSource(
      `/EstimatedTimeOfArrival/City/${city}`,
      routeUID,
      isTdxEstimatedArrival,
    )
  }

  fetchNearStops(
    city: CityNameType,
    routeUID: string,
  ): Promise<RealtimeSourceResult<TdxRealtimeNearStop>> {
    return this.fetchSource(
      `/RealTimeNearStop/City/${city}`,
      routeUID,
      isTdxRealtimeNearStop,
    )
  }

  fetchPositions(
    city: CityNameType,
    routeUID: string,
  ): Promise<RealtimeSourceResult<TdxRealtimeByFrequency>> {
    return this.fetchSource(
      `/RealTimeByFrequency/City/${city}`,
      routeUID,
      isTdxRealtimeByFrequency,
    )
  }

  private async fetchSource<T>(
    path: string,
    routeUID: string,
    isItem: (value: unknown) => value is T,
  ): Promise<RealtimeSourceResult<T>> {
    try {
      const payload = await this.fetchJson(path, routeUID)

      if (!Array.isArray(payload)) {
        throw new Error(`Expected TDX response to be an array for ${path}.`)
      }

      const data = payload.filter(isItem)
      const skippedCount = payload.length - data.length

      if (skippedCount > 0) {
        this.logger.warn(
          `Skipped ${skippedCount} malformed TDX records from ${path}.`,
        )
      }

      return { ok: true, data }
    } catch (error) {
      if (error instanceof TdxRateLimitedError) {
        return { ok: false, failure: RealtimeSourceFailure.RATE_LIMITED }
      }

      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`TDX realtime request failed: ${message}`)

      return { ok: false, failure: RealtimeSourceFailure.UNAVAILABLE }
    }
  }

  private async fetchJson(path: string, routeUID: string): Promise<unknown> {
    const url = new URL(`${TDX_BUS_BASE_URL}${path}`)
    url.searchParams.set(
      '$filter',
      `RouteUID eq '${escapeODataText(routeUID)}'`,
    )
    url.searchParams.set('$format', 'JSON')

    const accessToken = await this.tdxAuthService.getAccessToken()
    let response = await this.request(url, accessToken)

    if (response.status === 401) {
      this.tdxAuthService.clearAccessToken(accessToken)
      response = await this.request(
        url,
        await this.tdxAuthService.getAccessToken(),
      )
    }

    if (response.status === 429) {
      this.cooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS
      throw new TdxRateLimitedError(path)
    }

    if (!response.ok) {
      throw new Error(`TDX request failed: ${response.status} ${path}`)
    }

    return response.json()
  }

  private async request(url: URL, accessToken: string): Promise<Response> {
    await this.waitForRequestSlot(url.pathname)

    const timeout = createRequestTimeout(REQUEST_TIMEOUT_MS)

    try {
      return await fetch(url, {
        signal: timeout.signal,
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
      })
    } catch (error) {
      throw toRequestError(
        error,
        timeout,
        'TDX realtime request',
        REQUEST_TIMEOUT_MS,
      )
    } finally {
      timeout.cancel()
    }
  }

  /** Waits until a request fits the per-second limit, one caller at a time. */
  private waitForRequestSlot(path: string): Promise<void> {
    const slot = this.requestQueue.then(async () => {
      if (Date.now() < this.cooldownUntil) {
        throw new TdxRateLimitedError(path)
      }

      const now = Date.now()
      while (
        this.recentRequestTimes.length > 0 &&
        now - this.recentRequestTimes[0] >= 1000
      ) {
        this.recentRequestTimes.shift()
      }

      if (this.recentRequestTimes.length >= this.requestsPerSecond) {
        await sleep(this.recentRequestTimes[0] + 1000 - now)
        this.recentRequestTimes.shift()
      }

      this.recentRequestTimes.push(Date.now())
    })

    // A failed slot must not block the callers queued behind it.
    this.requestQueue = slot.catch(() => undefined)

    return slot
  }
}

function getRequestsPerSecond(): number {
  const configured = Number(process.env[REQUESTS_PER_SECOND_ENV])

  return Number.isInteger(configured) && configured > 0
    ? configured
    : DEFAULT_REQUESTS_PER_SECOND
}

function escapeODataText(value: string): string {
  return value.replaceAll("'", "''")
}

function sleep(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.max(durationMs, 0))
  })
}
