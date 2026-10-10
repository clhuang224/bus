import type { CityNameType } from '../enums/CityNameType.js'
import type { DirectionType } from '../enums/DirectionType.js'
import type { ApiLocalizedText, ApiPosition } from './Station.js'

export interface ApiRouteSummary {
  uuid: string
  city: CityNameType
  name: ApiLocalizedText
  departure: ApiLocalizedText
  destination: ApiLocalizedText
}

export interface RoutesResponse {
  routes: ApiRouteSummary[]
}

/** TDX identifiers for matching a route stop with TDX realtime data. */
export interface ApiRouteStopTdxReference {
  stop_id: string
  station_id: string | null
}

export interface ApiRouteStop {
  uuid: string
  sequence: number
  name: ApiLocalizedText
  position: ApiPosition
  tdx: ApiRouteStopTdxReference
}

export interface ApiRouteShape {
  /** Ordered `[longitude, latitude]` points. */
  path: [longitude: number, latitude: number][]
  updated_at: string
}

/** TDX identifiers for matching a sub-route with TDX realtime data. */
export interface ApiRouteSubRouteTdxReference {
  sub_route_uid: string
}

export interface ApiRouteSubRoute {
  uuid: string
  name: ApiLocalizedText
  direction: DirectionType
  departure: ApiLocalizedText
  destination: ApiLocalizedText
  first_bus_time: string | null
  last_bus_time: string | null
  stops: ApiRouteStop[]
  shape: ApiRouteShape
  tdx: ApiRouteSubRouteTdxReference
}

export interface ApiRouteDetail extends ApiRouteSummary {
  sub_routes: ApiRouteSubRoute[]
}
