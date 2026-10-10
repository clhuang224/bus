import { ErrorCode, RouteRealtimeStatus } from '@bus/shared'
import { HttpStatus } from '@nestjs/common'
import { FTBError } from '../dto/ftb-error.js'
import {
  CityNameType as PrismaCityNameType,
  DirectionType as PrismaDirectionType,
} from '../generated/prisma/enums.js'
import type { PrismaService } from '../prisma/prisma.service.js'
import { RealtimeService } from './realtime.service.js'
import {
  RealtimeSourceFailure,
  type RealtimeSourceResult,
  type TdxRealtimeClientService,
} from './tdx-realtime-client.service.js'

const route = {
  uuid: 'TPE10132',
  city: PrismaCityNameType.TAIPEI,
  subroutes: [
    {
      uuid: 'TPE101320-0',
      tdx_subroute_uid: 'TPE101320',
      direction: PrismaDirectionType.GO,
      route_stops: [{ stop: { uuid: 'TPE1', tdx_stop_id: '1' } }],
    },
  ],
}

function createService({
  routeRecord = route,
  arrivals = { ok: true, data: [] },
}: {
  routeRecord?: typeof route | null
  arrivals?: RealtimeSourceResult<never>
} = {}) {
  const calls = { route: 0, arrivals: [] as string[] }
  const prismaService = {
    route: {
      findFirst: () => {
        calls.route += 1
        return Promise.resolve(routeRecord)
      },
    },
  } as unknown as PrismaService
  const empty = () => Promise.resolve({ ok: true, data: [] })
  const tdxRealtimeClientService = {
    fetchEstimatedArrivals: (city: string, routeUID: string) => {
      calls.arrivals.push(`${city}:${routeUID}`)
      return Promise.resolve(arrivals)
    },
    fetchNearStops: empty,
    fetchPositions: empty,
  } as unknown as TdxRealtimeClientService

  return {
    calls,
    service: new RealtimeService(prismaService, tdxRealtimeClientService),
  }
}

describe('RealtimeService', () => {
  const realNow = Date.now
  let now = 1_000_000

  beforeEach(() => {
    now = 1_000_000
    Date.now = () => now
  })

  afterEach(() => {
    Date.now = realNow
  })

  it('maps the route and asks TDX for its city and RouteUID', async () => {
    const { calls, service } = createService()

    const realtime = await service.getRouteRealtime('TPE10132')

    expect(calls.arrivals).toEqual(['Taipei:TPE10132'])
    expect(realtime.sub_routes).toEqual([
      {
        uuid: 'TPE101320-0',
        status: RouteRealtimeStatus.NO_REALTIME_DATA,
        stops: [{ uuid: 'TPE1', arrival: null }],
        vehicles: [],
      },
    ])
  })

  it('shares one fetch between concurrent requests and caches it', async () => {
    const { calls, service } = createService()

    await Promise.all([
      service.getRouteRealtime('TPE10132'),
      service.getRouteRealtime('TPE10132'),
    ])
    now += 14_000
    await service.getRouteRealtime('TPE10132')

    expect(calls.arrivals).toHaveLength(1)

    now += 2_000
    await service.getRouteRealtime('TPE10132')

    expect(calls.arrivals).toHaveLength(2)
  })

  it('refreshes sooner after a failed TDX feed', async () => {
    const { calls, service } = createService({
      arrivals: { ok: false, failure: RealtimeSourceFailure.UNAVAILABLE },
    })

    const realtime = await service.getRouteRealtime('TPE10132')
    now += 4_000
    await service.getRouteRealtime('TPE10132')

    expect(realtime.sub_routes[0].status).toBe(RouteRealtimeStatus.UNAVAILABLE)
    expect(calls.arrivals).toHaveLength(1)

    now += 2_000
    await service.getRouteRealtime('TPE10132')

    expect(calls.arrivals).toHaveLength(2)
  })

  it('rejects a missing route without caching the failure', async () => {
    const { calls, service } = createService({ routeRecord: null })

    await expect(service.getRouteRealtime('missing')).rejects.toEqual(
      new FTBError(ErrorCode.ROUTE_NOT_FOUND, HttpStatus.NOT_FOUND),
    )
    await expect(service.getRouteRealtime('missing')).rejects.toBeInstanceOf(
      FTBError,
    )

    expect(calls.route).toBe(2)
    expect(calls.arrivals).toEqual([])
  })
})
