import type { CityNameType, DirectionType, LocalizedText } from '@bus/shared'
import type { LngLat } from '../types/CoordsType'

export interface RouteDetailStop {
  stopUID: string
  stopID: string
  stationID: string | null
  name: LocalizedText
  sequence: number
  position: LngLat | null
}

export interface RouteDetailSubRoute {
  id: string
  subRouteUID: string
  direction: DirectionType
  name: LocalizedText
  departure: LocalizedText
  destination: LocalizedText
  stops: RouteDetailStop[]
  path: LngLat[]
}

export interface RouteDetail {
  routeUID: string
  city: CityNameType
  name: LocalizedText
  departure: LocalizedText
  destination: LocalizedText
  subRoutes: RouteDetailSubRoute[]
}
