import { TdxA2EventType, VehicleStateType } from '../../enums/VehicleStateType'

export function transformTdxVehicleState(a2EventType?: TdxA2EventType | null) {
  if (a2EventType == null) {
    return undefined
  }

  return a2EventType === TdxA2EventType.DEPARTED
    ? VehicleStateType.DEPARTED
    : VehicleStateType.ARRIVING
}
