import { CityNameType, DirectionType, getEnumValues } from '@bus/shared'
import type { TdxBusRoute } from '@bus/shared'
import { SyncStatusType as PrismaSyncStatusType } from '../generated/prisma/enums.js'
import type { PrismaService } from '../prisma/prisma.service.js'
import { cityMapper } from './mappers/route.mapper.js'
import { RoutesSyncService } from './routes-sync.service.js'
import type { TdxClientService } from './tdx-client.service.js'
import { TdxMonthlyQuotaExceededError } from './tdx-client.service.js'

const tdxRoute: TdxBusRoute = {
  RouteUID: 'NWT10116',
  RouteID: '10116',
  HasSubRoutes: true,
  Operators: [
    {
      OperatorID: '16176',
      OperatorName: {
        Zh_tw: '臺北客運',
        En: 'Taipei Bus Co., Ltd.',
      },
      OperatorNo: '0400',
    },
  ],
  AuthorityID: '005',
  ProviderID: '015',
  SubRoutes: [
    {
      SubRouteUID: 'NWT101160',
      SubRouteID: '101160',
      OperatorIDs: ['16176'],
      SubRouteName: { Zh_tw: '242', En: '242' },
      Direction: DirectionType.GO,
      FirstBusTime: '0530',
      LastBusTime: '1710',
    },
  ],
  BusRouteType: 11,
  RouteName: { Zh_tw: '242', En: '242' },
  DepartureStopNameZh: '中和',
  DepartureStopNameEn: 'Zhonghe',
  DestinationStopNameZh: '西門',
  DestinationStopNameEn: 'Ximen',
  UpdateTime: '2026-06-03T18:45:21+08:00',
  VersionID: 7931,
}

function createPersistenceMocks() {
  const calls = {
    routeUpsert: [] as unknown[],
    subRouteUpsert: [] as unknown[],
    operatorUpsert: [] as unknown[],
    routeOperatorUpsert: [] as unknown[],
  }
  const prismaService = {
    route: {
      findMany: () => Promise.resolve([]),
      upsert: (args: unknown) => {
        calls.routeUpsert.push(args)
        return Promise.resolve({ id: 'route-db-id' })
      },
      updateMany: () => Promise.resolve({ count: 2 }),
    },
    subRoute: {
      upsert: (args: unknown) => {
        calls.subRouteUpsert.push(args)
        return Promise.resolve({ id: 'subroute-db-id' })
      },
      updateMany: () => Promise.resolve({ count: 0 }),
    },
    operator: {
      upsert: (args: unknown) => {
        calls.operatorUpsert.push(args)
        return Promise.resolve({ id: 'operator-db-id' })
      },
    },
    routeOperator: {
      upsert: (args: unknown) => {
        calls.routeOperatorUpsert.push(args)
        return Promise.resolve({})
      },
      deleteMany: () => Promise.resolve({ count: 0 }),
    },
    syncRun: {
      update: () => Promise.resolve({}),
    },
    syncRunCity: {
      update: () => Promise.resolve({}),
    },
  }

  return { calls, prismaService }
}

describe('RoutesSyncService', () => {
  it('maps and persists routes with their subroutes and operators', async () => {
    const { calls, prismaService } = createPersistenceMocks()
    const tdxClientService = {
      fetchRoutes: () => Promise.resolve([tdxRoute]),
    }
    const service = new RoutesSyncService(
      prismaService as unknown as PrismaService,
      tdxClientService as unknown as TdxClientService,
    )

    await expect(
      service.syncCityRoutes(CityNameType.NEW_TAIPEI, 'sync-run-id'),
    ).resolves.toEqual({
      records_read: 1,
      records_created: 1,
      records_updated: 0,
      records_deactivated: 2,
    })

    expect(calls.routeUpsert).toEqual([
      expect.objectContaining({ where: { uuid: 'NWT10116' } }),
    ])
    expect(calls.subRouteUpsert).toEqual([
      expect.objectContaining({ where: { uuid: 'NWT101160-0' } }),
    ])
    expect(calls.operatorUpsert).toEqual([
      expect.objectContaining({ where: { tdx_operator_id: '16176' } }),
    ])
    expect(calls.routeOperatorUpsert).toEqual([
      {
        where: {
          route_id_operator_id: {
            route_id: 'route-db-id',
            operator_id: 'operator-db-id',
          },
        },
        create: {
          route_id: 'route-db-id',
          operator_id: 'operator-db-id',
        },
        update: {},
      },
    ])
  })

  it('marks a sync run pending when the monthly quota is exhausted', async () => {
    const retryAt = new Date('2026-07-01T00:00:00.000Z')
    const quotaError = new TdxMonthlyQuotaExceededError(
      'TDX monthly request quota has been exhausted.',
      retryAt,
    )
    const syncRunUpdates: unknown[] = []
    const prismaService = {
      syncRun: {
        update: (args: unknown) => {
          syncRunUpdates.push(args)
          return Promise.resolve({})
        },
      },
      syncRunCity: {
        createMany: () => Promise.resolve({ count: 22 }),
        findMany: () => Promise.resolve([]),
        update: () => Promise.resolve({}),
      },
    }
    const tdxClientService = {
      fetchRoutes: () => Promise.reject(quotaError),
    }
    const service = new RoutesSyncService(
      prismaService as unknown as PrismaService,
      tdxClientService as unknown as TdxClientService,
    )

    await expect(service.syncAllRoutes('sync-run-id')).rejects.toBe(quotaError)

    expect(syncRunUpdates).toEqual([
      expect.anything(),
      {
        where: { id: 'sync-run-id' },
        data: {
          status: PrismaSyncStatusType.PENDING,
          resume_after_at: retryAt,
          records_read: 0,
          records_created: 0,
          records_updated: 0,
          records_deactivated: 0,
        },
      },
    ])
  })

  it('skips cities that already have succeeded checkpoints', async () => {
    let fetchCount = 0
    const checkpoints = getEnumValues(CityNameType).map((city) => ({
      city: cityMapper(city),
      records_read: 1,
      records_created: 1,
      records_updated: 0,
      records_deactivated: 0,
    }))
    const prismaService = {
      syncRun: {
        update: () => Promise.resolve({}),
      },
      syncRunCity: {
        createMany: () => Promise.resolve({ count: 0 }),
        findMany: () => Promise.resolve(checkpoints),
      },
    }
    const tdxClientService = {
      fetchRoutes: () => {
        fetchCount += 1
        return Promise.resolve([])
      },
    }
    const service = new RoutesSyncService(
      prismaService as unknown as PrismaService,
      tdxClientService as unknown as TdxClientService,
    )

    await expect(service.syncAllRoutes('sync-run-id')).resolves.toEqual({
      records_read: 22,
      records_created: 22,
      records_updated: 0,
      records_deactivated: 0,
    })
    expect(fetchCount).toBe(0)
  })
})
