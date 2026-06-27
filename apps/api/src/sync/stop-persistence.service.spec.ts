import { CityNameType } from '@bus/shared'
import { CityNameType as PrismaCityNameType } from '../generated/prisma/enums.js'
import type { PrismaService } from '../prisma/prisma.service.js'
import type { StopSyncRecords } from './mappers/stop.mapper.js'
import type { StopBulkWriterService } from './stop-bulk-writer.service.js'
import { StopPersistenceService } from './stop-persistence.service.js'

describe('StopPersistenceService', () => {
  const stopRecord: StopSyncRecords['stops'][number] = {
    uuid: 'TPE-stop-1',
    tdx_stop_id: 'stop-1',
    station_tdx_id: null,
    city: PrismaCityNameType.TAIPEI,
    name_zh_tw: '測試站',
    name_en: 'Test Stop',
    name_ja: null,
    name_ko: null,
    address_zh_tw: null,
    latitude: 25,
    longitude: 121,
    bearing: null,
    tdx_updated_at: null,
  }

  it('does not deactivate station groups when station group sync is skipped', async () => {
    let stationGroupUpdateCount = 0
    const prismaService = {
      stationGroup: {
        findMany: () => Promise.resolve([]),
        updateMany: () => {
          stationGroupUpdateCount += 1

          return Promise.resolve({ count: 0 })
        },
      },
      station: {
        findMany: () => Promise.resolve([]),
        updateMany: () => Promise.resolve({ count: 0 }),
      },
      stop: {
        findMany: () => Promise.resolve([]),
        updateMany: () => Promise.resolve({ count: 0 }),
      },
    } as unknown as PrismaService
    const stopBulkWriterService = {
      upsertStationGroups: () => Promise.resolve(),
      upsertStations: () => Promise.resolve(),
      upsertStops: () => Promise.resolve(),
      upsertRouteStops: () => Promise.resolve(),
      upsertRouteShapes: () => Promise.resolve(),
    } as unknown as StopBulkWriterService
    const service = new StopPersistenceService(
      prismaService,
      stopBulkWriterService,
    )
    const records: StopSyncRecords = {
      stationGroups: [],
      stations: [],
      stops: [stopRecord],
      routeStops: [],
      routeShapes: [],
    }

    await expect(
      service.persistStops(records, { city: CityNameType.TAIPEI }),
    ).resolves.toEqual({
      records_read: 1,
      records_created: 1,
      records_updated: 0,
      records_deactivated: 0,
    })
    expect(stationGroupUpdateCount).toBe(0)
  })

  it('deactivates missing route stops in batches by subroute', async () => {
    const routeStopUpdateManyArgs: unknown[] = []
    const prismaService = {
      stationGroup: {
        findMany: () => Promise.resolve([]),
        updateMany: () => Promise.resolve({ count: 0 }),
      },
      station: {
        findMany: () => Promise.resolve([]),
        updateMany: () => Promise.resolve({ count: 0 }),
      },
      stop: {
        findMany: () =>
          Promise.resolve([
            {
              id: 'stop-db-1',
              uuid: 'TPE-stop-1',
              address_zh_tw: null,
              address_en: null,
            },
          ]),
        updateMany: () => Promise.resolve({ count: 0 }),
      },
      subRoute: {
        findMany: () =>
          Promise.resolve([
            { id: 'subroute-db-1', uuid: 'subroute-1' },
            { id: 'subroute-db-2', uuid: 'subroute-2' },
          ]),
      },
      routeStop: {
        findMany: () =>
          Promise.resolve([
            { subroute_id: 'subroute-db-1', sequence: 1 },
            { subroute_id: 'subroute-db-1', sequence: 2 },
            { subroute_id: 'subroute-db-1', sequence: 3 },
            { subroute_id: 'subroute-db-2', sequence: 1 },
          ]),
        updateMany: (args: unknown) => {
          routeStopUpdateManyArgs.push(args)

          return Promise.resolve({ count: 0 })
        },
      },
    } as unknown as PrismaService
    const stopBulkWriterService = {
      upsertStationGroups: () => Promise.resolve(),
      upsertStations: () => Promise.resolve(),
      upsertStops: () => Promise.resolve(),
      upsertRouteStops: (
        _routeStops: StopSyncRecords['routeStops'],
        _subrouteIds: Map<string, string>,
        _stopIds: Map<string, string>,
        incomingKeys: Set<string>,
      ) => {
        incomingKeys.add('subroute-db-1:1')
        incomingKeys.add('subroute-db-2:1')

        return Promise.resolve()
      },
      upsertRouteShapes: () => Promise.resolve(),
    } as unknown as StopBulkWriterService
    const service = new StopPersistenceService(
      prismaService,
      stopBulkWriterService,
    )
    const records: StopSyncRecords = {
      stationGroups: [],
      stations: [],
      stops: [stopRecord],
      routeStops: [
        {
          subroute_uuid: 'subroute-1',
          stop_uuid: 'TPE-stop-1',
          sequence: 1,
          tdx_updated_at: null,
        },
        {
          subroute_uuid: 'subroute-2',
          stop_uuid: 'TPE-stop-1',
          sequence: 1,
          tdx_updated_at: null,
        },
      ],
      routeShapes: [],
    }

    await service.persistStops(records, { city: CityNameType.TAIPEI })

    expect(routeStopUpdateManyArgs).toEqual([
      expect.objectContaining({
        where: {
          subroute_id: 'subroute-db-1',
          sequence: { in: [2, 3] },
          is_active: true,
        },
      }),
    ])
  })
})
