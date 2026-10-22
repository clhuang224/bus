import type { RealtimeArrivalStatus } from '../enums/RealtimeArrivalStatus.js'
import type { RealtimeVehicleState } from '../enums/RealtimeVehicleState.js'
import type { RouteRealtimeStatus } from '../enums/RouteRealtimeStatus.js'
import type { ApiLocalizedText, ApiPosition } from './Station.js'

export interface ApiRealtimeArrival {
  status: RealtimeArrivalStatus
  minutes: number | null
}

export interface ApiRouteRealtimeStop {
  uuid: string
  arrival: ApiRealtimeArrival | null
}

export interface ApiRouteRealtimeNearStop {
  uuid: string | null
  sequence: number
  name: ApiLocalizedText
}

export interface ApiRouteRealtimeVehicle {
  plate_number: string
  near_stop: ApiRouteRealtimeNearStop | null
  state: RealtimeVehicleState | null
  arrival: ApiRealtimeArrival
  position: ApiPosition | null
}

export interface ApiRouteRealtimeSubRoute {
  uuid: string
  status: RouteRealtimeStatus
  stops: ApiRouteRealtimeStop[]
  vehicles: ApiRouteRealtimeVehicle[]
}

export interface ApiRouteRealtime {
  uuid: string
  sub_routes: ApiRouteRealtimeSubRoute[]
  updated_at: string
}
