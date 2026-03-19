const TDX_BUS_BASE_URL = 'https://tdx.transportdata.tw/api/basic/v2/Bus'
const TDX_TOKEN_ENDPOINT = 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token'
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000

interface Env {
  TDX_CLIENT_ID?: string
  TDX_CLIENT_SECRET?: string
  TDX_ALLOWED_ORIGINS?: string
}

interface TdxTokenResponse {
  access_token: string
  expires_in: number
}

interface UpstreamFetchResult {
  response: Response
  retriedAfterUnauthorized: boolean
}

class ProxyConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProxyConfigError'
  }
}

let cachedToken: string | null = null
let cachedTokenExpiresAt = 0

function clearCachedToken() {
  cachedToken = null
  cachedTokenExpiresAt = 0
}

function withCorsHeaders(headers: Headers, allowedOrigin: string) {
  headers.set('access-control-allow-origin', allowedOrigin)
  headers.set('access-control-allow-methods', 'GET,OPTIONS')
  headers.set('access-control-allow-headers', 'content-type')
  headers.set('access-control-expose-headers', 'content-type')
  headers.set('vary', 'origin')
}

function getAllowedOrigins(env: Env) {
  const configuredOrigins = env.TDX_ALLOWED_ORIGINS

  if (!configuredOrigins) {
    return []
  }

  return configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => !!origin)
}

function getCorsOrigin(request: Request, env: Env) {
  const allowedOrigins = getAllowedOrigins(env)

  if (allowedOrigins.length === 0) {
    return null
  }

  const requestOrigin = request.headers.get('origin')
  if (!requestOrigin) {
    return null
  }

  return allowedOrigins.includes(requestOrigin) ? requestOrigin : null
}

async function getAccessToken(env: Env) {
  if (!env.TDX_CLIENT_ID || !env.TDX_CLIENT_SECRET) {
    throw new ProxyConfigError('TDX proxy is not configured. Follow the environment setup steps in README.md.')
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

function logProxyRequest({
  durationMs,
  path,
  retriedAfterUnauthorized,
  search,
  status
}: {
  durationMs: number
  path: string
  retriedAfterUnauthorized: boolean
  search: string
  status: number
}) {
  console.log(JSON.stringify({
    type: 'tdx-proxy-request',
    timestamp: new Date().toISOString(),
    path,
    search,
    status,
    durationMs,
    requestCount: 1,
    retriedAfterUnauthorized
  }))
}

async function fetchUpstreamWithTokenRetry(requestUrl: URL, env: Env): Promise<UpstreamFetchResult> {
  let accessToken = await getAccessToken(env)
  let upstreamResponse = await fetch(getUpstreamUrl(requestUrl), {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/json'
    }
  })

  if (upstreamResponse.status !== 401) {
    return {
      response: upstreamResponse,
      retriedAfterUnauthorized: false
    }
  }

  clearCachedToken()
  accessToken = await getAccessToken(env)
  upstreamResponse = await fetch(getUpstreamUrl(requestUrl), {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/json'
    }
  })

  return {
    response: upstreamResponse,
    retriedAfterUnauthorized: true
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const corsOrigin = getCorsOrigin(request, env)

    if (corsOrigin == null) {
      return new Response(JSON.stringify({
        error: 'Origin is not allowed.'
      }), {
        status: 403,
        headers: {
          'content-type': 'application/json'
        }
      })
    }

    if (request.method === 'OPTIONS') {
      const headers = new Headers()
      withCorsHeaders(headers, corsOrigin)
      return new Response(null, { status: 204, headers })
    }

    if (request.method !== 'GET') {
      const headers = new Headers()
      withCorsHeaders(headers, corsOrigin)
      return new Response('Method Not Allowed', { status: 405, headers })
    }

    try {
      const requestUrl = new URL(request.url)
      const startedAt = Date.now()
      const { response: upstreamResponse, retriedAfterUnauthorized } = await fetchUpstreamWithTokenRetry(requestUrl, env)
      const durationMs = Date.now() - startedAt

      const headers = new Headers(upstreamResponse.headers)
      withCorsHeaders(headers, corsOrigin)

      logProxyRequest({
        durationMs,
        path: requestUrl.pathname.replace(/^\/api\/tdx/, ''),
        retriedAfterUnauthorized,
        search: requestUrl.search,
        status: upstreamResponse.status
      })

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers
      })
    } catch (error) {
      const requestUrl = new URL(request.url)
      console.error('tdx-proxy worker error:', JSON.stringify({
        type: 'tdx-proxy-error',
        timestamp: new Date().toISOString(),
        path: requestUrl.pathname.replace(/^\/api\/tdx/, ''),
        search: requestUrl.search,
        message: error instanceof Error ? error.message : 'Unknown error'
      }))

      const headers = new Headers({
        'content-type': 'application/json'
      })
      withCorsHeaders(headers, corsOrigin)

      if (error instanceof ProxyConfigError) {
        return new Response(JSON.stringify({
          error: 'TDX proxy is not configured.',
          message: error.message
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
