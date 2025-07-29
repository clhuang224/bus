import type { CityNameType } from '../enums/CityNameType'
import type { DirectionType } from '../enums/DirectionType'
import type { LocalizedText, TdxLocalizedText } from '../types/LocalizedText'

export interface TdxBusSubRoute<D = string, L = TdxLocalizedText> {
  SubRouteUID: string,
  SubRouteID: string,
  OperatorIDs: string[],
  SubRouteName: L,
  Direction: DirectionType,
  FirstBusTime: D,
  LastBusTime: D,
  HolidayFirstBusTime: D,
  HolidayLastBusTime: D,
  DepartureStopNameZh: string,
  DepartureStopNameEn: string,
  DestinationStopNameZh: string,
  DestinationStopNameEn: string
}

export interface TdxBusRoute<D = string, L = TdxLocalizedText, S = TdxBusSubRoute<D, L>> {
  RouteUID: string,
  RouteID: string,
  HasSubRoutes: true,
  Operators: {
    OperatorID: string,
    OperatorName: L,
    OperatorCode: string,
    OperatorNo: string
  }[],
  AuthorityID: string,
  ProviderID: string,
  SubRoutes: S[],
  BusRouteType: 0,
  RouteName: L,
  DepartureStopNameZh: string,
  DepartureStopNameEn: string,
  DestinationStopNameZh: string,
  DestinationStopNameEn: string,
  TicketPriceDescriptionZh: string,
  TicketPriceDescriptionEn: string,
  FareBufferZoneDescriptionZh: string,
  FareBufferZoneDescriptionEn: string,
  RouteMapImageUrl: string,
  City: CityNameType,
  CityCode: string,
  UpdateTime: D,
  VersionID: 0
}

export interface BusSubRoute extends Omit<TdxBusSubRoute<Date, LocalizedText>,
'DepartureStopNameZh' |
'DepartureStopNameEn' |
'DestinationStopNameZh' |
'DestinationStopNameEn'> {
  DepartureStopName: LocalizedText,
  DestinationStopName: LocalizedText
}

export interface BusRoute extends Omit<TdxBusRoute<Date, LocalizedText, BusSubRoute>,
'DepartureStopNameZh' |
'DepartureStopNameEn' |
'DestinationStopNameZh' |
'DestinationStopNameEn' |
'TicketPriceDescriptionZh' |
'TicketPriceDescriptionEn' |
'FareBufferZoneDescriptionZh' |
'FareBufferZoneDescriptionEn'> {
  DepartureStopName: LocalizedText,
  DestinationStopName: LocalizedText,
  TicketPriceDescription: LocalizedText,
  FareBufferZoneDescription: LocalizedText
}
