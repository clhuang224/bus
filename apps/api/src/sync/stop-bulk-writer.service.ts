import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import {
  DB_BEARING_BY_PRISMA,
  DB_CITY_NAME_BY_PRISMA,
  DB_ROUTE_SHAPE_SOURCE_BY_PRISMA,
} from '../constants/enum-mappings.js'
import { Prisma } from '../generated/prisma/client.js'
import {
  BearingType as PrismaBearingType,
  CityNameType as PrismaCityNameType,
  RouteShapeSource as PrismaRouteShapeSource,
} from '../generated/prisma/enums.js'
import { PrismaService } from '../prisma/prisma.service.js'
import type { StopSyncRecords } from './mappers/stop.mapper.js'

const BULK_WRITE_BATCH_SIZE = 500

export interface AddressRecord {
  address_zh_tw: string | null
  address_en: string | null
}

@Injectable()
export class StopBulkWriterService {
  constructor(private readonly prismaService: PrismaService) {}

  async upsertStationGroups(
    stationGroups: StopSyncRecords['stationGroups'],
    onBatch: (count: number) => Promise<void>,
  ): Promise<void> {
    for (const batch of this.chunk(stationGroups)) {
      await this.prismaService.$executeRaw`
        INSERT INTO "station_group" (
          "id",
          "uuid",
          "tdx_station_group_id",
          "city",
          "name_zh_tw",
          "name_en",
          "name_ja",
          "name_ko",
          "latitude",
          "longitude",
          "tdx_updated_at",
          "is_active",
          "inactive_at",
          "updated_at"
        )
        VALUES ${Prisma.join(
          batch.map(
            (record) => Prisma.sql`(
              ${randomUUID()}::uuid,
              ${record.uuid},
              ${record.tdx_station_group_id},
              ${this.dbCity(record.city)}::"CityNameType",
              ${record.name_zh_tw},
              ${record.name_en},
              ${record.name_ja},
              ${record.name_ko},
              ${record.latitude},
              ${record.longitude},
              ${record.tdx_updated_at},
              true,
              NULL,
              now()
            )`,
          ),
        )}
        ON CONFLICT ("uuid") DO UPDATE SET
          "tdx_station_group_id" = EXCLUDED."tdx_station_group_id",
          "city" = EXCLUDED."city",
          "name_zh_tw" = EXCLUDED."name_zh_tw",
          "name_en" = EXCLUDED."name_en",
          "name_ja" = EXCLUDED."name_ja",
          "name_ko" = EXCLUDED."name_ko",
          "latitude" = EXCLUDED."latitude",
          "longitude" = EXCLUDED."longitude",
          "tdx_updated_at" = EXCLUDED."tdx_updated_at",
          "is_active" = true,
          "inactive_at" = NULL,
          "updated_at" = now()
      `

      await onBatch(batch.length)
    }
  }

  async upsertStations(
    stations: StopSyncRecords['stations'],
    stationGroupIds: Map<string, string>,
    existingAddresses: Map<string, AddressRecord>,
    onBatch: (count: number) => Promise<void>,
  ): Promise<void> {
    for (const batch of this.chunk(stations)) {
      await this.prismaService.$executeRaw`
        INSERT INTO "station" (
          "id",
          "uuid",
          "tdx_station_id",
          "station_group_id",
          "city",
          "name_zh_tw",
          "name_en",
          "name_ja",
          "name_ko",
          "address_zh_tw",
          "address_en",
          "latitude",
          "longitude",
          "bearing",
          "tdx_updated_at",
          "is_active",
          "inactive_at",
          "updated_at"
        )
        VALUES ${Prisma.join(
          batch.map((record) => {
            const stationGroupId = record.station_group_uuid
              ? (stationGroupIds.get(record.station_group_uuid) ?? null)
              : null
            const address = this.resolveAddress(
              existingAddresses.get(record.uuid),
              record.address_zh_tw,
            )

            return Prisma.sql`(
              ${randomUUID()}::uuid,
              ${record.uuid},
              ${record.tdx_station_id},
              ${stationGroupId}::uuid,
              ${this.dbCity(record.city)}::"CityNameType",
              ${record.name_zh_tw},
              ${record.name_en},
              ${record.name_ja},
              ${record.name_ko},
              ${address.address_zh_tw},
              ${address.address_en},
              ${record.latitude},
              ${record.longitude},
              ${this.dbBearing(record.bearing)}::"BearingType",
              ${record.tdx_updated_at},
              true,
              NULL,
              now()
            )`
          }),
        )}
        ON CONFLICT ("uuid") DO UPDATE SET
          "tdx_station_id" = EXCLUDED."tdx_station_id",
          "station_group_id" = EXCLUDED."station_group_id",
          "city" = EXCLUDED."city",
          "name_zh_tw" = EXCLUDED."name_zh_tw",
          "name_en" = EXCLUDED."name_en",
          "name_ja" = EXCLUDED."name_ja",
          "name_ko" = EXCLUDED."name_ko",
          "address_zh_tw" = EXCLUDED."address_zh_tw",
          "address_en" = EXCLUDED."address_en",
          "latitude" = EXCLUDED."latitude",
          "longitude" = EXCLUDED."longitude",
          "bearing" = EXCLUDED."bearing",
          "tdx_updated_at" = EXCLUDED."tdx_updated_at",
          "is_active" = true,
          "inactive_at" = NULL,
          "updated_at" = now()
      `

      await onBatch(batch.length)
    }
  }

