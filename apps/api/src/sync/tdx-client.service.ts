import { Injectable } from '@nestjs/common'
import type { CityNameType, TdxBusRoute } from '@bus/shared'

const TDX_BUS_BASE_URL = 'https://tdx.transportdata.tw/api/basic/v2/Bus'
const TDX_TOKEN_ENDPOINT =
  'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token'
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000
const REQUEST_LIMIT_PER_MINUTE = 5
const BASIC_MONTHLY_POINTS = 3
const REQUESTS_PER_POINT = 1500
const BYTES_PER_POINT = 150 * 1024 * 1024
const MONTHLY_REQUEST_LIMIT = BASIC_MONTHLY_POINTS * REQUESTS_PER_POINT
const MONTHLY_BYTE_LIMIT = BASIC_MONTHLY_POINTS * BYTES_PER_POINT

interface TdxTokenResponse {
  access_token: string
  expires_in: number
}

interface TdxUsageState {
  month_key: string
  requests: number
  bytes: number
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
  // TODO(sync): Move monthly quota accounting to persisted tdx_request_log rows.
  // In-memory state is okay for minute-level pacing, but monthly usage must
  // survive API restarts before this is used for real sync jobs.
  private accessToken: string | null = null
  private accessTokenExpiresAt = 0
  private requestTimestamps: number[] = []
  private usageState: TdxUsageState = {
    month_key: this.getMonthKey(new Date()),
    requests: 0,
    bytes: 0,
  }

  async fetchRoutes(city: CityNameType): Promise<TdxBusRoute[]> {
    return this.fetchJsonArray<TdxBusRoute>(`/Route/City/${city}`)
  }

  private async fetchJsonArray<T>(path: string): Promise<T[]> {
    const responseText = await this.fetchText(path)
    const payload: unknown = JSON.parse(responseText)

    if (!Array.isArray(payload)) {
      throw new Error(`Expected TDX response to be an array for ${path}.`)
    }

    return payload.filter((value) => this.isRecord(value)) as T[]
  }

  private async fetchText(path: string): Promise<string> {
    const url = new URL(`${TDX_BUS_BASE_URL}${path}`)
    url.searchParams.set('$format', 'JSON')

    const accessToken = await this.getAccessToken()
    const response = await this.fetchWithQuota(url, accessToken)

    if (response.status === 401) {
      this.clearAccessToken()

      const refreshedAccessToken = await this.getAccessToken()
      const retryResponse = await this.fetchWithQuota(url, refreshedAccessToken)

      return this.readResponseText(retryResponse, url)
    }

    return this.readResponseText(response, url)
  }

  private async fetchWithQuota(
    url: URL,
    accessToken: string,
  ): Promise<Response> {
    // TODO(sync): Write one tdx_request_log row per upstream request, including
    // status, duration, request bytes, response bytes, and related sync_run_id.
    await this.waitForMinuteQuota()
    this.reserveMonthlyRequestQuota()

    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
    })

    return response
  }

  private async readResponseText(
    response: Response,
    url: URL,
  ): Promise<string> {
    const responseText = await response.text()
    this.recordResponseBytes(responseText)

    if (!response.ok) {
      throw new Error(`TDX request failed: ${response.status} ${url.pathname}`)
    }

    return responseText
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
      throw new Error(`Failed to get TDX token: ${tokenResponse.status}`)
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

  private async waitForMinuteQuota(): Promise<void> {
    const now = Date.now()
    const windowStart = now - 60 * 1000

    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => timestamp > windowStart,
    )

    if (this.requestTimestamps.length >= REQUEST_LIMIT_PER_MINUTE) {
      const nextAvailableAt = this.requestTimestamps[0] + 60 * 1000
      await this.sleep(nextAvailableAt - now)
    }

    this.requestTimestamps.push(Date.now())
  }

  private reserveMonthlyRequestQuota(): void {
    this.resetUsageStateIfNeeded()

    if (this.usageState.requests >= MONTHLY_REQUEST_LIMIT) {
      throw new TdxMonthlyQuotaExceededError(
        'TDX monthly request quota has been exhausted.',
        this.getNextMonthStart(new Date()),
      )
    }

    this.usageState.requests += 1
  }

  private recordResponseBytes(responseText: string): void {
    this.resetUsageStateIfNeeded()

    const responseBytes = new TextEncoder().encode(responseText).byteLength

    if (this.usageState.bytes + responseBytes > MONTHLY_BYTE_LIMIT) {
      throw new TdxMonthlyQuotaExceededError(
        'TDX monthly response byte quota has been exhausted.',
        this.getNextMonthStart(new Date()),
      )
    }

    this.usageState.bytes += responseBytes
  }

  private resetUsageStateIfNeeded(): void {
    const currentMonthKey = this.getMonthKey(new Date())

    if (this.usageState.month_key === currentMonthKey) {
      return
    }

    this.usageState = {
      month_key: currentMonthKey,
      requests: 0,
      bytes: 0,
    }
  }

  private getMonthKey(date: Date): string {
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')

    return `${date.getUTCFullYear()}-${month}`
  }

  private getNextMonthStart(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
  }

  private sleep(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, Math.max(durationMs, 0))
    })
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }
}
