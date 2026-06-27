import { CityNameType, getEnumValues } from '@bus/shared'
import { Test } from '@nestjs/testing'
import { cityMapper } from './mappers/route.mapper.js'
import { StopPersistenceService } from './stop-persistence.service.js'
import { StopsSyncService } from './stops-sync.service.js'
import { SyncCheckpointService } from './sync-checkpoint.service.js'
import type { SyncResult } from './sync-result.js'
import {
  TdxClientService,
  TdxMonthlyQuotaExceededError,
} from './tdx-client.service.js'

async function createService({
  tdxClientService,
  stopPersistenceService = {},
  syncCheckpointService,
}: {
  tdxClientService: object
  stopPersistenceService?: object
  syncCheckpointService: object
}) {
  const module = await Test.createTestingModule({
    providers: [
      StopsSyncService,
      { provide: TdxClientService, useValue: tdxClientService },
      { provide: StopPersistenceService, useValue: stopPersistenceService },
      { provide: SyncCheckpointService, useValue: syncCheckpointService },
    ],
  }).compile()

  return module.get(StopsSyncService)
}

describe('StopsSyncService', () => {
  const originalSyncCities = process.env.SYNC_CITIES

  beforeEach(() => {
    delete process.env.SYNC_CITIES
  })

  afterEach(() => {
    if (originalSyncCities === undefined) delete process.env.SYNC_CITIES
    else process.env.SYNC_CITIES = originalSyncCities
  })

  it('marks the current city and run when the monthly quota is exhausted', async () => {
    const retryAt = new Date('2026-07-01T00:00:00.000Z')
    const quotaError = new TdxMonthlyQuotaExceededError(
      'TDX monthly request quota has been exhausted.',
      retryAt,
    )
    const failedCities: Array<[string, CityNameType, Error]> = []
    const failedRuns: Array<[string, Error, SyncResult]> = []
    const tdxClientService = {
      fetchStationGroups: () => Promise.resolve([]),
      fetchStations: () => Promise.reject(quotaError),
      fetchStops: () => Promise.resolve([]),
      fetchStopOfRoutes: () => Promise.resolve([]),
    }
    const syncCheckpointService = {
      startRun: () => Promise.resolve(),
      ensureCities: () => Promise.resolve(),
      getCompletedCities: () => Promise.resolve(new Map()),
      startCity: () => Promise.resolve(),
      updateRunResult: () => Promise.resolve(),
      failCity: (syncRunId: string, city: CityNameType, error: Error) => {
        failedCities.push([syncRunId, city, error])
        return Promise.resolve()
      },
      failRun: (syncRunId: string, error: Error, result: SyncResult) => {
        failedRuns.push([syncRunId, error, result])
        return Promise.resolve()
      },
    }
    const service = await createService({
      tdxClientService,
      syncCheckpointService,
    })

    await expect(service.syncAllStops('sync-run-id')).rejects.toBe(quotaError)

    expect(failedCities).toEqual([
      ['sync-run-id', CityNameType.TAIPEI, quotaError],
    ])
    expect(failedRuns).toEqual([
      [
        'sync-run-id',
        quotaError,
        {
          records_read: 0,
          records_created: 0,
          records_updated: 0,
          records_deactivated: 0,
        },
      ],
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
    const tdxClientService = {
      fetchStationGroups: () => {
        fetchCount += 1
        return Promise.resolve([])
      },
      fetchStations: () => Promise.resolve([]),
      fetchStops: () => Promise.resolve([]),
      fetchStopOfRoutes: () => Promise.resolve([]),
    }
    const syncCheckpointService = {
      startRun: () => Promise.resolve(),
      ensureCities: () => Promise.resolve(),
      getCompletedCities: () =>
        Promise.resolve(
          new Map(
            checkpoints.map((checkpoint) => [checkpoint.city, checkpoint]),
          ),
        ),
      updateRunResult: () => Promise.resolve(),
      completeRun: () => Promise.resolve(),
    }
    const service = await createService({
      tdxClientService,
      syncCheckpointService,
    })

    await expect(service.syncAllStops('sync-run-id')).resolves.toEqual({
      records_read: 22,
      records_created: 22,
      records_updated: 0,
      records_deactivated: 0,
    })
    expect(fetchCount).toBe(0)
  })

  it('skips station groups when TDX does not support the city', async () => {
    let fetchStationGroupsCallCount = 0
    const tdxClientService = {
      fetchStationGroups: () => {
        fetchStationGroupsCallCount += 1

        return Promise.resolve([])
      },
      fetchStations: () => Promise.resolve([]),
      fetchStops: () =>
        Promise.resolve([
          {
            StopUID: 'TPE-stop-1',
            StopID: 'stop-1',
            StopName: { Zh_tw: '測試站', En: 'Test Stop' },
            StopPosition: { PositionLat: 25, PositionLon: 121 },
            AuthorityID: '004',
            StationID: 'station-1',
            StationGroupID: 'station-group-1',
            UpdateTime: '2026-06-25T00:00:00+08:00',
            VersionID: 1,
          },
        ]),
      fetchStopOfRoutes: () => Promise.resolve([]),
    }
    const persistedStationGroupCounts: number[] = []
    const stopPersistenceService = {
      persistStops: (records: { stationGroups: unknown[] }) => {
        persistedStationGroupCounts.push(records.stationGroups.length)

        return Promise.resolve({
          records_read: 1,
          records_created: 1,
          records_updated: 0,
          records_deactivated: 0,
        })
      },
    }
    const syncCheckpointService = {
      touch: () => Promise.resolve(),
    }
    const service = await createService({
      tdxClientService,
      stopPersistenceService,
      syncCheckpointService,
    })

    await expect(
      service.syncCityStops(CityNameType.TAIPEI, 'sync-run-id'),
    ).resolves.toEqual({
      records_read: 1,
      records_created: 1,
      records_updated: 0,
      records_deactivated: 0,
    })

    expect(fetchStationGroupsCallCount).toBe(0)
    expect(persistedStationGroupCounts).toEqual([0])
  })
})
