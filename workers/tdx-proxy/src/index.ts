const TDX_BUS_BASE_URL = 'https://tdx.transportdata.tw/api/basic/v2/Bus'
const TDX_TOKEN_ENDPOINT = 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token'
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000

interface Env {
  TDX_CLIENT_ID?: string
  TDX_CLIENT_SECRET?: string
}

interface TdxTokenResponse {
  access_token: string
  expires_in: number
}

let cachedToken: string | null = null
let cachedTokenExpiresAt = 0

function withCorsHeaders(headers: Headers) {
  headers.set('access-control-allow-origin', '*')
  headers.set('access-control-allow-methods', 'GET,OPTIONS')
  headers.set('access-control-allow-headers', 'content-type')
  headers.set('access-control-expose-headers', 'content-type')
}

async function getAccessToken(env: Env) {
  if (!env.TDX_CLIENT_ID || !env.TDX_CLIENT_SECRET) {
    throw new Error('TDX proxy is not configured. Follow the environment setup steps in README.md.')
  }

  if (cachedToken && Date.now() + TOKEN_REFRESH_BUFFER_MS < cachedTokenExpiresAt) {
    return cachedToken
  }

  const tokenResponse = await fetch(TDX_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.TDX_CLIENT_ID,
      client_secret: env.TDX_CLIENT_SECRET
    })
  })

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get TDX token: ${tokenResponse.status}`)
  }

  const tokenPayload = await tokenResponse.json() as TdxTokenResponse

  cachedToken = tokenPayload.access_token
  cachedTokenExpiresAt = Date.now() + tokenPayload.expires_in * 1000

  return cachedToken
}

function getUpstreamUrl(requestUrl: URL) {
  const upstreamPath = requestUrl.pathname.replace(/^\/api\/tdx/, '')

  if (!upstreamPath.startsWith('/')) {
    throw new Error('Invalid TDX proxy path.')
  }

  return `${TDX_BUS_BASE_URL}${upstreamPath}${requestUrl.search}`
}

export default {
  async fetch(request: Request, env: Env) {
    if (request.method === 'OPTIONS') {
      const headers = new Headers()
      withCorsHeaders(headers)
      return new Response(null, { status: 204, headers })
    }

    if (request.method !== 'GET') {
      const headers = new Headers()
      withCorsHeaders(headers)
      return new Response('Method Not Allowed', { status: 405, headers })
    }

    try {
      const requestUrl = new URL(request.url)
      const accessToken = await getAccessToken(env)
      const upstreamResponse = await fetch(getUpstreamUrl(requestUrl), {
        headers: {
          authorization: `Bearer ${accessToken}`,
          accept: 'application/json'
        }
      })

      const headers = new Headers(upstreamResponse.headers)
      withCorsHeaders(headers)

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers
      })
    } catch (error) {
      console.error('tdx-proxy worker error:', error)

      const errorMessage = error instanceof Error ? error.message : 'TDX proxy request failed.'
      const isMissingConfigError = errorMessage.startsWith('TDX proxy is not configured.')

      const headers = new Headers({
        'content-type': 'application/json'
      })
      withCorsHeaders(headers)

      if (isMissingConfigError) {
        return new Response(JSON.stringify({
          error: 'TDX proxy is not configured.',
          message: errorMessage
        }), {
          status: 503,
          headers
        })
      }

      return new Response(JSON.stringify({
        error: 'TDX proxy request failed.'
      }), {
        status: 500,
        headers
      })
    }
  }
}
