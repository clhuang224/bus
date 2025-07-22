
export interface BusRoute {
  id: string
  name: string
  busStops: BusStop[]
  direction: BusRouteDirection
}

export interface BusStop {
  id: string
  name: string
  lat: number
  lon: number
  busRouteIds: string[]
}

export interface BusInstance {
  id: string
  name: string
  routeId: string
  location: BusLocation
  status: BusInstanceStatus
}

export interface BusLocation {
  lat: number
  lon: number
  speed: number // km/h
  direction: number // 0-359 degrees
  timestamp: string // ISO
}
