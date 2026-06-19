import type { CityNameType, DirectionType } from '@bus/shared'
import type { LocalizedText, TdxLocalizedText } from '@bus/shared'

export interface TdxStopOfRouteStop<L = TdxLocalizedText> {
  StopUID: string
  StopID: string
  StopName: L
  StopSequence: number
  StationID?: string | null
}

export interface TdxStopOfRoute<
  L = TdxLocalizedText,
  S = TdxStopOfRouteStop<L>,
> {
  RouteUID: string
  RouteID: string
  RouteName: L
  SubRouteUID: string
  SubRouteID: string
  SubRouteName: L
  Direction: DirectionType
  Stops: S[]
}

export type StopOfRouteStop = TdxStopOfRouteStop<LocalizedText>

export interface StopOfRoute extends TdxStopOfRoute<
  LocalizedText,
  StopOfRouteStop
> {
  City: CityNameType
}
