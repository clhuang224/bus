import type { CityNameType, DirectionType } from '../../enums/index.js'
import type { TdxLocalizedText } from './BusRoute.js'

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
  City?: CityNameType | '' | null
}
