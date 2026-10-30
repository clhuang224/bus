import { Injectable } from '@nestjs/common'
import { createRequestTimeout, toRequestError } from './tdx-request-timeout.js'

const TDX_TOKEN_ENDPOINT =
  'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token'
const TOKEN_REFRESH_BUFFER_MS = 60_000

interface TdxTokenResponse {
  access_token: string
  expires_in: number
}

class TdxClientConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TdxClientConfigError'
  }
}

@Injectable()
export class TdxAuthService {
  private accessToken: string | null = null
  private accessTokenExpiresAt = 0
  private accessTokenRefresh: Promise<string> | null = null

  async getAccessToken(): Promise<string> {
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

  clearAccessToken(rejectedToken: string): void {
    if (this.accessToken !== rejectedToken) return

    this.accessToken = null
    this.accessTokenExpiresAt = 0
  }

  private async requestAccessToken(): Promise<string> {
    const clientId = process.env.TDX_CLIENT_ID
    const clientSecret = process.env.TDX_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new TdxClientConfigError(
        'TDX_CLIENT_ID and TDX_CLIENT_SECRET are required to call TDX.',
      )
    }

    const timeout = createRequestTimeout()

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

      if (!isTdxTokenResponse(tokenPayload)) {
        throw new Error('TDX token response is malformed.')
      }

      this.accessToken = tokenPayload.access_token
      this.accessTokenExpiresAt = Date.now() + tokenPayload.expires_in * 1000

      return this.accessToken
    } catch (error) {
      throw toRequestError(error, timeout, 'TDX token request')
    } finally {
      timeout.cancel()
    }
  }
}

function isTdxTokenResponse(value: unknown): value is TdxTokenResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'access_token' in value &&
    typeof value.access_token === 'string' &&
    value.access_token.trim().length > 0 &&
    'expires_in' in value &&
    typeof value.expires_in === 'number' &&
    Number.isFinite(value.expires_in) &&
    value.expires_in > 0
  )
}
