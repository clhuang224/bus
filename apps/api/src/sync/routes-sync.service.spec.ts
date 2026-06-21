import { CityNameType, getEnumValues } from '@bus/shared'
import { cityMapper } from './mappers/route.mapper.js'
import type { RoutePersistenceService } from './route-persistence.service.js'
import { RoutesSyncService } from './routes-sync.service.js'
import type { SyncCheckpointService } from './sync-checkpoint.service.js'
import type { TdxClientService } from './tdx-client.service.js'
import { TdxMonthlyQuotaExceededError } from './tdx-client.service.js'

describe('RoutesSyncService', () => {
  it('marks the current city and run when the monthly quota is exhausted', async () => {
    const retryAt = new Date('2026-07-01T00:00:00.000Z')
    const quotaError = new TdxMonthlyQuotaExceededError(
      'TDX monthly request quota has been exhausted.',
      retryAt,
    )
    const failedCities: unknown[] = []
    const failedRuns: unknown[] = []
    const tdxClientService = {
      fetchRoutes: () => Promise.reject(quotaError),
    }
    const routePersistenceService = {}
    const syncCheckpointService = {
      startRun: () => Promise.resolve(),
      ensureCities: () => Promise.resolve(),
      getCompletedCities: () => Promise.resolve(new Map()),
      startCity: () => Promise.resolve(),
      failCity: (...args: unknown[]) => {
        failedCities.push(args)
        return Promise.resolve()
      },
      failRun: (...args: unknown[]) => {
        failedRuns.push(args)
        return Promise.resolve()
      },
    }
    const service = new RoutesSyncService(
      tdxClientService as unknown as TdxClientService,
      routePersistenceService as RoutePersistenceService,
      syncCheckpointService as unknown as SyncCheckpointService,
    )

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
    const routePersistenceService = {}
    const syncCheckpointService = {
      startRun: () => Promise.resolve(),
      ensureCities: () => Promise.resolve(),
      getCompletedCities: () =>
        Promise.resolve(
          new Map(
            checkpoints.map((checkpoint) => [checkpoint.city, checkpoint]),
          ),
        ),
      completeRun: () => Promise.resolve(),
    }
    const service = new RoutesSyncService(
      tdxClientService as unknown as TdxClientService,
      routePersistenceService as RoutePersistenceService,
      syncCheckpointService as unknown as SyncCheckpointService,
    )

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
      updateRunResult: () => Promise.resolve(),
      completeRun: () => Promise.resolve(),
    }
    const service = new RoutesSyncService(
      tdxClientService as unknown as TdxClientService,
      routePersistenceService as unknown as RoutePersistenceService,
      syncCheckpointService as unknown as SyncCheckpointService,
    )

    await expect(service.syncAllRoutes('sync-run-id')).resolves.toEqual({
      records_read: 419,
      records_created: 13,
      records_updated: 406,
      records_deactivated: 0,
    })
    expect(fetchedCities).toHaveLength(21)
    expect(fetchedCities[0]).toBe(CityNameType.NEW_TAIPEI)
    expect(fetchedCities).not.toContain(CityNameType.TAIPEI)
  })
})
