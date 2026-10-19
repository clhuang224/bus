import type { RealtimeVehicleState } from '@bus/shared'

export interface RouteRealtimeBusStatus {
  /** Normalized plate number, shared with the map vehicle of the same bus. */
  id: string
  plateNumb: string
  stopSequence: number
  vehicleState: RealtimeVehicleState
}
