import { CityNameType, DirectionType } from '@bus/shared'
import type {
  TdxBusOperator,
  TdxBusRoute,
  TdxBusSubRoute,
  TdxLocalizedText,
} from '@bus/shared'
import {
  CityNameType as PrismaCityNameType,
  DirectionType as PrismaDirectionType,
} from '../../generated/prisma/enums.js'

interface RouteRecord {
  uuid: string
  tdx_route_id: string
  city: PrismaCityNameType
  name_zh_tw: string
  name_en: string | null
  name_ja: string | null
  name_ko: string | null
  departure_zh_tw: string
  departure_en: string | null
  departure_ja: string | null
  departure_ko: string | null
  destination_zh_tw: string
  destination_en: string | null
  destination_ja: string | null
  destination_ko: string | null
  tdx_updated_at: Date | null
}

interface SubRouteRecord {
  uuid: string
  tdx_subroute_id: string
  direction: PrismaDirectionType
  name_zh_tw: string
  name_en: string | null
  name_ja: string | null
  name_ko: string | null
  departure_zh_tw: string
  departure_en: string | null
  departure_ja: string | null
  departure_ko: string | null
  destination_zh_tw: string
  destination_en: string | null
  destination_ja: string | null
  destination_ko: string | null
  first_bus_time: string | null
  last_bus_time: string | null
  tdx_updated_at: Date | null
}

interface OperatorRecord {
  tdx_operator_id: string
  name_zh_tw: string
  name_en: string | null
}

export interface RouteSyncRecord {
  route: RouteRecord
  subroutes: SubRouteRecord[]
  operators: OperatorRecord[]
}

const prismaCityByTdxCity: Record<CityNameType, PrismaCityNameType> = {
  [CityNameType.TAIPEI]: PrismaCityNameType.TAIPEI,
  [CityNameType.NEW_TAIPEI]: PrismaCityNameType.NEW_TAIPEI,
  [CityNameType.TAOYUAN]: PrismaCityNameType.TAOYUAN,
  [CityNameType.TAICHUNG]: PrismaCityNameType.TAICHUNG,
  [CityNameType.TAINAN]: PrismaCityNameType.TAINAN,
  [CityNameType.KAOHSIUNG]: PrismaCityNameType.KAOHSIUNG,
  [CityNameType.KEELUNG]: PrismaCityNameType.KEELUNG,
  [CityNameType.HSINCHU]: PrismaCityNameType.HSINCHU,
  [CityNameType.HSINCHU_COUNTY]: PrismaCityNameType.HSINCHU_COUNTY,
  [CityNameType.MIAOLI_COUNTY]: PrismaCityNameType.MIAOLI_COUNTY,
  [CityNameType.CHANGHUA_COUNTY]: PrismaCityNameType.CHANGHUA_COUNTY,
  [CityNameType.NANTOU_COUNTY]: PrismaCityNameType.NANTOU_COUNTY,
  [CityNameType.YUNLIN_COUNTY]: PrismaCityNameType.YUNLIN_COUNTY,
  [CityNameType.CHIAYI_COUNTY]: PrismaCityNameType.CHIAYI_COUNTY,
  [CityNameType.CHIAYI]: PrismaCityNameType.CHIAYI,
  [CityNameType.PINGTUNG_COUNTY]: PrismaCityNameType.PINGTUNG_COUNTY,
  [CityNameType.YILAN_COUNTY]: PrismaCityNameType.YILAN_COUNTY,
  [CityNameType.HUALIEN_COUNTY]: PrismaCityNameType.HUALIEN_COUNTY,
  [CityNameType.TAITUNG_COUNTY]: PrismaCityNameType.TAITUNG_COUNTY,
  [CityNameType.KINMEN_COUNTY]: PrismaCityNameType.KINMEN_COUNTY,
  [CityNameType.PENGHU_COUNTY]: PrismaCityNameType.PENGHU_COUNTY,
  [CityNameType.LIENCHIANG_COUNTY]: PrismaCityNameType.LIENCHIANG_COUNTY,
}

