import { HttpStatus, Injectable } from '@nestjs/common'
import {
  CITIES_BY_AREA,
  ErrorCode,
  type AreaType,
  type CityNameType,
} from '@bus/shared'
import {
  DB_DIRECTION_BY_PRISMA,
  PRISMA_CITY_BY_TDX_CITY,
} from '../constants/enum-mappings.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { FTBError } from '../dto/ftb-error.js'
import type { DirectionType as PrismaDirectionType } from '../generated/prisma/enums.js'
import {
  toLocalizedText,
  toRouteSummary,
  type RouteSummaryRecord,
} from './route-response.mapper.js'
import type {
  PositionTuple,
  RouteDetailResponseDto,
  RouteShapeDto,
  RouteStopDto,
  RouteSubRouteDto,
  RoutesResponseDto,
} from './dto/routes-response.dto.js'

interface StopRecord {
  uuid: string
  name_zh_tw: string
  name_en: string | null
  latitude: number
  longitude: number
  tdx_updated_at: Date | null
  updated_at: Date
}

interface RouteStopRecord {
  sequence: number
  stop: StopRecord
}

interface RouteShapeRecord {
  path: unknown
  is_active: boolean
  tdx_updated_at: Date | null
  updated_at: Date
}

interface SubRouteRecord {
  uuid: string
  direction: PrismaDirectionType
  name_zh_tw: string
  name_en: string | null
  departure_zh_tw: string
  departure_en: string | null
  destination_zh_tw: string
  destination_en: string | null
  first_bus_time: string | null
  last_bus_time: string | null
  tdx_updated_at: Date | null
  updated_at: Date
  route_shape: RouteShapeRecord | null
  route_stops: RouteStopRecord[]
}

interface RouteDetailRecord extends RouteSummaryRecord {
  subroutes: SubRouteRecord[]
}

@Injectable()
export class RoutesService {
  constructor(private readonly prismaService: PrismaService) {}

  async listRoutes(area: AreaType): Promise<RoutesResponseDto> {
    const areaCities: CityNameType[] = CITIES_BY_AREA[area]
    const cities = areaCities.map((city) => PRISMA_CITY_BY_TDX_CITY[city])
    const routes = await this.prismaService.route.findMany({
      where: {
        city: { in: cities },
        is_active: true,
      },
      orderBy: [{ city: 'asc' }, { name_zh_tw: 'asc' }, { uuid: 'asc' }],
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
    })

    return {
      routes: routes.map((route) => toRouteSummary(route)),
    }
  }

  async getRoute(uuid: string): Promise<RouteDetailResponseDto> {
    const route = await this.prismaService.route.findFirst({
      where: { uuid, is_active: true },
      select: {
        uuid: true,
        city: true,
        name_zh_tw: true,
        name_en: true,
        departure_zh_tw: true,
        departure_en: true,
        destination_zh_tw: true,
        destination_en: true,
        subroutes: {
          where: { is_active: true },
          orderBy: [{ direction: 'asc' }, { uuid: 'asc' }],
          select: {
            uuid: true,
            direction: true,
            name_zh_tw: true,
            name_en: true,
            departure_zh_tw: true,
            departure_en: true,
            destination_zh_tw: true,
            destination_en: true,
            first_bus_time: true,
            last_bus_time: true,
            tdx_updated_at: true,
            updated_at: true,
            route_shape: {
              select: {
                path: true,
                is_active: true,
                tdx_updated_at: true,
                updated_at: true,
              },
            },
            route_stops: {
              where: { is_active: true, stop: { is_active: true } },
              orderBy: { sequence: 'asc' },
              select: {
                sequence: true,
                stop: {
                  select: {
                    uuid: true,
                    name_zh_tw: true,
                    name_en: true,
                    latitude: true,
                    longitude: true,
                    tdx_updated_at: true,
                    updated_at: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!route) {
      throw new FTBError(ErrorCode.ROUTE_NOT_FOUND, HttpStatus.NOT_FOUND)
    }

    return this.toRouteDetail(route)
  }

  private toRouteDetail(route: RouteDetailRecord): RouteDetailResponseDto {
    return {
      ...toRouteSummary(route),
      sub_routes: route.subroutes.map((subroute) =>
        this.toRouteSubRoute(subroute),
      ),
    }
  }

  private toRouteSubRoute(subroute: SubRouteRecord): RouteSubRouteDto {
    const stops = subroute.route_stops.map((routeStop) =>
      this.toRouteStop(routeStop),
    )

    return {
      uuid: subroute.uuid,
      name: toLocalizedText(subroute.name_zh_tw, subroute.name_en),
      direction: DB_DIRECTION_BY_PRISMA[subroute.direction],
      departure: toLocalizedText(
        subroute.departure_zh_tw,
        subroute.departure_en,
      ),
      destination: toLocalizedText(
        subroute.destination_zh_tw,
        subroute.destination_en,
      ),
      first_bus_time: subroute.first_bus_time,
      last_bus_time: subroute.last_bus_time,
      stops,
      shape: this.toRouteShape(subroute, stops),
    }
  }

  private toRouteStop(routeStop: RouteStopRecord): RouteStopDto {
    return {
      uuid: routeStop.stop.uuid,
      sequence: routeStop.sequence,
      name: toLocalizedText(routeStop.stop.name_zh_tw, routeStop.stop.name_en),
      position: {
        latitude: routeStop.stop.latitude,
        longitude: routeStop.stop.longitude,
      },
    }
  }

  private toRouteShape(
    subroute: SubRouteRecord,
    stops: RouteStopDto[],
  ): RouteShapeDto {
    const routeShape = subroute.route_shape
    const fallbackPath = this.toStopPositionPath(stops)
    const fallbackUpdatedAt = this.toFallbackShapeUpdatedAt(subroute)

    if (!routeShape || !routeShape.is_active) {
      return {
        path: fallbackPath,
        updated_at: fallbackUpdatedAt,
      }
    }

    const decodedPath = this.toPositionPath(routeShape.path)
    const usesDecodedPath = decodedPath.length > 0

    return {
      path: usesDecodedPath ? decodedPath : fallbackPath,
      updated_at: usesDecodedPath
        ? (routeShape.tdx_updated_at ?? routeShape.updated_at).toISOString()
        : fallbackUpdatedAt,
    }
  }

  private toFallbackShapeUpdatedAt(subroute: SubRouteRecord): string {
    const timestamps = [
      subroute.tdx_updated_at ?? subroute.updated_at,
      ...subroute.route_stops.map(
        (routeStop) =>
          routeStop.stop.tdx_updated_at ?? routeStop.stop.updated_at,
      ),
    ]

    return new Date(
      Math.max(...timestamps.map((timestamp) => timestamp.getTime())),
    ).toISOString()
  }

  private toStopPositionPath(stops: RouteStopDto[]): PositionTuple[] {
    return stops.map((stop) => [
      stop.position.longitude,
      stop.position.latitude,
    ])
  }

  private toPositionPath(path: unknown): PositionTuple[] {
    if (!Array.isArray(path)) return []

    const positions: PositionTuple[] = []

    for (const point of path) {
      if (!Array.isArray(point) || point.length !== 2) return []

      const longitude: unknown = point[0]
      const latitude: unknown = point[1]

      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return []
      }

      positions.push([longitude, latitude])
    }

    return positions
  }
}
