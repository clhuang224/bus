import type { BusStatusType } from '../enums/BusStatusType'
import type { CityNameType } from '../enums/CityNameType'
import type { DirectionType } from '../enums/DirectionType'
import type { DutyStatusType } from '../enums/DutyStatusType'
import type { LngLat } from '../types/CoordsType'
import type { LocalizedText, TdxLocalizedText } from '../types/LocalizedText'

export interface TdxRealtimeNearStop<L = TdxLocalizedText> {
  PlateNumb: string | null
  OperatorID: string
  RouteUID: string
  RouteID: string
  RouteName: L
  SubRouteUID: string
  SubRouteID: string
  SubRouteName: L
  Direction: DirectionType
  StopUID: string
  StopID: string
  StopName: L
  StopSequence: number
  DutyStatus: DutyStatusType
  BusStatus: BusStatusType
  A2EventType: number
  GPSTime: string
  SrcUpdateTime: string
  UpdateTime: string
  BusPosition: {
    PositionLon: number
    PositionLat: number
    GeoHash?: string | null
  }
}

export interface RealtimeNearStop extends Omit<TdxRealtimeNearStop<LocalizedText>, 'RouteName' | 'SubRouteName' | 'StopName' | 'BusPosition'> {
  City: CityNameType
  RouteName: LocalizedText
  SubRouteName: LocalizedText
  StopName: LocalizedText
  position: LngLat
}