function mapRoute(
  city: CityNameType,
  route: TdxBusRoute,
  updatedAt: Date | null,
): RouteRecord {
  return {
    uuid: route.RouteUID,
    tdx_route_id: route.RouteID,
    city: prismaCityByTdxCity[city],
    ...mapLocalizedName(route.RouteName),
    departure_zh_tw: toRequiredText(route.DepartureStopNameZh),
    departure_en: toNullableText(route.DepartureStopNameEn),
    departure_ja: null,
    departure_ko: null,
    destination_zh_tw: toRequiredText(route.DestinationStopNameZh),
    destination_en: toNullableText(route.DestinationStopNameEn),
    destination_ja: null,
    destination_ko: null,
    tdx_updated_at: updatedAt,
  }
}

function mapSubRoute(
  route: TdxBusRoute,
  subroute: TdxBusSubRoute,
  updatedAt: Date | null,
): SubRouteRecord {
  return {
    uuid: `${subroute.SubRouteUID}-${subroute.Direction}`,
    tdx_subroute_id: subroute.SubRouteID,
    direction: mapDirection(subroute.Direction),
    ...mapLocalizedName(subroute.SubRouteName),
    departure_zh_tw: toRequiredText(
      subroute.DepartureStopNameZh ?? route.DepartureStopNameZh,
    ),
    departure_en: toNullableText(
      subroute.DepartureStopNameEn ?? route.DepartureStopNameEn,
    ),
    departure_ja: null,
    departure_ko: null,
    destination_zh_tw: toRequiredText(
      subroute.DestinationStopNameZh ?? route.DestinationStopNameZh,
    ),
    destination_en: toNullableText(
      subroute.DestinationStopNameEn ?? route.DestinationStopNameEn,
    ),
    destination_ja: null,
    destination_ko: null,
    first_bus_time: toNullableText(subroute.FirstBusTime),
    last_bus_time: toNullableText(subroute.LastBusTime),
    tdx_updated_at: updatedAt,
  }
}

function mapOperator(operator: TdxBusOperator): OperatorRecord {
  return {
    tdx_operator_id: operator.OperatorID,
    name_zh_tw: toRequiredText(operator.OperatorName.Zh_tw),
    name_en: toNullableText(operator.OperatorName.En),
  }
}

function mapLocalizedName(text: TdxLocalizedText) {
  return {
    name_zh_tw: toRequiredText(text.Zh_tw),
    name_en: toNullableText(text.En),
    name_ja: toNullableText(text.Ja),
    name_ko: toNullableText(text.Ko),
  }
}

function mapDirection(direction: DirectionType): PrismaDirectionType {
  switch (direction) {
    case DirectionType.GO:
      return PrismaDirectionType.GO
    case DirectionType.RETURN:
      return PrismaDirectionType.RETURN
    case DirectionType.LOOP:
      return PrismaDirectionType.LOOP
    case DirectionType.SHUTTLE:
      return PrismaDirectionType.SHUTTLE
    default:
      return PrismaDirectionType.UNKNOWN
  }
}

function toRequiredText(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

function toNullableText(value: string | null | undefined): string | null {
  const text = value?.trim()

  return text ? text : null
}

function toDate(value: string): Date | null {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

export function routeMapper({
  city,
  tdxRoutes,
}: {
  city: CityNameType
  tdxRoutes: TdxBusRoute[]
}): RouteSyncRecord[] {
  return tdxRoutes.map((tdxRoute) => {
    const updatedAt = toDate(tdxRoute.UpdateTime)

    return {
      route: mapRoute(city, tdxRoute, updatedAt),
      subroutes: (tdxRoute.SubRoutes ?? []).map((subroute) =>
        mapSubRoute(tdxRoute, subroute, updatedAt),
      ),
      operators: tdxRoute.Operators.map(mapOperator),
    }
  })
}
