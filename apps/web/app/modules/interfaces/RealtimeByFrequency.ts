import type { BusStatusType } from '../enums/BusStatusType'
import type { CityNameType } from '../enums/CityNameType'
import type { DirectionType } from '../enums/DirectionType'
import type { DutyStatusType } from '../enums/DutyStatusType'
import type { MessageType } from '../enums/MessageType'
import type { LngLat } from '../types/CoordsType'
import type { LocalizedText, TdxLocalizedText } from '../types/LocalizedText'

export interface TdxRealtimeByFrequency<L = TdxLocalizedText, D = string> {
  PlateNumb: string
  OperatorID: string | null
  OperatorNo: string | null
  RouteUID: string | null
  RouteID: string | null
  RouteName: L | null
  SubRouteUID: string | null
  SubRouteID: string | null
  SubRouteName: L | null
  Direction: DirectionType | null
  GPSTime: D
  Speed: number | null
  Azimuth: number | null
  DutyStatus: DutyStatusType | null
  BusStatus: BusStatusType | null
  MessageType: MessageType | null
  TransTime: D | null
  SrcRecTime: D | null
  SrcTransTime: D | null
  SrcUpdateTime: D | null
  UpdateTime: D
  BusPosition?: {
    PositionLon: number | null
    PositionLat: number | null
    GeoHash?: string | null
  } | null
}

export interface RealtimeByFrequency<D = string> extends Omit<
TdxRealtimeByFrequency<LocalizedText, D>,
'RouteName' | 'SubRouteName' | 'BusPosition'
> {
  City: CityNameType
  RouteName: LocalizedText
  SubRouteName: LocalizedText
  position: LngLat | null
}
