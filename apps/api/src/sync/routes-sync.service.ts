import { Injectable, Logger } from '@nestjs/common'
import { CityNameType, getEnumValues } from '@bus/shared'
import { RoutePersistenceService } from './route-persistence.service.js'
import { cityMapper, routeMapper } from './mappers/route.mapper.js'
import { SyncCheckpointService } from './sync-checkpoint.service.js'
import type { SyncResult } from './sync-result.js'
import { addSyncResult, createEmptySyncResult } from './sync-result.js'
import { TdxClientService } from './tdx-client.service.js'

const CITY_SYNC_HEARTBEAT_INTERVAL_MS = 60_000

@Injectable()
export class RoutesSyncService {
  private readonly logger = new Logger(RoutesSyncService.name)

  constructor(
    private readonly tdxClientService: TdxClientService,
    private readonly routePersistenceService: RoutePersistenceService,
    private readonly syncCheckpointService: SyncCheckpointService,
  ) {}

  async syncAllRoutes(syncRunId: string): Promise<SyncResult> {
    await this.syncCheckpointService.startRun(syncRunId)

    const result = createEmptySyncResult()
    const cities = getEnumValues(CityNameType)
    let currentCity: CityNameType | null = null

    this.logger.log(
      `Route sync ${syncRunId} started for ${cities.length} cities.`,
    )

    try {
      await this.syncCheckpointService.ensureCities(syncRunId, cities)
      const completedCities =
        await this.syncCheckpointService.getCompletedCities(syncRunId)

      for (const checkpoint of completedCities.values()) {
        addSyncResult(result, checkpoint)
      }
      await this.syncCheckpointService.updateRunResult(syncRunId, result)

      for (const [index, city] of cities.entries()) {
        if (completedCities.has(cityMapper(city))) {
          this.logger.log(
            `Route sync ${syncRunId}: skipping completed city ${city} (${index + 1}/${cities.length}).`,
          )
          continue
        }

        currentCity = city
        await this.syncCheckpointService.startCity(syncRunId, city)

        this.logger.log(
          `Route sync ${syncRunId}: starting ${city} (${index + 1}/${cities.length}).`,
        )
        const cityResult = await this.syncCityRoutes(city, syncRunId)

        addSyncResult(result, cityResult)
        await this.syncCheckpointService.completeCity(
          syncRunId,
          city,
          cityResult,
        )
        currentCity = null

        await this.syncCheckpointService.updateRunResult(syncRunId, result)

        this.logger.log(
          `Route sync ${syncRunId}: completed ${city} (${index + 1}/${cities.length}), read ${cityResult.records_read}, created ${cityResult.records_created}, updated ${cityResult.records_updated}, deactivated ${cityResult.records_deactivated}.`,
        )
      }

      await this.syncCheckpointService.completeRun(syncRunId, result)

      this.logger.log(
        `Route sync ${syncRunId} succeeded: read ${result.records_read}, created ${result.records_created}, updated ${result.records_updated}, deactivated ${result.records_deactivated}.`,
      )

      return result
    } catch (error) {
      if (currentCity) {
        await this.syncCheckpointService.failCity(syncRunId, currentCity, error)
      }
      await this.syncCheckpointService.failRun(syncRunId, error, result)
      throw error
    }
  }

  async syncCityRoutes(
    city: CityNameType,
    syncRunId: string,
  ): Promise<SyncResult> {
    const heartbeatTimer = this.startCityHeartbeat(syncRunId, city)

    try {
      const tdxRoutes = await this.tdxClientService.fetchRoutes(city, syncRunId)
      const routes = routeMapper({ city, tdxRoutes })

      this.logger.log(
        `Route sync ${syncRunId}: ${city} returned ${routes.length} routes from TDX.`,
      )

      return await this.routePersistenceService.persistRoutes(routes, {
        city,
        onProgress: async (persistedCount, totalCount) => {
          await this.syncCheckpointService.touch(syncRunId, city)
          this.logger.log(
            `Route sync ${syncRunId}: persisted ${persistedCount}/${totalCount} routes for ${city}.`,
          )
        },
      })
    } finally {
      clearInterval(heartbeatTimer)
    }
  }

  private startCityHeartbeat(
    syncRunId: string,
    city: CityNameType,
  ): ReturnType<typeof setInterval> {
    let heartbeatPromise: Promise<void> | null = null
    const timer = setInterval(() => {
      if (heartbeatPromise) return

      heartbeatPromise = this.syncCheckpointService
        .touch(syncRunId, city)
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error)
          this.logger.error(
            `Route sync ${syncRunId}: heartbeat failed for ${city}: ${message}`,
          )
        })
        .finally(() => {
          heartbeatPromise = null
        })
    }, CITY_SYNC_HEARTBEAT_INTERVAL_MS)
    timer.unref()

    return timer
  }
}
