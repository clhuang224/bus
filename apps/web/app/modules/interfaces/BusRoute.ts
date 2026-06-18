import type {
  CityNameType,
  LocalizedText,
  TdxBusRoute,
  TdxBusSubRoute,
} from '@bus/shared'

export type { TdxBusRoute, TdxBusSubRoute } from '@bus/shared'

export interface BusSubRoute<D = Date | null> extends Omit<
  TdxBusSubRoute<D, LocalizedText>,
  | 'DepartureStopNameZh'
  | 'DepartureStopNameEn'
  | 'DestinationStopNameZh'
  | 'DestinationStopNameEn'
  | 'FirstBusTime'
  | 'LastBusTime'
  | 'HolidayFirstBusTime'
  | 'HolidayLastBusTime'
> {
  FirstBusTime: D
  LastBusTime: D
  HolidayFirstBusTime: D
  HolidayLastBusTime: D
  DepartureStopName: LocalizedText
  DestinationStopName: LocalizedText
}

export interface BusRoute<D = Date | null> extends Omit<
  TdxBusRoute<D, LocalizedText, BusSubRoute<D>>,
  | 'SubRoutes'
  | 'DepartureStopNameZh'
  | 'DepartureStopNameEn'
  | 'DestinationStopNameZh'
  | 'DestinationStopNameEn'
  | 'TicketPriceDescriptionZh'
  | 'TicketPriceDescriptionEn'
  | 'FareBufferZoneDescriptionZh'
  | 'FareBufferZoneDescriptionEn'
  | 'City'
> {
  City: CityNameType
  SubRoutes: BusSubRoute<D>[]
  DepartureStopName: LocalizedText
  DestinationStopName: LocalizedText
  TicketPriceDescription: LocalizedText
  FareBufferZoneDescription: LocalizedText
}
