import { Injectable } from '@nestjs/common'
import type { CityNameType } from '@bus/shared'
import { PrismaService } from '../prisma/prisma.service.js'
import type { StopSyncRecords } from './mappers/stop.mapper.js'
import {
  StopBulkWriterService,
  type AddressRecord,
} from './stop-bulk-writer.service.js'
import { createProgressCounter } from './sync-progress.js'
import type { SyncResult } from './sync-result.js'

const DEACTIVATE_UUID_BATCH_SIZE = 500

export type StopSyncStage =
  | 'station_groups'
  | 'stations'
  | 'stops'
  | 'route_stops'
  | 'route_shapes'

interface PersistStopsOptions {
  city: CityNameType
  syncStations?: boolean
  onStageStart?: (stage: StopSyncStage, totalCount: number) => void
  onProgress?: (
    stage: StopSyncStage,
    persistedCount: number,
    totalCount: number,
  ) => Promise<void>
}

@Injectable()
export class StopPersistenceService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly stopBulkWriterService: StopBulkWriterService,
  ) {}

  async persistStops(
    records: StopSyncRecords,
    {
      city,
      syncStations = true,
      onStageStart,
      onProgress,
    }: PersistStopsOptions,
  ): Promise<SyncResult> {
    if (records.stops.length === 0) {
      throw new Error(`TDX returned 0 stops for ${city}.`)
    }

    const prismaCity = records.stops[0].city
    await this.persistStationGroups(records.stationGroups, prismaCity, {
      onStageStart,
      onProgress,
    })
    if (syncStations) {
      await this.persistStations(records.stations, prismaCity, {
        onStageStart,
        onProgress,
      })
    }
    const stopResult = await this.persistStopRecords(records.stops, {
      onStageStart,
      onProgress,
    })
    await this.persistRouteStops(records.routeStops, prismaCity, {
      onStageStart,
      onProgress,
    })
    await this.persistRouteShapes(records.routeShapes, {
      onStageStart,
      onProgress,
    })

    return stopResult
  }

  private async persistStationGroups(
    stationGroups: StopSyncRecords['stationGroups'],
    city: StopSyncRecords['stationGroups'][number]['city'],
    options: Pick<PersistStopsOptions, 'onStageStart' | 'onProgress'>,
  ): Promise<void> {
    const incomingUuids = stationGroups.map((record) => record.uuid)
    const progress = createProgressCounter(stationGroups.length)
    let persistedCount = 0

    options.onStageStart?.('station_groups', stationGroups.length)

    await this.stopBulkWriterService.upsertStationGroups(
      stationGroups,
      async (batchCount) => {
        persistedCount += batchCount
        await this.reportProgress(
          options,
          'station_groups',
          progress,
          persistedCount,
          stationGroups.length,
        )
      },
    )

    if (stationGroups.length === 0) return

    await this.deactivateMissingStationGroups(city, incomingUuids)
  }

  private async persistStations(
    stations: StopSyncRecords['stations'],
    city: StopSyncRecords['stations'][number]['city'],
    options: Pick<PersistStopsOptions, 'onStageStart' | 'onProgress'>,
  ): Promise<void> {
    if (stations.length === 0) {
      throw new Error(`TDX returned 0 stations for ${city}.`)
    }

    const stationGroupIds = await this.loadStationGroupIds(city)
    const incomingUuids = stations.map((record) => record.uuid)
    const existingAddresses = await this.loadStationAddresses(city)
    const progress = createProgressCounter(stations.length)
    let persistedCount = 0

    options.onStageStart?.('stations', stations.length)

    await this.stopBulkWriterService.upsertStations(
      stations,
      stationGroupIds,
      existingAddresses,
      async (batchCount) => {
        persistedCount += batchCount
        await this.reportProgress(
          options,
          'stations',
          progress,
          persistedCount,
          stations.length,
        )
      },
    )

    await this.deactivateMissingStations(city, incomingUuids)
  }

  private async persistStopRecords(
    stops: StopSyncRecords['stops'],
    {
      onStageStart,
      onProgress,
    }: {
      onStageStart?: (stage: StopSyncStage, totalCount: number) => void
      onProgress?: (
        stage: StopSyncStage,
        persistedCount: number,
        totalCount: number,
      ) => Promise<void>
    },
  ): Promise<SyncResult> {
    const city = stops[0].city
    const stationIds = await this.loadStationIds(city)
    const existingStops = await this.prismaService.stop.findMany({
      where: { city },
      select: { uuid: true },
    })
    const existingStopUuids = new Set(existingStops.map((stop) => stop.uuid))
    const incomingStopUuids = stops.map((stop) => stop.uuid)
    const recordsCreated = stops.filter(
      (stop) => !existingStopUuids.has(stop.uuid),
    ).length
    const recordsUpdated = stops.length - recordsCreated
    const existingAddresses = await this.loadStopAddresses(city)
    const progress = createProgressCounter(stops.length)

    onStageStart?.('stops', stops.length)

    let persistedCount = 0

    await this.stopBulkWriterService.upsertStops(
      stops,
      stationIds,
      existingAddresses,
      async (batchCount) => {
        persistedCount += batchCount
        await this.reportProgress(
          { onProgress },
          'stops',
          progress,
          persistedCount,
          stops.length,
        )
      },
    )

    const deactivatedStopCount = await this.deactivateMissingStops(
      city,
      incomingStopUuids,
    )

    return {
      records_read: stops.length,
      records_created: recordsCreated,
      records_updated: recordsUpdated,
      records_deactivated: deactivatedStopCount,
    }
  }

  private async persistRouteStops(
    routeStops: StopSyncRecords['routeStops'],
    city: StopSyncRecords['stops'][number]['city'],
    options: Pick<PersistStopsOptions, 'onStageStart' | 'onProgress'>,
  ): Promise<void> {
    options.onStageStart?.('route_stops', routeStops.length)

    if (routeStops.length === 0) return

    const subrouteIds = await this.loadSubRouteIds(routeStops)
    const stopIds = await this.loadStopIdsByUuid(city)
    const incomingKeys = new Set<string>()
    const progress = createProgressCounter(routeStops.length)
    let persistedCount = 0

    await this.stopBulkWriterService.upsertRouteStops(
      routeStops,
      subrouteIds,
      stopIds,
      incomingKeys,
      async (batchCount) => {
        persistedCount += batchCount
        await this.reportProgress(
          options,
          'route_stops',
          progress,
          persistedCount,
          routeStops.length,
        )
      },
    )

    const subrouteUuidList = [
      ...new Set(routeStops.map((record) => record.subroute_uuid)),
    ]
    const subrouteDbIds = subrouteUuidList.flatMap((uuid) => {
      const id = subrouteIds.get(uuid)

      return id ? [id] : []
    })

    if (subrouteDbIds.length === 0) return

    const existingRouteStops = await this.prismaService.routeStop.findMany({
      where: {
        subroute_id: { in: subrouteDbIds },
        is_active: true,
      },
      select: {
        subroute_id: true,
        sequence: true,
      },
    })
    const inactiveAt = new Date()
    const sequencesToDeactivate = new Map<string, number[]>()

    for (const routeStop of existingRouteStops) {
      const key = `${routeStop.subroute_id}:${routeStop.sequence}`

      if (incomingKeys.has(key)) continue

      const sequences = sequencesToDeactivate.get(routeStop.subroute_id) ?? []
      sequences.push(routeStop.sequence)
      sequencesToDeactivate.set(routeStop.subroute_id, sequences)
    }

    for (const [subrouteId, sequences] of sequencesToDeactivate) {
      await this.prismaService.routeStop.updateMany({
        where: {
          subroute_id: subrouteId,
          sequence: { in: sequences },
          is_active: true,
        },
        data: {
          is_active: false,
          inactive_at: inactiveAt,
        },
      })
    }
  }

  private async persistRouteShapes(
    routeShapes: StopSyncRecords['routeShapes'],
    options: Pick<PersistStopsOptions, 'onStageStart' | 'onProgress'>,
  ): Promise<void> {
    options.onStageStart?.('route_shapes', routeShapes.length)

    if (routeShapes.length === 0) return

    const subrouteIds = await this.loadSubRouteIds(routeShapes)
    const progress = createProgressCounter(routeShapes.length)
    let persistedCount = 0

    await this.stopBulkWriterService.upsertRouteShapes(
      routeShapes,
      subrouteIds,
      async (batchCount) => {
        persistedCount += batchCount
        await this.reportProgress(
          options,
          'route_shapes',
          progress,
          persistedCount,
          routeShapes.length,
        )
      },
    )
  }

  private async reportProgress(
    options: Pick<PersistStopsOptions, 'onProgress'>,
    stage: StopSyncStage,
    progress: ReturnType<typeof createProgressCounter>,
    persistedCount: number,
    totalCount: number,
  ): Promise<void> {
    if (!options.onProgress || !progress.shouldReport(persistedCount)) return

    await options.onProgress(stage, persistedCount, totalCount)
  }

  private async deactivateMissingStationGroups(
    city: StopSyncRecords['stationGroups'][number]['city'],
    incomingUuids: string[],
  ): Promise<void> {
    const activeStationGroups = await this.prismaService.stationGroup.findMany({
      where: { city, is_active: true },
      select: { uuid: true },
    })
    const missingUuids = this.getMissingUuids(
      activeStationGroups.map((group) => group.uuid),
      incomingUuids,
    )
    const inactiveAt = new Date()

    for (const uuidBatch of this.chunk(missingUuids)) {
      await this.prismaService.stationGroup.updateMany({
        where: {
          city,
          uuid: { in: uuidBatch },
          is_active: true,
        },
        data: {
          is_active: false,
          inactive_at: inactiveAt,
        },
      })
    }
  }

  private async deactivateMissingStations(
    city: StopSyncRecords['stations'][number]['city'],
    incomingUuids: string[],
  ): Promise<void> {
    const activeStations = await this.prismaService.station.findMany({
      where: { city, is_active: true },
      select: { uuid: true },
    })
    const missingUuids = this.getMissingUuids(
      activeStations.map((station) => station.uuid),
      incomingUuids,
    )
    const inactiveAt = new Date()

    for (const uuidBatch of this.chunk(missingUuids)) {
      await this.prismaService.station.updateMany({
        where: {
          city,
          uuid: { in: uuidBatch },
          is_active: true,
        },
        data: {
          is_active: false,
          inactive_at: inactiveAt,
        },
      })
    }
  }

  private async deactivateMissingStops(
    city: StopSyncRecords['stops'][number]['city'],
    incomingUuids: string[],
  ): Promise<number> {
    const activeStops = await this.prismaService.stop.findMany({
      where: { city, is_active: true },
      select: { uuid: true },
    })
    const missingUuids = this.getMissingUuids(
      activeStops.map((stop) => stop.uuid),
      incomingUuids,
    )
    const inactiveAt = new Date()
    let deactivatedCount = 0

    for (const uuidBatch of this.chunk(missingUuids)) {
      const deactivatedStops = await this.prismaService.stop.updateMany({
        where: {
          city,
          uuid: { in: uuidBatch },
          is_active: true,
        },
        data: {
          is_active: false,
          inactive_at: inactiveAt,
        },
      })

      deactivatedCount += deactivatedStops.count
    }

    return deactivatedCount
  }

  private getMissingUuids(
    existingUuids: string[],
    incomingUuids: string[],
  ): string[] {
    const incomingUuidSet = new Set(incomingUuids)

    return existingUuids.filter((uuid) => !incomingUuidSet.has(uuid))
  }

  private chunk<T>(records: T[]): T[][] {
    const chunks: T[][] = []
    let index = 0

    while (index < records.length) {
      chunks.push(records.slice(index, index + DEACTIVATE_UUID_BATCH_SIZE))
      index += DEACTIVATE_UUID_BATCH_SIZE
    }

    return chunks
  }

  private async loadStationGroupIds(
    city: StopSyncRecords['stationGroups'][number]['city'],
  ): Promise<Map<string, string>> {
    const stationGroups = await this.prismaService.stationGroup.findMany({
      where: { city },
      select: { id: true, uuid: true },
    })

    return new Map(stationGroups.map((group) => [group.uuid, group.id]))
  }

  private async loadStationIds(
    city: StopSyncRecords['stations'][number]['city'],
  ): Promise<Map<string, string>> {
    const stations = await this.prismaService.station.findMany({
      where: { city },
      select: { id: true, tdx_station_id: true },
    })

    return new Map(
      stations.map((station) => [station.tdx_station_id, station.id]),
    )
  }

  private async loadStopIdsByUuid(
    city: StopSyncRecords['stops'][number]['city'],
  ): Promise<Map<string, string>> {
    const stops = await this.prismaService.stop.findMany({
      where: { city },
      select: { id: true, uuid: true },
    })

    return new Map(stops.map((stop) => [stop.uuid, stop.id]))
  }

  private async loadSubRouteIds(
    records: Array<{ subroute_uuid: string }>,
  ): Promise<Map<string, string>> {
    const subrouteUuids = [
      ...new Set(records.map((record) => record.subroute_uuid)),
    ]
    const subroutes = await this.prismaService.subRoute.findMany({
      where: { uuid: { in: subrouteUuids } },
      select: { id: true, uuid: true },
    })

    return new Map(subroutes.map((subroute) => [subroute.uuid, subroute.id]))
  }

  private async loadStationAddresses(
    city: StopSyncRecords['stations'][number]['city'],
  ): Promise<Map<string, AddressRecord>> {
    const stations = await this.prismaService.station.findMany({
      where: { city },
      select: {
        uuid: true,
        address_zh_tw: true,
        address_en: true,
      },
    })

    return new Map(
      stations.map((station) => [
        station.uuid,
        {
          address_zh_tw: station.address_zh_tw,
          address_en: station.address_en,
        },
      ]),
    )
  }

  private async loadStopAddresses(
    city: StopSyncRecords['stops'][number]['city'],
  ): Promise<Map<string, AddressRecord>> {
    const stops = await this.prismaService.stop.findMany({
      where: { city },
      select: {
        uuid: true,
        address_zh_tw: true,
        address_en: true,
      },
    })

    return new Map(
      stops.map((stop) => [
        stop.uuid,
        {
          address_zh_tw: stop.address_zh_tw,
          address_en: stop.address_en,
        },
      ]),
    )
  }
}
