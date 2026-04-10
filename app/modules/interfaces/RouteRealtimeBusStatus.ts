import type { A2EventType } from '../enums/A2EventType'
import type { DirectionType } from '../enums/DirectionType'

export interface RouteRealtimeBusStatus {
  a2EventType?: A2EventType | null
  direction: DirectionType
  estimateLabel: string
  estimateMinutes: number | null
  id: string
  plateNumb: string
  stopName: string
  stopSequence: number
  subRouteUID: string
}
