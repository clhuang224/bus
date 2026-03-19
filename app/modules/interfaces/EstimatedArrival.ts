import type { CityNameType } from '../enums/CityNameType'
import type { DirectionType } from '../enums/DirectionType'
import type { LocalizedText, TdxLocalizedText } from '../types/LocalizedText'

export interface TdxEstimatedArrival<L = TdxLocalizedText> {
  PlateNumb?: string | null
  StopUID: string
  StopID: string
  StopName: L
  RouteUID: string
  RouteID: string
  RouteName: L
  SubRouteUID: string
  SubRouteID: string
  SubRouteName: L
  Direction: DirectionType
  StopSequence: number
  EstimateTime: number | null
  StopStatus: number
  MessageType: number
  NextBusTime?: string | null
  SrcUpdateTime?: string
  UpdateTime: string
}

export interface EstimatedArrival extends Omit<TdxEstimatedArrival<LocalizedText>, 'StopName' | 'RouteName' | 'SubRouteName'> {
  City: CityNameType
  StopName: LocalizedText
  RouteName: LocalizedText
  SubRouteName: LocalizedText
}
