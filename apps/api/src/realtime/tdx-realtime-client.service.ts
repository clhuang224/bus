import { Injectable, Logger } from '@nestjs/common'
import {
  isTdxEstimatedArrival,
  isTdxRealtimeByFrequency,
  isTdxRealtimeNearStop,
  normalizeTdxRealtimeNearStop,
  RealtimeSourceFailure,
  type CityNameType,
  type RealtimeSourceResult,
  type TdxEstimatedArrival,
  type TdxRealtimeByFrequency,
  type TdxRealtimeNearStop,
} from '@bus/shared'
import { TdxAuthService } from '../tdx/tdx-auth.service.js'
import {
  createRequestTimeout,
  toRequestError,
} from '../tdx/tdx-request-timeout.js'

const TDX_BUS_BASE_URL = 'https://tdx.transportdata.tw/api/basic/v2/Bus'
const REQUESTS_PER_SECOND_ENV = 'TDX_REALTIME_REQUESTS_PER_SECOND'
/**
 * The TDX key allows 5 requests per second, shared with sync and the TDX
 * proxy, which this limiter cannot see. Leave headroom for them by default;
 * raise it once the proxy no longer uses the key.
 */
const DEFAULT_REQUESTS_PER_SECOND = 3
const RATE_LIMIT_COOLDOWN_MS = 3 * 1000
/**
 * Requests wait at most about this long for a per-second slot. Beyond that,
 * new requests fail fast as rate limited instead of piling up in memory and
 * reaching TDX after their callers have gone.
 */
const MAX_QUEUE_WAIT_SECONDS = 3
const REQUEST_TIMEOUT_MS = 10 * 1000
/**
 * ETA responses are the largest feed and TDX also bills by volume, so only
 * the fields the realtime calculator reads are requested.
 */
const ESTIMATED_ARRIVAL_FIELDS = [
  'PlateNumb',
  'StopUID',
  'StopID',
  'RouteUID',
  'SubRouteUID',
  'Direction',
  'StopSequence',
  'EstimateTime',
  'StopStatus',
]

interface TdxResponse {
  status: number
  /** Parsed JSON for a successful response; null otherwise. */
  payload: unknown
}

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
  protected readonly requestTimeoutMs = REQUEST_TIMEOUT_MS
  private readonly requestsPerSecond = getRequestsPerSecond()
  private readonly recentRequestTimes: number[] = []
  private requestQueue: Promise<void> = Promise.resolve()
  private queuedRequestCount = 0
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
      ESTIMATED_ARRIVAL_FIELDS,
    )
  }

  async fetchNearStops(
    city: CityNameType,
    routeUID: string,
  ): Promise<RealtimeSourceResult<TdxRealtimeNearStop>> {
    const result = await this.fetchSource(
      `/RealTimeNearStop/City/${city}`,
      routeUID,
      isTdxRealtimeNearStop,
    )

    return result.ok
      ? { ok: true, data: result.data.map(normalizeTdxRealtimeNearStop) }
      : result
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
    fields?: string[],
  ): Promise<RealtimeSourceResult<T>> {
    try {
      const payload = await this.fetchJson(path, routeUID, fields)

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

  private async fetchJson(
    path: string,
    routeUID: string,
    fields?: string[],
  ): Promise<unknown> {
    const url = new URL(`${TDX_BUS_BASE_URL}${path}`)
    url.searchParams.set(
      '$filter',
      `RouteUID eq '${escapeODataText(routeUID)}'`,
    )
    if (fields) url.searchParams.set('$select', fields.join(','))
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

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`TDX request failed: ${response.status} ${path}`)
    }

    return response.payload
  }

  /**
   * Sends one request and reads its body under the same timeout, so a
   * response that stalls after its headers cannot hang the snapshot.
   */
  private async request(url: URL, accessToken: string): Promise<TdxResponse> {
    await this.waitForRequestSlot(url.pathname)

    const timeout = createRequestTimeout(this.requestTimeoutMs)

    try {
      const response = await fetch(url, {
        signal: timeout.signal,
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        // Release the connection; error bodies are not used.
        await response.body?.cancel()
        return { status: response.status, payload: null }
      }

      return { status: response.status, payload: await response.json() }
    } catch (error) {
      throw toRequestError(
        error,
        timeout,
        'TDX realtime request',
        this.requestTimeoutMs,
      )
    } finally {
      timeout.cancel()
    }
  }

  /**
   * Waits until a request fits the per-second limit, one caller at a time.
   * Rejects at once when the queue already holds the maximum wait.
   */
  private waitForRequestSlot(path: string): Promise<void> {
    if (
      this.queuedRequestCount >=
      this.requestsPerSecond * MAX_QUEUE_WAIT_SECONDS
    ) {
      return Promise.reject(new TdxRateLimitedError(path))
    }

    this.queuedRequestCount += 1

    const slot = this.requestQueue.then(async () => {
      // Another request may hit a 429 while this one waits, so the cooldown
      // and the one-second window are checked again after every wait.
      for (;;) {
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

        if (this.recentRequestTimes.length < this.requestsPerSecond) break

        await sleep(this.recentRequestTimes[0] + 1000 - now)
      }

      this.recentRequestTimes.push(Date.now())
    })
    const settledSlot = slot.finally(() => {
      this.queuedRequestCount -= 1
    })

    // A failed slot must not block the callers queued behind it.
    this.requestQueue = settledSlot.catch(() => undefined)

    return settledSlot
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
