import type { CityNameType, DirectionType } from '@bus/shared'
import type { MessageType } from '../enums/MessageType'
import type { TdxStopStatus } from '@bus/shared'
import type { LocalizedText, TdxLocalizedText } from '@bus/shared'

export interface TdxEstimatedArrival<L = TdxLocalizedText> {
  PlateNumb?: string | null
  StopUID?: string | null
  StopID?: string | null
  StopName?: L | null
  RouteUID: string | null
  RouteID?: string | null
  RouteName?: L | null
  SubRouteUID?: string | null
  SubRouteID?: string | null
  SubRouteName?: L | null
  Direction: DirectionType
  StopSequence?: number | null
  EstimateTime: number | null
  StopStatus?: TdxStopStatus | null
  MessageType?: MessageType | null
  NextBusTime?: string | null
  SrcUpdateTime?: string | null
  UpdateTime: string
}

export interface EstimatedArrival extends Omit<
  TdxEstimatedArrival<LocalizedText>,
  'StopName' | 'RouteName' | 'SubRouteName'
> {
  City: CityNameType
  StopName: LocalizedText
  RouteName: LocalizedText
  SubRouteName: LocalizedText
  RouteUID: string
  RouteID: string | null
  SubRouteUID: string
  SubRouteID: string | null
  StopStatus: TdxStopStatus
}
