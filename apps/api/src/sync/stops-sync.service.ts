import { Injectable, Logger } from '@nestjs/common'
import { CityNameType, getEnumValues } from '@bus/shared'
import { stopMapper } from './mappers/stop.mapper.js'
import { cityMapper } from './mappers/route.mapper.js'
import { StopPersistenceService } from './stop-persistence.service.js'
import { SyncCheckpointService } from './sync-checkpoint.service.js'
import type { SyncResult } from './sync-result.js'
import { addSyncResult, createEmptySyncResult } from './sync-result.js'
import { TdxClientService } from './tdx-client.service.js'

const CITY_SYNC_HEARTBEAT_INTERVAL_MS = 60_000

@Injectable()
export class StopsSyncService {
  private readonly logger = new Logger(StopsSyncService.name)

  constructor(
    private readonly tdxClientService: TdxClientService,
    private readonly stopPersistenceService: StopPersistenceService,
    private readonly syncCheckpointService: SyncCheckpointService,
  ) {}

  async syncAllStops(syncRunId: string): Promise<SyncResult> {
    await this.syncCheckpointService.startRun(syncRunId)

    const result = createEmptySyncResult()
    const cities = getEnumValues(CityNameType)
    let currentCity: CityNameType | null = null

    this.logger.log(
      `Stop sync ${syncRunId} started for ${cities.length} cities.`,
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
            `Stop sync ${syncRunId}: skipping completed city ${city} (${index + 1}/${cities.length}).`,
          )
          continue
        }

        currentCity = city
        await this.syncCheckpointService.startCity(syncRunId, city)

        this.logger.log(
          `Stop sync ${syncRunId}: starting ${city} (${index + 1}/${cities.length}).`,
        )
        const cityResult = await this.syncCityStops(city, syncRunId)

        addSyncResult(result, cityResult)
        await this.syncCheckpointService.completeCity(
          syncRunId,
          city,
          cityResult,
        )
        currentCity = null

        await this.syncCheckpointService.updateRunResult(syncRunId, result)

        this.logger.log(
          `Stop sync ${syncRunId}: completed ${city} (${index + 1}/${cities.length}), read ${cityResult.records_read}, created ${cityResult.records_created}, updated ${cityResult.records_updated}, deactivated ${cityResult.records_deactivated}.`,
        )
      }

      await this.syncCheckpointService.completeRun(syncRunId, result)

      this.logger.log(
        `Stop sync ${syncRunId} succeeded: read ${result.records_read}, created ${result.records_created}, updated ${result.records_updated}, deactivated ${result.records_deactivated}.`,
      )

      return result
    } catch (error) {
      if (currentCity) {
        try {
          await this.syncCheckpointService.failCity(
            syncRunId,
            currentCity,
            error,
          )
        } catch (checkpointError) {
          this.logCheckpointFailure(
            syncRunId,
            `mark ${currentCity} as failed`,
            checkpointError,
          )
        }
      }

      try {
        await this.syncCheckpointService.failRun(syncRunId, error, result)
      } catch (checkpointError) {
        this.logCheckpointFailure(
          syncRunId,
          'mark the sync run as failed',
          checkpointError,
        )
      }

      throw error
    }
  }

  async syncCityStops(
    city: CityNameType,
    syncRunId: string,
  ): Promise<SyncResult> {
    const heartbeatTimer = this.startCityHeartbeat(syncRunId, city)

    try {
      const stationGroups = await this.tdxClientService.fetchStationGroups(
        city,
        syncRunId,
      )
      const stations = await this.tdxClientService.fetchStations(
        city,
        syncRunId,
      )
      const stops = await this.tdxClientService.fetchStops(city, syncRunId)
      const stopOfRoutes = await this.tdxClientService.fetchStopOfRoutes(
        city,
        syncRunId,
      )

      const records = stopMapper({
        city,
        stationGroups,
        stations,
        stops,
        stopOfRoutes,
      })

      this.logger.log(
        `Stop sync ${syncRunId}: ${city} returned ${records.stops.length} stops, ${records.stations.length} stations, ${records.stationGroups.length} station groups, and ${records.routeStops.length} route stops from TDX.`,
      )

      return await this.stopPersistenceService.persistStops(records, {
        city,
        onProgress: async (persistedCount, totalCount) => {
          await this.syncCheckpointService.touch(syncRunId, city)
          this.logger.log(
            `Stop sync ${syncRunId}: persisted ${persistedCount}/${totalCount} stops for ${city}.`,
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
            `Stop sync ${syncRunId}: heartbeat failed for ${city}: ${message}`,
          )
        })
        .finally(() => {
          heartbeatPromise = null
        })
    }, CITY_SYNC_HEARTBEAT_INTERVAL_MS)
    timer.unref()

    return timer
  }

  private logCheckpointFailure(
    syncRunId: string,
    action: string,
    error: unknown,
  ): void {
    const message = error instanceof Error ? error.message : String(error)
    this.logger.error(`Stop sync ${syncRunId}: failed to ${action}: ${message}`)
  }
}
