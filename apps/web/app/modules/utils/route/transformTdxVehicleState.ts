import { TdxA2EventType, VehicleStateType } from '../../enums/VehicleStateType'

export function transformTdxVehicleState(a2EventType?: TdxA2EventType | null) {
  switch (a2EventType) {
    case TdxA2EventType.DEPARTED:
      return VehicleStateType.DEPARTED
    case TdxA2EventType.ARRIVING:
      return VehicleStateType.ARRIVING
    default:
      return VehicleStateType.AT_STOP
  }
}
