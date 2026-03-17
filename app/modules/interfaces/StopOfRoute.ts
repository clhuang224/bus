import type { DirectionType } from '../enums/DirectionType'
import type { LocalizedText, TdxLocalizedText } from '../types/LocalizedText'

export interface TdxStopOfRouteStop<L = TdxLocalizedText> {
  StopUID: string
  StopID: string
  StopName: L
  StopSequence: number
  StationID?: string | null
}

export interface TdxStopOfRoute<L = TdxLocalizedText, S = TdxStopOfRouteStop<L>> {
  RouteUID: string
  RouteID: string
  RouteName: L
  SubRouteUID: string
  SubRouteID: string
  SubRouteName: L
  DestinationStopNameZh: string
  DestinationStopNameEn: string
  Direction: DirectionType
  Stops: S[]
}

export type StopOfRouteStop = TdxStopOfRouteStop<LocalizedText>

export interface StopOfRoute extends Omit<TdxStopOfRoute<LocalizedText, StopOfRouteStop>,
'DestinationStopNameZh' |
'DestinationStopNameEn'> {
  DestinationStopName: LocalizedText
}
