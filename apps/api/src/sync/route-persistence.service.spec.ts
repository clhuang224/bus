import { CityNameType, DirectionType } from '@bus/shared'
import type { TdxBusRoute } from '@bus/shared'
import type { Prisma } from '../generated/prisma/client.js'
import type { PrismaService } from '../prisma/prisma.service.js'
import { routeMapper } from './mappers/route.mapper.js'
import { RoutePersistenceService } from './route-persistence.service.js'

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

function createPersistenceMocks({
  routeUpsert,
}: {
  routeUpsert?: (args: Prisma.RouteUpsertArgs) => Promise<{ id: string }>
} = {}) {
  const calls = {
    routeFindMany: 0,
    routeUpsert: [] as Prisma.RouteUpsertArgs[],
    routeUpdateMany: [] as Prisma.RouteUpdateManyArgs[],
    subRouteUpsert: [] as Prisma.SubRouteUpsertArgs[],
    subRouteUpdateMany: [] as Prisma.SubRouteUpdateManyArgs[],
    operatorUpsert: [] as Prisma.OperatorUpsertArgs[],
    routeOperatorUpsert: [] as Prisma.RouteOperatorUpsertArgs[],
  }
  const prismaService = {
    route: {
      findMany: () => {
        calls.routeFindMany += 1
        return Promise.resolve([])
      },
      upsert: (args: Prisma.RouteUpsertArgs) => {
        calls.routeUpsert.push(args)
        return routeUpsert?.(args) ?? Promise.resolve({ id: 'route-db-id' })
      },
      updateMany: (args: Prisma.RouteUpdateManyArgs) => {
        calls.routeUpdateMany.push(args)
        return Promise.resolve({ count: 2 })
      },
    },
    subRoute: {
      upsert: (args: Prisma.SubRouteUpsertArgs) => {
        calls.subRouteUpsert.push(args)
        return Promise.resolve({ id: 'subroute-db-id' })
      },
      updateMany: (args: Prisma.SubRouteUpdateManyArgs) => {
        calls.subRouteUpdateMany.push(args)
        return Promise.resolve({ count: 0 })
      },
    },
    operator: {
      upsert: (args: Prisma.OperatorUpsertArgs) => {
        calls.operatorUpsert.push(args)
        return Promise.resolve({ id: 'operator-db-id' })
      },
    },
    routeOperator: {
      upsert: (args: Prisma.RouteOperatorUpsertArgs) => {
        calls.routeOperatorUpsert.push(args)
        return Promise.resolve({})
      },
      deleteMany: () => Promise.resolve({ count: 0 }),
    },
  }

  return { calls, prismaService }
}

describe('RoutePersistenceService', () => {
  it('rejects an empty city response without changing stored routes', async () => {
    const { calls, prismaService } = createPersistenceMocks()
    const service = new RoutePersistenceService(
      prismaService as unknown as PrismaService,
    )

    await expect(
      service.persistRoutes([], { city: CityNameType.NEW_TAIPEI }),
    ).rejects.toThrow('TDX returned 0 routes for NewTaipei.')
    expect(calls.routeFindMany).toBe(0)
    expect(calls.routeUpsert).toHaveLength(0)
    expect(calls.routeUpdateMany).toHaveLength(0)
    expect(calls.subRouteUpdateMany).toHaveLength(0)
  })

  it('persists routes with their subroutes and operators', async () => {
    const { calls, prismaService } = createPersistenceMocks()
    const service = new RoutePersistenceService(
      prismaService as unknown as PrismaService,
    )
    const routes = routeMapper({
      city: CityNameType.NEW_TAIPEI,
      tdxRoutes: [tdxRoute],
    })

    await expect(
      service.persistRoutes(routes, { city: CityNameType.NEW_TAIPEI }),
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
    const routeDeactivation = calls.routeUpdateMany[0]
    const subRouteDeactivation = calls.subRouteUpdateMany[1]
    expect(calls.subRouteUpdateMany[0]).toEqual(
      expect.objectContaining({
        where: {
          route_id: 'route-db-id',
          is_active: true,
          uuid: { notIn: ['NWT101160-0'] },
        },
      }),
    )
    expect(routeDeactivation.where).toEqual({
      city: 'NEW_TAIPEI',
      uuid: { notIn: ['NWT10116'] },
      is_active: true,
    })
    expect(subRouteDeactivation.where).toEqual({
      is_active: true,
      route: {
        city: 'NEW_TAIPEI',
        uuid: { notIn: ['NWT10116'] },
      },
    })
    expect(routeDeactivation.data.is_active).toBe(false)
    expect(routeDeactivation.data.inactive_at).toBeInstanceOf(Date)
    expect(subRouteDeactivation.data.is_active).toBe(false)
    expect(subRouteDeactivation.data.inactive_at).toBeInstanceOf(Date)
    expect(subRouteDeactivation.data.inactive_at).toBe(
      routeDeactivation.data.inactive_at,
    )
  })

  it('persists routes with bounded concurrency', async () => {
    let activeUpserts = 0
    let maximumActiveUpserts = 0
    const { prismaService } = createPersistenceMocks({
      routeUpsert: async () => {
        activeUpserts += 1
        maximumActiveUpserts = Math.max(maximumActiveUpserts, activeUpserts)
        await new Promise<void>((resolve) => setImmediate(resolve))
        activeUpserts -= 1

        return { id: 'route-db-id' }
      },
    })
    const service = new RoutePersistenceService(
      prismaService as unknown as PrismaService,
    )
    const routes = routeMapper({
      city: CityNameType.NEW_TAIPEI,
      tdxRoutes: Array.from({ length: 6 }, (_, index) => ({
        ...tdxRoute,
        RouteUID: `NWT10116-${index}`,
        RouteID: `10116-${index}`,
      })),
    })
    const progress: Array<[number, number]> = []

    await service.persistRoutes(routes, {
      city: CityNameType.NEW_TAIPEI,
      onProgress: (persistedCount, totalCount) => {
        progress.push([persistedCount, totalCount])
        return Promise.resolve()
      },
    })

    expect(maximumActiveUpserts).toBe(5)
    expect(progress).toEqual([[6, 6]])
  })
})
