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

function getNestedRawValues(call: RawQueryCall): unknown[] {
  return call.values.flatMap((value) => {
    if (
      value &&
      typeof value === 'object' &&
      'values' in value &&
      Array.isArray((value as { values: unknown[] }).values)
    ) {
      return (value as { values: unknown[] }).values
    }

    return [value]
  })
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

function createStation(index: number): StopSyncRecords['stations'][number] {
  return {
    uuid: `station-${index}`,
    tdx_station_id: `station-id-${index}`,
    station_group_uuid: null,
    city: PrismaCityNameType.TAIPEI,
    name_zh_tw: `站位 ${index}`,
    name_en: `Station ${index}`,
    name_ja: null,
    name_ko: null,
    address_zh_tw: null,
    latitude: 25 + index / 1000,
    longitude: 121 + index / 1000,
    bearing: null,
    tdx_updated_at: null,
  }
}

function createStop(index: number): StopSyncRecords['stops'][number] {
  return {
    uuid: `stop-${index}`,
    tdx_stop_id: `stop-id-${index}`,
    station_tdx_id: null,
    city: PrismaCityNameType.TAIPEI,
    name_zh_tw: `站牌 ${index}`,
    name_en: `Stop ${index}`,
    name_ja: null,
    name_ko: null,
    address_zh_tw: null,
    latitude: 25 + index / 1000,
    longitude: 121 + index / 1000,
    bearing: null,
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

  it('deduplicates station groups by uuid before writing raw SQL', async () => {
    const { prismaService, rawQueryCalls } = createPrismaMock()
    const service = new StopBulkWriterService(prismaService)
    const firstRecord = createStationGroup(1)
    const latestRecord = {
      ...createStationGroup(2),
      uuid: firstRecord.uuid,
      tdx_station_group_id: 'latest-station-group-id',
      name_zh_tw: '最新站群',
    }

    await service.upsertStationGroups([firstRecord, latestRecord], () =>
      Promise.resolve(),
    )

    const nestedValues = getNestedRawValues(rawQueryCalls[0])

    expect(rawQueryCalls).toHaveLength(1)
    expect(nestedValues).toContain('latest-station-group-id')
    expect(nestedValues).toContain('最新站群')
    expect(nestedValues).not.toContain(firstRecord.tdx_station_group_id)
    expect(nestedValues).not.toContain(firstRecord.name_zh_tw)
  })

  it('deduplicates stations by uuid before writing raw SQL', async () => {
    const { prismaService, rawQueryCalls } = createPrismaMock()
    const service = new StopBulkWriterService(prismaService)
    const firstRecord = createStation(1)
    const latestRecord = {
      ...createStation(2),
      uuid: firstRecord.uuid,
      tdx_station_id: 'latest-station-id',
      name_zh_tw: '最新站位',
    }

    await service.upsertStations(
      [firstRecord, latestRecord],
      new Map(),
      new Map(),
      () => Promise.resolve(),
    )

    const nestedValues = getNestedRawValues(rawQueryCalls[0])

    expect(rawQueryCalls).toHaveLength(1)
    expect(nestedValues).toContain('latest-station-id')
    expect(nestedValues).toContain('最新站位')
    expect(nestedValues).not.toContain(firstRecord.tdx_station_id)
    expect(nestedValues).not.toContain(firstRecord.name_zh_tw)
  })

  it('deduplicates stops by uuid before writing raw SQL', async () => {
    const { prismaService, rawQueryCalls } = createPrismaMock()
    const service = new StopBulkWriterService(prismaService)
    const firstRecord = createStop(1)
    const latestRecord = {
      ...createStop(2),
      uuid: firstRecord.uuid,
      tdx_stop_id: 'latest-stop-id',
      name_zh_tw: '最新站牌',
    }

    await service.upsertStops(
      [firstRecord, latestRecord],
      new Map(),
      new Map(),
      () => Promise.resolve(),
    )

    const nestedValues = getNestedRawValues(rawQueryCalls[0])

    expect(rawQueryCalls).toHaveLength(1)
    expect(nestedValues).toContain('latest-stop-id')
    expect(nestedValues).toContain('最新站牌')
    expect(nestedValues).not.toContain(firstRecord.tdx_stop_id)
    expect(nestedValues).not.toContain(firstRecord.name_zh_tw)
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

  it('deduplicates route stops by subroute and sequence before writing raw SQL', async () => {
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
        subroute_uuid: 'subroute-1',
        stop_uuid: 'stop-2',
        sequence: 1,
        tdx_updated_at: null,
      },
    ]

    await service.upsertRouteStops(
      routeStops,
      new Map([['subroute-1', 'subroute-db-1']]),
      new Map([
        ['stop-1', 'stop-db-1'],
        ['stop-2', 'stop-db-2'],
      ]),
      incomingKeys,
      () => Promise.resolve(),
    )

    const nestedValues = getNestedRawValues(rawQueryCalls[0])

    expect(incomingKeys).toEqual(new Set(['subroute-db-1:1']))
    expect(rawQueryCalls).toHaveLength(1)
    expect(nestedValues).toContain('stop-db-2')
    expect(nestedValues).not.toContain('stop-db-1')
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

  it('deduplicates route shapes by subroute before writing raw SQL', async () => {
    const { prismaService, rawQueryCalls } = createPrismaMock()
    const service = new StopBulkWriterService(prismaService)
    const routeShapes: StopSyncRecords['routeShapes'] = [
      {
        subroute_uuid: 'subroute-1',
        source: PrismaRouteShapeSource.STOP_POSITIONS,
        path: [[121, 25]],
        tdx_updated_at: null,
      },
      {
        subroute_uuid: 'subroute-1',
        source: PrismaRouteShapeSource.STOP_POSITIONS,
        path: [[122, 26]],
        tdx_updated_at: null,
      },
    ]

    await service.upsertRouteShapes(
      routeShapes,
      new Map([['subroute-1', 'subroute-db-1']]),
      () => Promise.resolve(),
    )

    const nestedValues = getNestedRawValues(rawQueryCalls[0])

    expect(rawQueryCalls).toHaveLength(1)
    expect(nestedValues).toContain(JSON.stringify([[122, 26]]))
    expect(nestedValues).not.toContain(JSON.stringify([[121, 25]]))
  })
})
