import { Injectable } from '@nestjs/common'
import type { CityNameType } from '@bus/shared'
import { PrismaService } from '../prisma/prisma.service.js'
import type { RouteSyncRecord } from './mappers/route.mapper.js'
import type { SyncResult } from './sync-result.js'

interface PersistRoutesOptions {
  city: CityNameType
  onProgress?: (persistedCount: number, totalCount: number) => Promise<void>
}

const ROUTE_PROGRESS_INTERVAL = 50
const ROUTE_PERSISTENCE_CONCURRENCY = 5

@Injectable()
export class RoutePersistenceService {
  constructor(private readonly prismaService: PrismaService) {}

  async persistRoutes(
    routes: RouteSyncRecord[],
    { city: cityName, onProgress }: PersistRoutesOptions,
  ): Promise<SyncResult> {
    if (routes.length === 0) {
      throw new Error(`TDX returned 0 routes for ${cityName}.`)
    }

    const city = routes[0].route.city
    const existingRoutes = await this.prismaService.route.findMany({
      where: { city },
      select: { uuid: true },
    })
    const existingRouteUuids = new Set(
      existingRoutes.map((route) => route.uuid),
    )
    const incomingRouteUuids = routes.map(({ route }) => route.uuid)
    const recordsCreated = routes.filter(
      ({ route }) => !existingRouteUuids.has(route.uuid),
    ).length
    const recordsUpdated = routes.length - recordsCreated
    let nextProgressCount = ROUTE_PROGRESS_INTERVAL

    for (
      let batchStart = 0;
      batchStart < routes.length;
      batchStart += ROUTE_PERSISTENCE_CONCURRENCY
    ) {
      const batch = routes.slice(
        batchStart,
        batchStart + ROUTE_PERSISTENCE_CONCURRENCY,
      )

      await Promise.all(
        batch.map((record) => this.persistRoute(record, cityName)),
      )

      const persistedCount = Math.min(batchStart + batch.length, routes.length)

      if (
        onProgress &&
        (persistedCount >= nextProgressCount ||
          persistedCount === routes.length)
      ) {
        await onProgress(persistedCount, routes.length)

        while (nextProgressCount <= persistedCount) {
          nextProgressCount += ROUTE_PROGRESS_INTERVAL
        }
      }
    }

    const inactiveAt = new Date()
    const missingRouteWhere = {
      city,
      uuid: { notIn: incomingRouteUuids },
    }
    const deactivatedRoutes = await this.prismaService.route.updateMany({
      where: {
        ...missingRouteWhere,
        is_active: true,
      },
      data: {
        is_active: false,
        inactive_at: inactiveAt,
      },
    })
    await this.prismaService.subRoute.updateMany({
      where: {
        is_active: true,
        route: missingRouteWhere,
      },
      data: {
        is_active: false,
        inactive_at: inactiveAt,
      },
    })

    return {
      records_read: routes.length,
      records_created: recordsCreated,
      records_updated: recordsUpdated,
      records_deactivated: deactivatedRoutes.count,
    }
  }

  private async persistRoute(
    record: RouteSyncRecord,
    cityName: CityNameType,
  ): Promise<void> {
    try {
      const route = await this.prismaService.route.upsert({
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

      await this.persistSubRoutes(route.id, record)
      await this.persistOperators(route.id, record)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      throw new Error(
        `Failed to persist route ${record.route.uuid} for ${cityName}: ${message}`,
      )
    }
  }

  private async persistSubRoutes(
    routeId: string,
    record: RouteSyncRecord,
  ): Promise<void> {
    const incomingSubRouteUuids = record.subroutes.map(
      (subroute) => subroute.uuid,
    )

    for (const subroute of record.subroutes) {
      await this.prismaService.subRoute.upsert({
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

    await this.prismaService.subRoute.updateMany({
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

  private async persistOperators(
    routeId: string,
    record: RouteSyncRecord,
  ): Promise<void> {
    const operatorIds: string[] = []

    for (const operator of record.operators) {
      const savedOperator = await this.prismaService.operator.upsert({
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

      await this.prismaService.routeOperator.upsert({
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

    await this.prismaService.routeOperator.deleteMany({
      where: {
        route_id: routeId,
        operator_id: { notIn: operatorIds },
      },
    })
  }
}
