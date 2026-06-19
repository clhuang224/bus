import { Injectable } from '@nestjs/common'
import { CityNameType, getEnumValues } from '@bus/shared'
import { SyncStatusType as PrismaSyncStatusType } from '../generated/prisma/enums.js'
import { PrismaService } from '../prisma/prisma.service.js'
import type { RouteSyncRecord } from './mappers/route.mapper.js'
import { routeMapper } from './mappers/route.mapper.js'
import { TdxClientService } from './tdx-client.service.js'

interface RoutesSyncResult {
  records_read: number
  records_created: number
  records_updated: number
  records_deactivated: number
}

@Injectable()
export class RoutesSyncService {
  // TODO(sync): Keep this service focused on route/subroute/operator/shape imports.
  // The admin endpoint should create a sync_run, then call this service from a
  // background worker instead of doing the whole import inside the HTTP request.
  constructor(
    private readonly prismaService: PrismaService,
    private readonly tdxClientService: TdxClientService,
  ) {}

  async syncAllRoutes(syncRunId: string): Promise<RoutesSyncResult> {
    await this.prismaService.syncRun.update({
      where: { id: syncRunId },
      data: {
        status: PrismaSyncStatusType.RUNNING,
        started_at: new Date(),
      },
    })

    const result: RoutesSyncResult = {
      records_read: 0,
      records_created: 0,
      records_updated: 0,
      records_deactivated: 0,
    }

    for (const city of getEnumValues(CityNameType)) {
      const cityResult = await this.syncCityRoutes(city)

      result.records_read += cityResult.records_read
      result.records_created += cityResult.records_created
      result.records_updated += cityResult.records_updated
      result.records_deactivated += cityResult.records_deactivated
    }

    await this.prismaService.syncRun.update({
      where: { id: syncRunId },
      data: {
        status: PrismaSyncStatusType.SUCCEEDED,
        finished_at: new Date(),
        ...result,
      },
    })

    return result
  }

  async syncCityRoutes(city: CityNameType): Promise<RoutesSyncResult> {
    const tdxRoutes = await this.tdxClientService.fetchRoutes(city)
    const routes = routeMapper({ city, tdxRoutes })

    // TODO(sync): Upsert mapped routes, subroutes, operators, route_operator,
    // and route_shape rows. Mark missing records inactive instead of deleting
    // them, and reactivate records that appear again.
    this.saveRoutes(routes)

    return {
      records_read: tdxRoutes.length,
      records_created: 0,
      records_updated: 0,
      records_deactivated: 0,
    }
  }

  private saveRoutes(routes: RouteSyncRecord[]): void {
    void routes
  }
}
