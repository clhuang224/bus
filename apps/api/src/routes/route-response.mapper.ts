import { DB_CITY_NAME_BY_PRISMA } from '../constants/enum-mappings.js'
import type { LocalizedTextDto } from '../dto/shared.dto.js'
import type { CityNameType as PrismaCityNameType } from '../generated/prisma/enums.js'

export interface RouteSummaryRecord {
  uuid: string
  city: PrismaCityNameType
  name_zh_tw: string
  name_en: string | null
  departure_zh_tw: string
  departure_en: string | null
  destination_zh_tw: string
  destination_en: string | null
}

export function toRouteSummary(route: RouteSummaryRecord) {
  return {
    uuid: route.uuid,
    city: DB_CITY_NAME_BY_PRISMA[route.city],
    name: toLocalizedText(route.name_zh_tw, route.name_en),
    departure: toLocalizedText(route.departure_zh_tw, route.departure_en),
    destination: toLocalizedText(route.destination_zh_tw, route.destination_en),
  }
}

export function toLocalizedText(
  zhTw: string,
  en: string | null,
): LocalizedTextDto {
  return {
    'zh-TW': zhTw,
    en: en ?? '',
  }
}
