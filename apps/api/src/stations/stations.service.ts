import { BadRequestException, Injectable } from '@nestjs/common'
import {
  API_BEARING_BY_PRISMA,
  DB_CITY_NAME_BY_PRISMA,
  DB_DIRECTION_BY_PRISMA,
} from '../constants/enum-mappings.js'
import type {
  BearingType as PrismaBearingType,
  CityNameType as PrismaCityNameType,
  DirectionType as PrismaDirectionType,
} from '../generated/prisma/enums.js'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  toLocalizedText,
  toRouteSummary,
  type RouteSummaryRecord,
} from '../routes/route-response.mapper.js'
import type {
  StationDto,
  StationRouteDirectionDto,
  StationsResponseDto,
} from './dto/stations-response.dto.js'

const DEFAULT_RADIUS_METERS = 500
const MIN_RADIUS_METERS = 500
const MAX_RADIUS_METERS = 3000
const EARTH_RADIUS_METERS = 6_371_000
const LATITUDE_DEGREES_PER_METER = 1 / 111_320

interface ListStationsOptions {
  latitude: number
  longitude: number
  radius_meters?: number
}

interface SubRouteRecord {
  direction: PrismaDirectionType
  route: RouteSummaryRecord
}

interface RouteStopRecord {
  subroute: SubRouteRecord
}

interface StopRecord {
  route_stops: RouteStopRecord[]
}

interface StationRecord {
  uuid: string
  city: PrismaCityNameType
  name_zh_tw: string
  name_en: string | null
  address_zh_tw: string | null
  address_en: string | null
  latitude: number
  longitude: number
  bearing: PrismaBearingType | null
  stops: StopRecord[]
}

interface NearbyStationRecord {
  station: StationRecord
  distanceMeters: number
}

@Injectable()
export class StationsService {
  constructor(private readonly prismaService: PrismaService) {}

  async listStations({
    latitude,
    longitude,
    radius_meters = DEFAULT_RADIUS_METERS,
  }: ListStationsOptions): Promise<StationsResponseDto> {
    this.assertValidSearch(latitude, longitude, radius_meters)

    const bounds = this.toBoundingBox(latitude, longitude, radius_meters)
    const stations = await this.prismaService.station.findMany({
      where: {
        is_active: true,
        latitude: { gte: bounds.minLatitude, lte: bounds.maxLatitude },
        longitude: { gte: bounds.minLongitude, lte: bounds.maxLongitude },
      },
      select: {
        uuid: true,
        city: true,
        name_zh_tw: true,
        name_en: true,
        address_zh_tw: true,
        address_en: true,
        latitude: true,
        longitude: true,
        bearing: true,
        stops: {
          where: { is_active: true },
          select: {
            route_stops: {
              where: {
                is_active: true,
                subroute: {
                  is_active: true,
                  route: { is_active: true },
                },
              },
              select: {
                subroute: {
                  select: {
                    direction: true,
                    route: {
                      select: {
                        uuid: true,
                        city: true,
                        name_zh_tw: true,
                        name_en: true,
                        departure_zh_tw: true,
                        departure_en: true,
                        destination_zh_tw: true,
                        destination_en: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    return {
      stations: stations
        .map((station) => ({
          station,
          distanceMeters: this.toDistanceMeters(latitude, longitude, station),
        }))
        .filter(({ distanceMeters }) => distanceMeters <= radius_meters)
        .sort((left, right) => {
          if (left.distanceMeters !== right.distanceMeters) {
            return left.distanceMeters - right.distanceMeters
          }

          return left.station.uuid.localeCompare(right.station.uuid)
        })
        .map((record) => this.toStation(record)),
    }
  }

  private assertValidSearch(
    latitude: number,
    longitude: number,
    radiusMeters: number,
  ): void {
    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new BadRequestException(
        'latitude must be between -90 and 90, and longitude must be between -180 and 180.',
      )
    }

    if (
      !Number.isInteger(radiusMeters) ||
      radiusMeters < MIN_RADIUS_METERS ||
      radiusMeters > MAX_RADIUS_METERS
    ) {
      throw new BadRequestException(
        `radius_meters must be an integer between ${MIN_RADIUS_METERS} and ${MAX_RADIUS_METERS}.`,
      )
    }
  }

  private toBoundingBox(
    latitude: number,
    longitude: number,
    radiusMeters: number,
  ) {
    const latitudeDelta = radiusMeters * LATITUDE_DEGREES_PER_METER
    const longitudeScale = Math.cos(this.toRadians(latitude))
    const longitudeDelta =
      Math.abs(longitudeScale) < Number.EPSILON
        ? 180
        : latitudeDelta / Math.abs(longitudeScale)

    return {
      minLatitude: Math.max(-90, latitude - latitudeDelta),
      maxLatitude: Math.min(90, latitude + latitudeDelta),
      minLongitude: Math.max(-180, longitude - longitudeDelta),
      maxLongitude: Math.min(180, longitude + longitudeDelta),
    }
  }

  private toDistanceMeters(
    latitude: number,
    longitude: number,
    station: Pick<StationRecord, 'latitude' | 'longitude'>,
  ): number {
    const latitudeDelta = this.toRadians(station.latitude - latitude)
    const longitudeDelta = this.toRadians(station.longitude - longitude)
    const queryLatitude = this.toRadians(latitude)
    const stationLatitude = this.toRadians(station.latitude)
    const haversine =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(queryLatitude) *
        Math.cos(stationLatitude) *
        Math.sin(longitudeDelta / 2) ** 2

    return (
      2 *
      EARTH_RADIUS_METERS *
      Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
    )
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180
  }

  private toStation({
    station,
    distanceMeters,
  }: NearbyStationRecord): StationDto {
    return {
      uuid: station.uuid,
      city: DB_CITY_NAME_BY_PRISMA[station.city],
      name: toLocalizedText(station.name_zh_tw, station.name_en),
      address: this.toOptionalLocalizedText(
        station.address_zh_tw,
        station.address_en,
      ),
      bearing: station.bearing ? API_BEARING_BY_PRISMA[station.bearing] : null,
      position: {
        latitude: station.latitude,
        longitude: station.longitude,
      },
      distance_meters: Math.ceil(distanceMeters),
      route_directions: this.toRouteDirections(station),
    }
  }

  private toRouteDirections(
    station: StationRecord,
  ): StationRouteDirectionDto[] {
    const routesByDirection = new Map<
      PrismaDirectionType,
      Map<string, RouteSummaryRecord>
    >()

    for (const stop of station.stops) {
      for (const routeStop of stop.route_stops) {
        const direction = routeStop.subroute.direction
        const routes =
          routesByDirection.get(direction) ??
          new Map<string, RouteSummaryRecord>()

        routes.set(routeStop.subroute.route.uuid, routeStop.subroute.route)
        routesByDirection.set(direction, routes)
      }
    }

    return [...routesByDirection.entries()]
      .sort(
        ([left], [right]) =>
          DB_DIRECTION_BY_PRISMA[left] - DB_DIRECTION_BY_PRISMA[right],
      )
      .map(([direction, routes]) => ({
        direction: DB_DIRECTION_BY_PRISMA[direction],
        routes: [...routes.values()]
          .sort((left, right) => left.uuid.localeCompare(right.uuid))
          .map((route) => toRouteSummary(route)),
      }))
  }

  private toOptionalLocalizedText(zhTw: string | null, en: string | null) {
    if (!zhTw && !en) return null

    return toLocalizedText(zhTw ?? '', en)
  }
}
