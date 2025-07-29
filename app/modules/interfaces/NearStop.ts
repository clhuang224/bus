import type { BusStatusType } from '../enums/BusStatusType'
import type { DirectionType } from '../enums/DirectionType'
import type { DutyStatusType } from '../enums/DutyStatusType'
import type { LocalizedText, TdxLocalizedText } from '../types/LocalizedText'

export interface TdxNearStop<D = string, L = TdxLocalizedText> {
  PlateNumb: string,
  OperatorID: string,
  OperatorNo: string,
  RouteUID: string,
  RouteID: string,
  RouteName: L,
  SubRouteUID: string,
  SubRouteID: string,
  SubRouteName: L,
  Direction: DirectionType,
  StopUID: string,
  StopID: string,
  StopName: L,
  StopSequence: number,
  MessageType: number,
  DutyStatus: DutyStatusType,
  BusStatus: BusStatusType,
  A2EventType: number,
  GPSTime: D,
  TripStartTimeType: number,
  TripStartTime: D,
  TransTime: D,
  SrcRecTime: D,
  SrcTransTime: D,
  SrcUpdateTime: D,
  UpdateTime: D
}

export type NearStop = TdxNearStop<Date, LocalizedText>