  async upsertStops(
    stops: StopSyncRecords['stops'],
    stationIds: Map<string, string>,
    existingAddresses: Map<string, AddressRecord>,
    onBatch: (count: number) => Promise<void>,
  ): Promise<void> {
    for (const batch of this.chunk(stops)) {
      await this.prismaService.$executeRaw`
        INSERT INTO "stop" (
          "id",
          "uuid",
          "tdx_stop_id",
          "station_id",
          "city",
          "name_zh_tw",
          "name_en",
          "name_ja",
          "name_ko",
          "address_zh_tw",
          "address_en",
          "latitude",
          "longitude",
          "bearing",
          "tdx_updated_at",
          "is_active",
          "inactive_at",
          "updated_at"
        )
        VALUES ${Prisma.join(
          batch.map((record) => {
            const stationId = record.station_tdx_id
              ? (stationIds.get(record.station_tdx_id) ?? null)
              : null
            const address = this.resolveAddress(
              existingAddresses.get(record.uuid),
              record.address_zh_tw,
            )

            return Prisma.sql`(
              ${randomUUID()}::uuid,
              ${record.uuid},
              ${record.tdx_stop_id},
              ${stationId}::uuid,
              ${this.dbCity(record.city)}::"CityNameType",
              ${record.name_zh_tw},
              ${record.name_en},
              ${record.name_ja},
              ${record.name_ko},
              ${address.address_zh_tw},
              ${address.address_en},
              ${record.latitude},
              ${record.longitude},
              ${this.dbBearing(record.bearing)}::"BearingType",
              ${record.tdx_updated_at},
              true,
              NULL,
              now()
            )`
          }),
        )}
        ON CONFLICT ("uuid") DO UPDATE SET
          "tdx_stop_id" = EXCLUDED."tdx_stop_id",
          "station_id" = EXCLUDED."station_id",
          "city" = EXCLUDED."city",
          "name_zh_tw" = EXCLUDED."name_zh_tw",
          "name_en" = EXCLUDED."name_en",
          "name_ja" = EXCLUDED."name_ja",
          "name_ko" = EXCLUDED."name_ko",
          "address_zh_tw" = EXCLUDED."address_zh_tw",
          "address_en" = EXCLUDED."address_en",
          "latitude" = EXCLUDED."latitude",
          "longitude" = EXCLUDED."longitude",
          "bearing" = EXCLUDED."bearing",
          "tdx_updated_at" = EXCLUDED."tdx_updated_at",
          "is_active" = true,
          "inactive_at" = NULL,
          "updated_at" = now()
      `

      await onBatch(batch.length)
    }
  }

