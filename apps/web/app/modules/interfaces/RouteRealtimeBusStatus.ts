import type { DirectionType } from '@bus/shared'
import type { VehicleStateType } from '../enums/VehicleStateType'

export interface RouteRealtimeBusStatus {
  direction: DirectionType
  estimateLabel: string
  estimateMinutes: number | null
  id: string
  plateNumb: string
  stopName: string
  stopSequence: number
  subRouteUID: string
  vehicleState: VehicleStateType
}
