import type { DirectionType } from '../enums/DirectionType'
import type { LngLat } from '../types/CoordsType'

export interface RouteRealtimeBusStatus {
  direction: DirectionType
  estimateLabel: string
  estimateMinutes: number | null
  id: string
  plateNumb: string | null
  position: LngLat | null
  stopName: string
  stopSequence: number
  subRouteUID: string
}
