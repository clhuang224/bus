import { Injectable } from '@nestjs/common'
import { CityNameType, getEnumValues } from '@bus/shared'
import { SyncStatusType as PrismaSyncStatusType } from '../generated/prisma/enums.js'
import { PrismaService } from '../prisma/prisma.service.js'
import type { RouteSyncRecord } from './mappers/route.mapper.js'
import { routeMapper } from './mappers/route.mapper.js'
import {
  TdxClientService,
  TdxMonthlyQuotaExceededError,
} from './tdx-client.service.js'

interface RoutesSyncResult {
  records_read: number
  records_created: number
  records_updated: number
  records_deactivated: number
}

const emptyResult = (): RoutesSyncResult => ({
  records_read: 0,
  records_created: 0,
  records_updated: 0,
  records_deactivated: 0,
})

@Injectable()
export class RoutesSyncService {
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
        finished_at: null,
        resume_after_at: null,
        error_message: null,
      },
    })

    const result = emptyResult()

    try {
      for (const city of getEnumValues(CityNameType)) {
        const cityResult = await this.syncCityRoutes(city, syncRunId)

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
    } catch (error) {
      await this.finishFailedSync(syncRunId, error, result)
      throw error
    }
  }

  async syncCityRoutes(
    city: CityNameType,
    syncRunId: string,
  ): Promise<RoutesSyncResult> {
    const tdxRoutes = await this.tdxClientService.fetchRoutes(city, syncRunId)
    const routes = routeMapper({ city, tdxRoutes })

    return this.saveRoutes(routes)
  }

  private async saveRoutes(
    routes: RouteSyncRecord[],
  ): Promise<RoutesSyncResult> {
    const city = routes[0]?.route.city

    if (!city) {
      return emptyResult()
    }

    return this.prismaService.$transaction(async (transaction) => {
      const existingRoutes = await transaction.route.findMany({
        where: { city },
        select: { uuid: true },
      })
      const existingRouteUuids = new Set(
        existingRoutes.map((route) => route.uuid),
      )
      const incomingRouteUuids = routes.map(({ route }) => route.uuid)
      let recordsCreated = 0
      let recordsUpdated = 0

      for (const record of routes) {
        if (existingRouteUuids.has(record.route.uuid)) {
          recordsUpdated += 1
        } else {
          recordsCreated += 1
        }

        const route = await transaction.route.upsert({
          where: { uuid: record.route.uuid },
          create: {
            ...record.route,
            is_active: true,
            inactive_at: null,
          },
          update: {
            ...record.route,
            is_active: true,
            inactive_at: null,
          },
        })

        await this.saveSubRoutes(transaction, route.id, record)
        await this.saveOperators(transaction, route.id, record)
      }

      const deactivatedRoutes = await transaction.route.updateMany({
        where: {
          city,
          is_active: true,
          uuid: { notIn: incomingRouteUuids },
        },
        data: {
          is_active: false,
          inactive_at: new Date(),
        },
      })

      return {
        records_read: routes.length,
        records_created: recordsCreated,
        records_updated: recordsUpdated,
        records_deactivated: deactivatedRoutes.count,
      }
    })
  }

  private async saveSubRoutes(
    transaction: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    routeId: string,
    record: RouteSyncRecord,
  ): Promise<void> {
    const incomingSubRouteUuids = record.subroutes.map(
      (subroute) => subroute.uuid,
    )

    for (const subroute of record.subroutes) {
      await transaction.subRoute.upsert({
        where: { uuid: subroute.uuid },
        create: {
          ...subroute,
          route_id: routeId,
          is_active: true,
          inactive_at: null,
        },
        update: {
          ...subroute,
          route_id: routeId,
          is_active: true,
          inactive_at: null,
        },
      })
    }

    await transaction.subRoute.updateMany({
      where: {
        route_id: routeId,
        is_active: true,
        uuid: { notIn: incomingSubRouteUuids },
      },
      data: {
        is_active: false,
        inactive_at: new Date(),
      },
    })
  }

  private async saveOperators(
    transaction: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    routeId: string,
    record: RouteSyncRecord,
  ): Promise<void> {
    const operatorIds: string[] = []

    for (const operator of record.operators) {
      const savedOperator = await transaction.operator.upsert({
        where: { tdx_operator_id: operator.tdx_operator_id },
        create: {
          ...operator,
          is_active: true,
          inactive_at: null,
        },
        update: {
          ...operator,
          is_active: true,
          inactive_at: null,
        },
      })

      operatorIds.push(savedOperator.id)

      await transaction.routeOperator.upsert({
        where: {
          route_id_operator_id: {
            route_id: routeId,
            operator_id: savedOperator.id,
          },
        },
        create: {
          route_id: routeId,
          operator_id: savedOperator.id,
        },
        update: {},
      })
    }

    await transaction.routeOperator.deleteMany({
      where: {
        route_id: routeId,
        operator_id: { notIn: operatorIds },
      },
    })
  }

  private async finishFailedSync(
    syncRunId: string,
    error: unknown,
    result: RoutesSyncResult,
  ): Promise<void> {
    if (error instanceof TdxMonthlyQuotaExceededError) {
      await this.prismaService.syncRun.update({
        where: { id: syncRunId },
        data: {
          status: PrismaSyncStatusType.PENDING,
          resume_after_at: error.retry_at,
          ...result,
        },
      })

      return
    }

    await this.prismaService.syncRun.update({
      where: { id: syncRunId },
      data: {
        status: PrismaSyncStatusType.FAILED,
        finished_at: new Date(),
        error_message: error instanceof Error ? error.message : String(error),
        ...result,
      },
    })
  }
}
