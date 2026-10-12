import { CityNameType, DirectionType } from '@bus/shared'
import type { TdxAuthService } from '../tdx/tdx-auth.service.js'
import {
  RealtimeSourceFailure,
  TdxRealtimeClientService,
} from './tdx-realtime-client.service.js'

const REQUESTS_PER_SECOND_ENV = 'TDX_REALTIME_REQUESTS_PER_SECOND'

function createAuthService() {
  const clearedTokens: string[] = []
  let token = 'token-1'

  const authService = {
    getAccessToken: () => Promise.resolve(token),
    clearAccessToken: (rejectedToken: string) => {
      clearedTokens.push(rejectedToken)
      token = 'token-2'
    },
  } as unknown as TdxAuthService

  return { authService, clearedTokens }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

class ShortTimeoutClient extends TdxRealtimeClientService {
  protected override readonly requestTimeoutMs = 50
}

/**
 * A response whose headers arrive but whose body never finishes. Like a real
 * fetch, aborting the request signal errors the body stream.
 */
function stalledResponse(signal: AbortSignal | null | undefined) {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('['))
        signal?.addEventListener('abort', () => {
          controller.error(new DOMException('Aborted', 'AbortError'))
        })
      },
    }),
    { status: 200 },
  )
}

describe('TdxRealtimeClientService', () => {
  const originalFetch = globalThis.fetch
  const originalRequestsPerSecond = process.env[REQUESTS_PER_SECOND_ENV]

  afterEach(() => {
    globalThis.fetch = originalFetch

    if (originalRequestsPerSecond === undefined) {
      delete process.env[REQUESTS_PER_SECOND_ENV]
    } else {
      process.env[REQUESTS_PER_SECOND_ENV] = originalRequestsPerSecond
    }
  })

  it('filters by route and skips malformed records', async () => {
    const requests: { url: string; authorization: string | null }[] = []
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({
        url: input instanceof Request ? input.url : input.toString(),
        authorization: new Headers(init?.headers).get('authorization'),
      })

      return Promise.resolve(
        jsonResponse([
          { PlateNumb: 'KKA-0151', Direction: DirectionType.GO },
          { PlateNumb: '', Direction: DirectionType.GO },
          { Direction: 'outbound' },
        ]),
      )
    }
    const service = new TdxRealtimeClientService(
      createAuthService().authService,
    )

    const result = await service.fetchPositions(CityNameType.TAIPEI, "TPE'1")

    expect(result).toEqual({
      ok: true,
      data: [{ PlateNumb: 'KKA-0151', Direction: DirectionType.GO }],
    })
    expect(requests).toHaveLength(1)
    const url = new URL(requests[0].url)
    expect(url.pathname).toBe(
      '/api/basic/v2/Bus/RealTimeByFrequency/City/Taipei',
    )
    expect(url.searchParams.get('$filter')).toBe("RouteUID eq 'TPE''1'")
    expect(requests[0].authorization).toBe('Bearer token-1')
  })

  it('requests only the ETA fields the calculator reads', async () => {
    const urls: URL[] = []
    globalThis.fetch = (input: RequestInfo | URL) => {
      urls.push(new URL(input instanceof Request ? input.url : input))
      return Promise.resolve(jsonResponse([]))
    }
    const service = new TdxRealtimeClientService(
      createAuthService().authService,
    )

    await service.fetchEstimatedArrivals(CityNameType.TAIPEI, 'TPE1')
    await service.fetchNearStops(CityNameType.TAIPEI, 'TPE1')

    expect(urls[0].searchParams.get('$select')).toBe(
      'PlateNumb,StopUID,StopID,RouteUID,SubRouteUID,Direction,StopSequence,EstimateTime,StopStatus',
    )
    expect(urls[1].searchParams.has('$select')).toBe(false)
  })

  it('refreshes the token once after a 401', async () => {
    const authorizations: (string | null)[] = []
    globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
      const authorization = new Headers(init?.headers).get('authorization')
      authorizations.push(authorization)

      return Promise.resolve(
        authorization === 'Bearer token-1'
          ? new Response('', { status: 401 })
          : jsonResponse([]),
      )
    }
    const { authService, clearedTokens } = createAuthService()
    const service = new TdxRealtimeClientService(authService)

    const result = await service.fetchEstimatedArrivals(
      CityNameType.TAIPEI,
      'TPE1',
    )

    expect(result).toEqual({ ok: true, data: [] })
    expect(clearedTokens).toEqual(['token-1'])
    expect(authorizations).toEqual(['Bearer token-1', 'Bearer token-2'])
  })

  it('times out a response whose body stalls after the headers', async () => {
    globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit) =>
      Promise.resolve(stalledResponse(init?.signal))
    const service = new ShortTimeoutClient(createAuthService().authService)

    expect(
      await service.fetchEstimatedArrivals(CityNameType.TAIPEI, 'TPE1'),
    ).toEqual({ ok: false, failure: RealtimeSourceFailure.UNAVAILABLE })
  })

  it('releases the body of a rejected 401 response before retrying', async () => {
    let releasedBodies = 0
    let requestCount = 0
    globalThis.fetch = () => {
      requestCount += 1
      return Promise.resolve(
        requestCount === 1
          ? new Response(
              new ReadableStream({
                cancel: () => {
                  releasedBodies += 1
                },
              }),
              { status: 401 },
            )
          : jsonResponse([]),
      )
    }
    const service = new TdxRealtimeClientService(
      createAuthService().authService,
    )

    await service.fetchNearStops(CityNameType.TAIPEI, 'TPE1')

    expect(requestCount).toBe(2)
    expect(releasedBodies).toBe(1)
  })

  it('reports a rate limit and skips TDX during the cooldown', async () => {
    let requestCount = 0
    globalThis.fetch = () => {
      requestCount += 1
      return Promise.resolve(new Response('', { status: 429 }))
    }
    const service = new TdxRealtimeClientService(
      createAuthService().authService,
    )

    const first = await service.fetchNearStops(CityNameType.TAIPEI, 'TPE1')
    const second = await service.fetchNearStops(CityNameType.TAIPEI, 'TPE1')

    expect(first).toEqual({
      ok: false,
      failure: RealtimeSourceFailure.RATE_LIMITED,
    })
    expect(second).toEqual(first)
    expect(requestCount).toBe(1)
  })

  it('does not send a queued request during a cooldown that began while it waited', async () => {
    process.env[REQUESTS_PER_SECOND_ENV] = '1'
    let requestCount = 0
    globalThis.fetch = async () => {
      requestCount += 1
      await new Promise((resolve) => setTimeout(resolve, 200))
      return new Response('', { status: 429 })
    }
    const service = new TdxRealtimeClientService(
      createAuthService().authService,
    )

    const results = await Promise.all([
      service.fetchNearStops(CityNameType.TAIPEI, 'TPE1'),
      service.fetchNearStops(CityNameType.TAIPEI, 'TPE2'),
    ])

    expect(requestCount).toBe(1)
    expect(results).toEqual([
      { ok: false, failure: RealtimeSourceFailure.RATE_LIMITED },
      { ok: false, failure: RealtimeSourceFailure.RATE_LIMITED },
    ])
  })

  it('reports other failures as unavailable', async () => {
    globalThis.fetch = () => Promise.resolve(new Response('', { status: 500 }))
    const service = new TdxRealtimeClientService(
      createAuthService().authService,
    )

    expect(
      await service.fetchEstimatedArrivals(CityNameType.TAIPEI, 'TPE1'),
    ).toEqual({ ok: false, failure: RealtimeSourceFailure.UNAVAILABLE })
  })

  it('fails fast once the queue holds the maximum wait', async () => {
    process.env[REQUESTS_PER_SECOND_ENV] = '1'
    let requestCount = 0
    globalThis.fetch = () => {
      requestCount += 1
      return Promise.resolve(jsonResponse([]))
    }
    const service = new TdxRealtimeClientService(
      createAuthService().authService,
    )

    const results = await Promise.all(
      [1, 2, 3, 4, 5].map((index) =>
        service.fetchPositions(CityNameType.TAIPEI, `TPE${index}`),
      ),
    )

    expect(results.map((result) => result.ok)).toEqual([
      true,
      true,
      true,
      false,
      false,
    ])
    expect(results[4]).toEqual({
      ok: false,
      failure: RealtimeSourceFailure.RATE_LIMITED,
    })
    expect(requestCount).toBe(3)
  })

  it('spaces requests to the configured per-second limit', async () => {
    process.env[REQUESTS_PER_SECOND_ENV] = '2'
    const requestTimes: number[] = []
    globalThis.fetch = () => {
      requestTimes.push(Date.now())
      return Promise.resolve(jsonResponse([]))
    }
    const service = new TdxRealtimeClientService(
      createAuthService().authService,
    )

    await Promise.all([
      service.fetchPositions(CityNameType.TAIPEI, 'TPE1'),
      service.fetchPositions(CityNameType.TAIPEI, 'TPE2'),
      service.fetchPositions(CityNameType.TAIPEI, 'TPE3'),
    ])

    expect(requestTimes).toHaveLength(3)
    expect(requestTimes[2] - requestTimes[0]).toBeGreaterThanOrEqual(990)
  })
})
