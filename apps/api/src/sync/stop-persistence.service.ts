import { Injectable } from '@nestjs/common'
import type { CityNameType } from '@bus/shared'
import { PrismaService } from '../prisma/prisma.service.js'
import { RouteShapeSource as PrismaRouteShapeSource } from '../generated/prisma/enums.js'
import type { StopSyncRecords } from './mappers/stop.mapper.js'
import type { SyncResult } from './sync-result.js'

interface PersistStopsOptions {
  city: CityNameType
  onProgress?: (persistedCount: number, totalCount: number) => Promise<void>
}

const STOP_PROGRESS_INTERVAL = 100
const STOP_PERSISTENCE_CONCURRENCY = 5

interface AddressRecord {
  address_zh_tw: string | null
  address_en: string | null
}

@Injectable()
export class StopPersistenceService {
  constructor(private readonly prismaService: PrismaService) {}

  async persistStops(
    records: StopSyncRecords,
    { city, onProgress }: PersistStopsOptions,
  ): Promise<SyncResult> {
    if (records.stops.length === 0) {
      throw new Error(`TDX returned 0 stops for ${city}.`)
    }

    const prismaCity = records.stops[0].city
    await this.persistStationGroups(records.stationGroups, prismaCity)
    await this.persistStations(records.stations, prismaCity)
    const stopResult = await this.persistStopRecords(records.stops, {
      onProgress,
    })
    await this.persistRouteStops(records.routeStops, prismaCity)
    await this.persistRouteShapes(records.routeShapes)

    return stopResult
  }

  private async persistStationGroups(
    stationGroups: StopSyncRecords['stationGroups'],
    city: StopSyncRecords['stationGroups'][number]['city'],
  ): Promise<void> {
    const incomingUuids = stationGroups.map((record) => record.uuid)

    for (const record of stationGroups) {
      await this.prismaService.stationGroup.upsert({
        where: { uuid: record.uuid },
        create: {
          ...record,
          is_active: true,
          inactive_at: null,
        },
        update: {
          ...record,
          is_active: true,
          inactive_at: null,
        },
      })
    }

    const inactiveAt = new Date()
    await this.prismaService.stationGroup.updateMany({
      where: {
        city,
        uuid: { notIn: incomingUuids },
        is_active: true,
      },
      data: {
        is_active: false,
        inactive_at: inactiveAt,
      },
    })
  }

  private async persistStations(
    stations: StopSyncRecords['stations'],
    city: StopSyncRecords['stations'][number]['city'],
  ): Promise<void> {
    const stationGroupIds = await this.loadStationGroupIds(city)
    const incomingUuids = stations.map((record) => record.uuid)
    const existingAddresses = await this.loadStationAddresses(city)

    for (const record of stations) {
      const stationGroupId = record.station_group_uuid
        ? (stationGroupIds.get(record.station_group_uuid) ?? null)
        : null
      const address = this.resolveAddress(
        existingAddresses.get(record.uuid),
        record.address_zh_tw,
      )

      await this.prismaService.station.upsert({
        where: { uuid: record.uuid },
        create: {
          uuid: record.uuid,
          tdx_station_id: record.tdx_station_id,
          station_group_id: stationGroupId,
          city: record.city,
          name_zh_tw: record.name_zh_tw,
          name_en: record.name_en,
          name_ja: record.name_ja,
          name_ko: record.name_ko,
          address_zh_tw: address.address_zh_tw,
          address_en: address.address_en,
          latitude: record.latitude,
          longitude: record.longitude,
          bearing: record.bearing,
          tdx_updated_at: record.tdx_updated_at,
          is_active: true,
          inactive_at: null,
        },
        update: {
          tdx_station_id: record.tdx_station_id,
          station_group_id: stationGroupId,
          city: record.city,
          name_zh_tw: record.name_zh_tw,
          name_en: record.name_en,
          name_ja: record.name_ja,
          name_ko: record.name_ko,
          address_zh_tw: address.address_zh_tw,
          address_en: address.address_en,
          latitude: record.latitude,
          longitude: record.longitude,
          bearing: record.bearing,
          tdx_updated_at: record.tdx_updated_at,
          is_active: true,
          inactive_at: null,
        },
      })
    }

    const inactiveAt = new Date()
    await this.prismaService.station.updateMany({
      where: {
        city,
        uuid: { notIn: incomingUuids },
        is_active: true,
      },
      data: {
        is_active: false,
        inactive_at: inactiveAt,
      },
    })
  }

