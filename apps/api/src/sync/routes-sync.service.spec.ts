import { CityNameType, getEnumValues } from '@bus/shared'
import { Test } from '@nestjs/testing'
import { cityMapper } from './mappers/route.mapper.js'
import { RoutePersistenceService } from './route-persistence.service.js'
import { RoutesSyncService } from './routes-sync.service.js'
import { SyncCheckpointService } from './sync-checkpoint.service.js'
import type { SyncResult } from './sync-result.js'
import {
  TdxClientService,
  TdxMonthlyQuotaExceededError,
} from './tdx-client.service.js'

async function createService({
  tdxClientService,
  routePersistenceService = {},
  syncCheckpointService,
}: {
  tdxClientService: object
  routePersistenceService?: object
  syncCheckpointService: object
}) {
  const module = await Test.createTestingModule({
    providers: [
      RoutesSyncService,
      { provide: TdxClientService, useValue: tdxClientService },
      { provide: RoutePersistenceService, useValue: routePersistenceService },
      { provide: SyncCheckpointService, useValue: syncCheckpointService },
    ],
  }).compile()

  return module.get(RoutesSyncService)
}

describe('RoutesSyncService', () => {
  it('marks the current city and run when the monthly quota is exhausted', async () => {
    const retryAt = new Date('2026-07-01T00:00:00.000Z')
    const quotaError = new TdxMonthlyQuotaExceededError(
      'TDX monthly request quota has been exhausted.',
      retryAt,
    )
    const failedCities: Array<[string, CityNameType, Error]> = []
    const failedRuns: Array<[string, Error, SyncResult]> = []
    const tdxClientService = {
      fetchRoutes: () => Promise.reject(quotaError),
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

    await expect(service.syncAllRoutes('sync-run-id')).rejects.toBe(quotaError)

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

  it('preserves the sync error when checkpoint finalization fails', async () => {
    const syncError = new Error('TDX unavailable')
    const loggedErrors: string[] = []
    let failCityCount = 0
    let failRunCount = 0
    const tdxClientService = {
      fetchRoutes: () => Promise.reject(syncError),
    }
    const syncCheckpointService = {
      startRun: () => Promise.resolve(),
      ensureCities: () => Promise.resolve(),
      getCompletedCities: () => Promise.resolve(new Map()),
      startCity: () => Promise.resolve(),
      updateRunResult: () => Promise.resolve(),
      failCity: () => {
        failCityCount += 1
        return Promise.reject(new Error('City checkpoint unavailable'))
      },
      failRun: () => {
        failRunCount += 1
        return Promise.reject(new Error('Run checkpoint unavailable'))
      },
    }
    const service = await createService({
      tdxClientService,
      syncCheckpointService,
    })
    Object.defineProperty(service, 'logger', {
      value: {
        error: (message: string) => loggedErrors.push(message),
        log: () => undefined,
      },
    })

    await expect(service.syncAllRoutes('sync-run-id')).rejects.toBe(syncError)

    expect(failCityCount).toBe(1)
    expect(failRunCount).toBe(1)
    expect(loggedErrors).toEqual([
      'Route sync sync-run-id: failed to mark Taipei as failed: City checkpoint unavailable',
      'Route sync sync-run-id: failed to mark the sync run as failed: Run checkpoint unavailable',
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
      fetchRoutes: () => {
        fetchCount += 1
        return Promise.resolve([])
      },
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

    await expect(service.syncAllRoutes('sync-run-id')).resolves.toEqual({
      records_read: 22,
      records_created: 22,
      records_updated: 0,
      records_deactivated: 0,
    })
    expect(fetchCount).toBe(0)
  })

  it('resumes from the first city without a completed checkpoint', async () => {
    const fetchedCities: CityNameType[] = []
    const runResults: SyncResult[] = []
    const taipeiCheckpoint = {
      city: cityMapper(CityNameType.TAIPEI),
      records_read: 419,
      records_created: 13,
      records_updated: 406,
      records_deactivated: 0,
    }
    const tdxClientService = {
      fetchRoutes: (city: CityNameType) => {
        fetchedCities.push(city)
        return Promise.resolve([])
      },
    }
    const routePersistenceService = {
      persistRoutes: () =>
        Promise.resolve({
          records_read: 0,
          records_created: 0,
          records_updated: 0,
          records_deactivated: 0,
        }),
    }
    const syncCheckpointService = {
      startRun: () => Promise.resolve(),
      ensureCities: () => Promise.resolve(),
      getCompletedCities: () =>
        Promise.resolve(new Map([[taipeiCheckpoint.city, taipeiCheckpoint]])),
      startCity: () => Promise.resolve(),
      touch: () => Promise.resolve(),
      completeCity: () => Promise.resolve(),
      updateRunResult: (_syncRunId: string, result: SyncResult) => {
        runResults.push(structuredClone(result))
        return Promise.resolve()
      },
      completeRun: () => Promise.resolve(),
    }
    const service = await createService({
      tdxClientService,
      routePersistenceService,
      syncCheckpointService,
    })

    await expect(service.syncAllRoutes('sync-run-id')).resolves.toEqual({
      records_read: 419,
      records_created: 13,
      records_updated: 406,
      records_deactivated: 0,
    })
    expect(fetchedCities).toHaveLength(21)
    expect(fetchedCities[0]).toBe(CityNameType.NEW_TAIPEI)
    expect(fetchedCities).not.toContain(CityNameType.TAIPEI)
    expect(runResults[0]).toEqual({
      records_read: 419,
      records_created: 13,
      records_updated: 406,
      records_deactivated: 0,
    })
  })
})