  async upsertRouteStops(
    routeStops: StopSyncRecords['routeStops'],
    subrouteIds: Map<string, string>,
    stopIds: Map<string, string>,
    incomingKeys: Set<string>,
    onBatch: (count: number) => Promise<void>,
  ): Promise<void> {
    for (const batch of this.chunk(routeStops)) {
      const values = batch.flatMap((record) => {
        const subrouteId = subrouteIds.get(record.subroute_uuid)
        const stopId = stopIds.get(record.stop_uuid)

        if (!subrouteId || !stopId) return []

        incomingKeys.add(`${subrouteId}:${record.sequence}`)

        return [
          {
            subrouteId,
            stopId,
            sequence: record.sequence,
            tdxUpdatedAt: record.tdx_updated_at,
          },
        ]
      })

      if (values.length > 0) {
        await this.prismaService.$executeRaw`
          INSERT INTO "route_stop" (
            "id",
            "subroute_id",
            "stop_id",
            "sequence",
            "tdx_updated_at",
            "is_active",
            "inactive_at",
            "updated_at"
          )
          VALUES ${Prisma.join(
            values.map(
              (value) => Prisma.sql`(
                ${randomUUID()}::uuid,
                ${value.subrouteId}::uuid,
                ${value.stopId}::uuid,
                ${value.sequence},
                ${value.tdxUpdatedAt},
                true,
                NULL,
                now()
              )`,
            ),
          )}
          ON CONFLICT ("subroute_id", "sequence") DO UPDATE SET
            "stop_id" = EXCLUDED."stop_id",
            "tdx_updated_at" = EXCLUDED."tdx_updated_at",
            "is_active" = true,
            "inactive_at" = NULL,
            "updated_at" = now()
        `
      }

      await onBatch(batch.length)
    }
  }

  async upsertRouteShapes(
    routeShapes: StopSyncRecords['routeShapes'],
    subrouteIds: Map<string, string>,
    onBatch: (count: number) => Promise<void>,
  ): Promise<void> {
    for (const batch of this.chunk(routeShapes)) {
      const values = batch.flatMap((record) => {
        const subrouteId = subrouteIds.get(record.subroute_uuid)

        if (!subrouteId) return []

        return [
          {
            subrouteId,
            source: record.source,
            path: record.path,
            tdxUpdatedAt: record.tdx_updated_at,
          },
        ]
      })

      if (values.length > 0) {
        await this.prismaService.$executeRaw`
          INSERT INTO "route_shape" (
            "id",
            "subroute_id",
            "source",
            "path",
            "encoded_polyline",
            "geometry",
            "tdx_updated_at",
            "is_active",
            "inactive_at",
            "updated_at"
          )
          VALUES ${Prisma.join(
            values.map(
              (value) => Prisma.sql`(
                ${randomUUID()}::uuid,
                ${value.subrouteId}::uuid,
                ${this.dbRouteShapeSource(value.source)}::"RouteShapeSource",
                ${JSON.stringify(value.path)}::jsonb,
                NULL,
                NULL,
                ${value.tdxUpdatedAt},
                true,
                NULL,
                now()
              )`,
            ),
          )}
          ON CONFLICT ("subroute_id") DO UPDATE SET
            "source" = EXCLUDED."source",
            "path" = EXCLUDED."path",
            "encoded_polyline" = NULL,
            "geometry" = NULL,
            "tdx_updated_at" = EXCLUDED."tdx_updated_at",
            "is_active" = true,
            "inactive_at" = NULL,
            "updated_at" = now()
          WHERE "route_shape"."source" = 'stop_positions'::"RouteShapeSource"
        `
      }

      await onBatch(batch.length)
    }
  }

  private chunk<T>(records: T[]): T[][] {
    const chunks: T[][] = []

    for (
      let index = 0;
      index < records.length;
      index += BULK_WRITE_BATCH_SIZE
    ) {
      chunks.push(records.slice(index, index + BULK_WRITE_BATCH_SIZE))
    }

    return chunks
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

  private dbCity(city: PrismaCityNameType): string {
    return DB_CITY_NAME_BY_PRISMA[city]
  }

  private dbBearing(bearing: PrismaBearingType | null): string | null {
    return bearing ? DB_BEARING_BY_PRISMA[bearing] : null
  }

  private dbRouteShapeSource(source: PrismaRouteShapeSource): string {
    return DB_ROUTE_SHAPE_SOURCE_BY_PRISMA[source]
  }
}
