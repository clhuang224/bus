import { HttpStatus, Injectable } from '@nestjs/common'
import { ErrorCode, type ApiRouteRealtime } from '@bus/shared'
import {
  DB_CITY_NAME_BY_PRISMA,
  DB_DIRECTION_BY_PRISMA,
} from '../constants/enum-mappings.js'
import { FTBError } from '../dto/ftb-error.js'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  calculateRouteRealtime,
  type RealtimeRoute,
  type RealtimeSources,
} from './route-realtime.calculator.js'
import { TdxRealtimeClientService } from './tdx-realtime-client.service.js'

/** Shorter than the 30-second web polling interval, so polls see new data. */
const SNAPSHOT_TTL_MS = 15 * 1000
/** Retry sooner after a failed feed, without letting every poll hit TDX. */
const FAILED_SNAPSHOT_TTL_MS = 5 * 1000

interface Snapshot {
  realtime: ApiRouteRealtime
  hasFailedSource: boolean
}

interface CachedSnapshot {
  expiresAt: number
  snapshot: Promise<Snapshot>
}

@Injectable()
export class RealtimeService {
  private readonly snapshots = new Map<string, CachedSnapshot>()

  constructor(
    private readonly prismaService: PrismaService,
    private readonly tdxRealtimeClientService: TdxRealtimeClientService,
  ) {}

  /**
   * Returns a cached snapshot while it is fresh. Concurrent requests for the
   * same route share one upstream fetch.
   */
  async getRouteRealtime(uuid: string): Promise<ApiRouteRealtime> {
    const now = Date.now()
    const cached = this.snapshots.get(uuid)

    if (cached && cached.expiresAt > now) {
      return (await cached.snapshot).realtime
    }

    this.removeExpiredSnapshots(now)

    const entry: CachedSnapshot = {
      expiresAt: now + SNAPSHOT_TTL_MS,
      snapshot: this.loadSnapshot(uuid),
    }
    this.snapshots.set(uuid, entry)

    try {
      const snapshot = await entry.snapshot

      if (snapshot.hasFailedSource) {
        entry.expiresAt = Date.now() + FAILED_SNAPSHOT_TTL_MS
      }

      return snapshot.realtime
    } catch (error) {
      if (this.snapshots.get(uuid) === entry) this.snapshots.delete(uuid)

      throw error
    }
  }

  private async loadSnapshot(uuid: string): Promise<Snapshot> {
    const { city, route } = await this.loadRoute(uuid)
    const [estimatedArrivals, nearStops, positions] = await Promise.all([
      this.tdxRealtimeClientService.fetchEstimatedArrivals(city, uuid),
      this.tdxRealtimeClientService.fetchNearStops(city, uuid),
      this.tdxRealtimeClientService.fetchPositions(city, uuid),
    ])
    const sources: RealtimeSources = {
      estimatedArrivals,
      nearStops,
      positions,
    }

    return {
      realtime: calculateRouteRealtime(route, sources, new Date()),
      hasFailedSource: [estimatedArrivals, nearStops, positions].some(
        (source) => !source.ok,
      ),
    }
  }

  private async loadRoute(uuid: string) {
    const route = await this.prismaService.route.findFirst({
      where: { uuid, is_active: true },
      select: {
        uuid: true,
        city: true,
        subroutes: {
          where: { is_active: true },
          // Same order as the route detail endpoint.
          orderBy: [{ direction: 'asc' }, { uuid: 'asc' }],
          select: {
            uuid: true,
            tdx_subroute_uid: true,
            direction: true,
            route_stops: {
              where: { is_active: true, stop: { is_active: true } },
              orderBy: { sequence: 'asc' },
              select: {
                stop: { select: { uuid: true, tdx_stop_id: true } },
              },
            },
          },
        },
      },
    })

    if (!route) {
      throw new FTBError(ErrorCode.ROUTE_NOT_FOUND, HttpStatus.NOT_FOUND)
    }

    const realtimeRoute: RealtimeRoute = {
      uuid: route.uuid,
      subRoutes: route.subroutes.map((subroute) => ({
        uuid: subroute.uuid,
        tdxSubRouteUid: subroute.tdx_subroute_uid,
        direction: DB_DIRECTION_BY_PRISMA[subroute.direction],
        stops: subroute.route_stops.map(({ stop }) => ({
          uuid: stop.uuid,
          tdxStopId: stop.tdx_stop_id,
        })),
      })),
    }

    return { city: DB_CITY_NAME_BY_PRISMA[route.city], route: realtimeRoute }
  }

  private removeExpiredSnapshots(now: number): void {
    for (const [uuid, cached] of this.snapshots) {
      if (cached.expiresAt <= now) this.snapshots.delete(uuid)
    }
  }
}
