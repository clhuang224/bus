import {
  CityNameType as PrismaCityNameType,
  RouteShapeSource as PrismaRouteShapeSource,
} from '../generated/prisma/enums.js'
import type { PrismaService } from '../prisma/prisma.service.js'
import type { StopSyncRecords } from './mappers/stop.mapper.js'
import { StopBulkWriterService } from './stop-bulk-writer.service.js'

interface RawQueryCall {
  strings: TemplateStringsArray
  values: unknown[]
}

function createPrismaMock() {
  const rawQueryCalls: RawQueryCall[] = []
  const prismaService = {
    $executeRaw: (strings: TemplateStringsArray, ...values: unknown[]) => {
      rawQueryCalls.push({ strings, values })

      return Promise.resolve(0)
    },
  } as unknown as PrismaService

  return { prismaService, rawQueryCalls }
}

function renderRawQuery(call: RawQueryCall): string {
  return call.strings
    .reduce(
      (sql, segment, index) =>
        `${sql}${segment}${index < call.values.length ? '?' : ''}`,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim()
}

function createStationGroup(
  index: number,
): StopSyncRecords['stationGroups'][number] {
  return {
    uuid: `station-group-${index}`,
    tdx_station_group_id: `station-group-id-${index}`,
    city: PrismaCityNameType.TAIPEI,
    name_zh_tw: `站群 ${index}`,
    name_en: `Station Group ${index}`,
    name_ja: null,
    name_ko: null,
    latitude: 25 + index / 1000,
    longitude: 121 + index / 1000,
    tdx_updated_at: null,
  }
}

describe('StopBulkWriterService', () => {
  it('chunks station group upserts before writing raw SQL', async () => {
    const { prismaService, rawQueryCalls } = createPrismaMock()
    const service = new StopBulkWriterService(prismaService)
    const batchCounts: number[] = []

    await service.upsertStationGroups(
      Array.from({ length: 501 }, (_, index) => createStationGroup(index)),
      (count) => {
        batchCounts.push(count)

        return Promise.resolve()
      },
    )

    expect(batchCounts).toEqual([500, 1])
    expect(rawQueryCalls).toHaveLength(2)
    expect(rawQueryCalls[0].values).toHaveLength(1)
    expect(renderRawQuery(rawQueryCalls[0])).toContain(
      'INSERT INTO "station_group"',
    )
    expect(renderRawQuery(rawQueryCalls[0])).toContain(
      'ON CONFLICT ("uuid") DO UPDATE SET',
    )
  })

  it('writes route stops only when subroute and stop ids are available', async () => {
    const { prismaService, rawQueryCalls } = createPrismaMock()
    const service = new StopBulkWriterService(prismaService)
    const incomingKeys = new Set<string>()
    const routeStops: StopSyncRecords['routeStops'] = [
      {
        subroute_uuid: 'subroute-1',
        stop_uuid: 'stop-1',
        sequence: 1,
        tdx_updated_at: null,
      },
      {
        subroute_uuid: 'missing-subroute',
        stop_uuid: 'stop-1',
        sequence: 2,
        tdx_updated_at: null,
      },
      {
        subroute_uuid: 'subroute-1',
        stop_uuid: 'missing-stop',
        sequence: 3,
        tdx_updated_at: null,
      },
    ]

    await service.upsertRouteStops(
      routeStops,
      new Map([['subroute-1', 'subroute-db-1']]),
      new Map([['stop-1', 'stop-db-1']]),
      incomingKeys,
      () => Promise.resolve(),
    )

    expect(incomingKeys).toEqual(new Set(['subroute-db-1:1']))
    expect(rawQueryCalls).toHaveLength(1)
    expect(rawQueryCalls[0].values).toHaveLength(1)
    expect(renderRawQuery(rawQueryCalls[0])).toContain(
      'INSERT INTO "route_stop"',
    )
    expect(renderRawQuery(rawQueryCalls[0])).toContain(
      'ON CONFLICT ("subroute_id", "sequence") DO UPDATE SET',
    )
  })

  it('preserves non-fallback route shapes when upserting fallback shapes', async () => {
    const { prismaService, rawQueryCalls } = createPrismaMock()
    const service = new StopBulkWriterService(prismaService)
    const routeShapes: StopSyncRecords['routeShapes'] = [
      {
        subroute_uuid: 'subroute-1',
        source: PrismaRouteShapeSource.STOP_POSITIONS,
        path: [[121, 25]],
        tdx_updated_at: null,
      },
    ]

    await service.upsertRouteShapes(
      routeShapes,
      new Map([['subroute-1', 'subroute-db-1']]),
      () => Promise.resolve(),
    )

    expect(rawQueryCalls).toHaveLength(1)
    expect(rawQueryCalls[0].values).toHaveLength(1)
    expect(renderRawQuery(rawQueryCalls[0])).toContain(
      `WHERE "route_shape"."source" = 'stop_positions'::"RouteShapeSource"`,
    )
  })
})