  private async persistStopRecords(
    stops: StopSyncRecords['stops'],
    {
      onProgress,
    }: {
      onProgress?: (persistedCount: number, totalCount: number) => Promise<void>
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
    let nextProgressCount = STOP_PROGRESS_INTERVAL

    for (
      let batchStart = 0;
      batchStart < stops.length;
      batchStart += STOP_PERSISTENCE_CONCURRENCY
    ) {
      const batch = stops.slice(
        batchStart,
        batchStart + STOP_PERSISTENCE_CONCURRENCY,
      )

      await Promise.all(
        batch.map((record) =>
          this.persistStopRecord(record, stationIds, existingAddresses),
        ),
      )

      const persistedCount = Math.min(batchStart + batch.length, stops.length)

      if (
        onProgress &&
        (persistedCount >= nextProgressCount || persistedCount === stops.length)
      ) {
        await onProgress(persistedCount, stops.length)

        while (nextProgressCount <= persistedCount) {
          nextProgressCount += STOP_PROGRESS_INTERVAL
        }
      }
    }

    const inactiveAt = new Date()
    const deactivatedStops = await this.prismaService.stop.updateMany({
      where: {
        city,
        uuid: { notIn: incomingStopUuids },
        is_active: true,
      },
      data: {
        is_active: false,
        inactive_at: inactiveAt,
      },
    })

    return {
      records_read: stops.length,
      records_created: recordsCreated,
      records_updated: recordsUpdated,
      records_deactivated: deactivatedStops.count,
    }
  }

  private async persistStopRecord(
    record: StopSyncRecords['stops'][number],
    stationIds: Map<string, string>,
    existingAddresses: Map<string, AddressRecord>,
  ): Promise<void> {
    const stationId = record.station_tdx_id
      ? (stationIds.get(record.station_tdx_id) ?? null)
      : null
    const address = this.resolveAddress(
      existingAddresses.get(record.uuid),
      record.address_zh_tw,
    )

    await this.prismaService.stop.upsert({
      where: { uuid: record.uuid },
      create: {
        uuid: record.uuid,
        tdx_stop_id: record.tdx_stop_id,
        station_id: stationId,
        city: record.city,
        name_zh_tw: record.name_zh_tw,
        name_en: record.name_en,
        name_ja: record.name_ja,
        name_ko: record.name_ko,
        address_zh_tw: address.address_zh_tw,
        address_en: address.address_en,
        latitude: record.latitude,
        longitude: record.longitude,
        bearing: record.bearing,
        tdx_updated_at: record.tdx_updated_at,
        is_active: true,
        inactive_at: null,
      },
      update: {
        tdx_stop_id: record.tdx_stop_id,
        station_id: stationId,
        city: record.city,
        name_zh_tw: record.name_zh_tw,
        name_en: record.name_en,
        name_ja: record.name_ja,
        name_ko: record.name_ko,
        address_zh_tw: address.address_zh_tw,
        address_en: address.address_en,
        latitude: record.latitude,
        longitude: record.longitude,
        bearing: record.bearing,
        tdx_updated_at: record.tdx_updated_at,
        is_active: true,
        inactive_at: null,
      },
    })
  }

  private async persistRouteStops(
    routeStops: StopSyncRecords['routeStops'],
    city: StopSyncRecords['stops'][number]['city'],
  ): Promise<void> {
    if (routeStops.length === 0) return

    const subrouteIds = await this.loadSubRouteIds(routeStops)
    const stopIds = await this.loadStopIdsByUuid(city)
    const incomingKeys = new Set<string>()

    for (const record of routeStops) {
      const subrouteId = subrouteIds.get(record.subroute_uuid)
      const stopId = stopIds.get(record.stop_uuid)

      if (!subrouteId || !stopId) continue

      incomingKeys.add(`${subrouteId}:${record.sequence}`)

      await this.prismaService.routeStop.upsert({
        where: {
          subroute_id_sequence: {
            subroute_id: subrouteId,
            sequence: record.sequence,
          },
        },
        create: {
          subroute_id: subrouteId,
          stop_id: stopId,
          sequence: record.sequence,
          tdx_updated_at: record.tdx_updated_at,
          is_active: true,
          inactive_at: null,
        },
        update: {
          stop_id: stopId,
          tdx_updated_at: record.tdx_updated_at,
          is_active: true,
          inactive_at: null,
        },
      })
    }

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

    for (const routeStop of existingRouteStops) {
      const key = `${routeStop.subroute_id}:${routeStop.sequence}`

      if (incomingKeys.has(key)) continue

      await this.prismaService.routeStop.updateMany({
        where: {
          subroute_id: routeStop.subroute_id,
          sequence: routeStop.sequence,
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
  ): Promise<void> {
    if (routeShapes.length === 0) return

    const subrouteIds = await this.loadSubRouteIds(routeShapes)

    for (const record of routeShapes) {
      const subrouteId = subrouteIds.get(record.subroute_uuid)

      if (!subrouteId) continue

      const existingShape = await this.prismaService.routeShape.findUnique({
        where: { subroute_id: subrouteId },
        select: { source: true },
      })

      if (
        existingShape &&
        existingShape.source !== PrismaRouteShapeSource.STOP_POSITIONS
      ) {
        continue
      }

      await this.prismaService.routeShape.upsert({
        where: { subroute_id: subrouteId },
        create: {
          subroute_id: subrouteId,
          source: record.source,
          path: record.path,
          encoded_polyline: null,
          geometry: null,
          tdx_updated_at: record.tdx_updated_at,
          is_active: true,
          inactive_at: null,
        },
        update: {
          source: record.source,
          path: record.path,
          encoded_polyline: null,
          geometry: null,
          tdx_updated_at: record.tdx_updated_at,
          is_active: true,
          inactive_at: null,
        },
      })
    }
  }

  private resolveAddress(
    existing: AddressRecord | undefined,
    incomingAddressZhTw: string | null,
  ): AddressRecord {
    if (
      existing &&
      existing.address_zh_tw === incomingAddressZhTw &&
      existing.address_en
    ) {
      return {
        address_zh_tw: incomingAddressZhTw,
        address_en: existing.address_en,
      }
    }

    return {
      address_zh_tw: incomingAddressZhTw,
      address_en: null,
    }
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
