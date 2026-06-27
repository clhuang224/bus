import { CityNameType } from '@bus/shared'
import { CityNameType as PrismaCityNameType } from '../generated/prisma/enums.js'
import type { PrismaService } from '../prisma/prisma.service.js'
import type { StopSyncRecords } from './mappers/stop.mapper.js'
import type { StopBulkWriterService } from './stop-bulk-writer.service.js'
import { StopPersistenceService } from './stop-persistence.service.js'

describe('StopPersistenceService', () => {
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
      stops: [
        {
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
        },
      ],
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
})
