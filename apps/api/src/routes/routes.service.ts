import { Injectable } from '@nestjs/common'
import { AreaType, CITIES_BY_AREA, CityNameType } from '@bus/shared'
import {
  DB_CITY_NAME_BY_PRISMA,
  PRISMA_CITY_BY_TDX_CITY,
} from '../constants/enum-mappings.js'
import { PrismaService } from '../prisma/prisma.service.js'
import type { LocalizedTextDto } from '../dto/shared.dto.js'
import type { CityNameType as PrismaCityNameType } from '../generated/prisma/enums.js'
import {
  RouteDetailResponseDto,
  RouteSummaryDto,
  RoutesResponseDto,
} from './dto/routes-response.dto.js'

interface RouteSummaryRecord {
  uuid: string
  city: PrismaCityNameType
  name_zh_tw: string
  name_en: string | null
  departure_zh_tw: string
  departure_en: string | null
  destination_zh_tw: string
  destination_en: string | null
}

@Injectable()
export class RoutesService {
  constructor(private readonly prismaService: PrismaService) {}

  private toRouteSummary(route: RouteSummaryRecord): RouteSummaryDto {
    return {
      uuid: route.uuid,
      city: DB_CITY_NAME_BY_PRISMA[route.city],
      name: this.toLocalizedText(route.name_zh_tw, route.name_en),
      departure: this.toLocalizedText(
        route.departure_zh_tw,
        route.departure_en,
      ),
      destination: this.toLocalizedText(
        route.destination_zh_tw,
        route.destination_en,
      ),
    }
  }

  private toLocalizedText(zhTw: string, en: string | null): LocalizedTextDto {
    return {
      'zh-TW': zhTw,
      en: en ?? '',
    }
  }

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
      routes: routes.map((route) => this.toRouteSummary(route)),
    }
  }

  getRoute(uuid: string): RouteDetailResponseDto {
    return {
      uuid,
      city: null,
      name: { 'zh-TW': '', en: '' },
      departure: { 'zh-TW': '', en: '' },
      destination: { 'zh-TW': '', en: '' },
      sub_routes: [],
    }
  }
}
