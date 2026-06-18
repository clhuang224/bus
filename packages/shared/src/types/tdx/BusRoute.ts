import type { CityNameType } from '../../enums/CityNameType.js'
import type { DirectionType } from '../../enums/DirectionType.js'

export type TdxLocalizedText = {
  Zh_tw: string
  En?: string | null
  Ja?: string | null
  Ko?: string | null
}

export interface TdxBusOperator<L = TdxLocalizedText> {
  OperatorID: string
  OperatorName: L
  OperatorCode?: string | null
  OperatorNo: string
}

export interface TdxBusSubRoute<D = string, L = TdxLocalizedText> {
  SubRouteUID: string
  SubRouteID: string
  OperatorIDs: string[]
  SubRouteName: L
  Headsign?: string | null
  HeadsignEn?: string | null
  Direction: DirectionType
  FirstBusTime?: D | null
  LastBusTime?: D | null
  HolidayFirstBusTime?: D | null
  HolidayLastBusTime?: D | null
  DepartureStopNameZh?: string | null
  DepartureStopNameEn?: string | null
  DestinationStopNameZh?: string | null
  DestinationStopNameEn?: string | null
}

export interface TdxBusRoute<
  D = string,
  L = TdxLocalizedText,
  S = TdxBusSubRoute<D, L>,
> {
  RouteUID: string
  RouteID: string
  HasSubRoutes: boolean
  Operators: TdxBusOperator<L>[]
  AuthorityID: string
  ProviderID: string
  SubRoutes?: S[] | null
  BusRouteType: number
  RouteName: L
  DepartureStopNameZh?: string | null
  DepartureStopNameEn?: string | null
  DestinationStopNameZh?: string | null
  DestinationStopNameEn?: string | null
  TicketPriceDescriptionZh?: string | null
  TicketPriceDescriptionEn?: string | null
  FareBufferZoneDescriptionZh?: string | null
  FareBufferZoneDescriptionEn?: string | null
  RouteMapImageUrl?: string | null
  City?: CityNameType | null
  CityCode?: string | null
  UpdateTime: D
  VersionID: number
}
