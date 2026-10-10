import type { CityNameType, DirectionType, LocalizedText } from '@bus/shared'
import type { LngLat } from '../types/CoordsType'

export interface RouteDetailStop {
  stopUID: string
  /** TDX StopID, used to match realtime data and saved favorites. */
  stopID: string
  /** TDX StationID, used to build saved favorite IDs. */
  stationID: string | null
  name: LocalizedText
  sequence: number
  position: LngLat | null
}

export interface RouteDetailSubRoute {
  /** Unique within a route: `<SubRouteUID>-<Direction>`. */
  id: string
  /** TDX SubRouteUID, used to match realtime data and saved favorites. */
  subRouteUID: string
  direction: DirectionType
  name: LocalizedText
  departure: LocalizedText
  destination: LocalizedText
  stops: RouteDetailStop[]
  /** Route line as `[longitude, latitude]` points; empty when unavailable. */
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
