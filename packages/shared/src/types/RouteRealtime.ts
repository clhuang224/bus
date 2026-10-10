import type { RealtimeArrivalStatus } from '../enums/RealtimeArrivalStatus.js'
import type { RealtimeVehicleState } from '../enums/RealtimeVehicleState.js'
import type { RouteRealtimeStatus } from '../enums/RouteRealtimeStatus.js'
import type { ApiLocalizedText, ApiPosition } from './Station.js'

export interface ApiRealtimeArrival {
  status: RealtimeArrivalStatus
  /** Minutes until arrival, only when `status` is `minutes`. */
  minutes: number | null
}

export interface ApiRouteRealtimeStop {
  /** Matches a stop UUID in the route detail response. */
  uuid: string
  /** Null when no arrival data covers this stop. */
  arrival: ApiRealtimeArrival | null
}

export interface ApiRouteRealtimeNearStop {
  /** Null when the realtime feed does not identify the stop. */
  uuid: string | null
  sequence: number
  name: ApiLocalizedText
}

export interface ApiRouteRealtimeVehicle {
  plate_number: string
  /** Null when the vehicle only appears in the GPS position feed. */
  near_stop: ApiRouteRealtimeNearStop | null
  /** Null when the vehicle only appears in the GPS position feed. */
  state: RealtimeVehicleState | null
  arrival: ApiRealtimeArrival
  /** Null when the vehicle has no GPS position. */
  position: ApiPosition | null
}

export interface ApiRouteRealtimeSubRoute {
  /** Matches a sub-route UUID in the route detail response. */
  uuid: string
  status: RouteRealtimeStatus
  /** Every stop of the sub-route, in sequence order. */
  stops: ApiRouteRealtimeStop[]
  /** Vehicles near a stop first, ordered by arrival; GPS-only vehicles last. */
  vehicles: ApiRouteRealtimeVehicle[]
}

export interface ApiRouteRealtime {
  uuid: string
  sub_routes: ApiRouteRealtimeSubRoute[]
  /** When the API fetched this snapshot from upstream. */
  updated_at: string
}
