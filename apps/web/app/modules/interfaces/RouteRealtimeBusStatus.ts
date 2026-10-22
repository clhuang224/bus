import type { RealtimeVehicleState } from '@bus/shared'

export interface RouteRealtimeBusStatus {
  id: string
  plateNumb: string
  stopSequence: number
  vehicleState: RealtimeVehicleState
}
