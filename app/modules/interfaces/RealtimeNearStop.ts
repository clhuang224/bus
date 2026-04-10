import type { TdxA2EventType, VehicleStateType } from '../enums/VehicleStateType'
import type { BusStatusType } from '../enums/BusStatusType'
import type { CityNameType } from '../enums/CityNameType'
import type { DirectionType } from '../enums/DirectionType'
import type { DutyStatusType } from '../enums/DutyStatusType'
import type { MessageType } from '../enums/MessageType'
import type { TripStartTimeType } from '../enums/TripStartTimeType'
import type { LocalizedText, TdxLocalizedText } from '../types/LocalizedText'

export interface TdxRealtimeNearStop<L = TdxLocalizedText, D = string> {
  PlateNumb: string
  OperatorID: string | null
  OperatorNo?: string | null
  RouteUID: string | null
  RouteID: string | null
  RouteName: L | null
  SubRouteUID: string | null
  SubRouteID: string | null
  SubRouteName: L | null
  Direction: DirectionType
  StopUID: string | null
  StopID: string | null
  StopName: L | null
  StopSequence: number
  MessageType?: MessageType | null
  DutyStatus: DutyStatusType | null
  BusStatus: BusStatusType | null
  A2EventType?: TdxA2EventType | null
  GPSTime: D
  TripStartTimeType: TripStartTimeType
  TripStartTime?: D | null
  TransTime?: D | null
  SrcRecTime?: D | null
  SrcTransTime?: D | null
  SrcUpdateTime?: D | null
  UpdateTime: D
}

export interface RealtimeNearStop<D = string> extends Omit<TdxRealtimeNearStop<LocalizedText, D>, 'RouteName' | 'SubRouteName' | 'StopName' | 'A2EventType'> {
  City: CityNameType
  RouteName: LocalizedText
  SubRouteName: LocalizedText
  StopName: LocalizedText
  vehicleState?: VehicleStateType | null
}
