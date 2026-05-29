import { describe, expect, it } from 'vitest'
import { TdxA2EventType, VehicleStateType } from '../../enums/VehicleStateType'
import { transformTdxVehicleState } from './transformTdxVehicleState'

describe('transformTdxVehicleState', () => {
  it('maps departed events to departed vehicle state', () => {
    expect(transformTdxVehicleState(TdxA2EventType.DEPARTED)).toBe(VehicleStateType.DEPARTED)
  })

  it('maps arriving events to arriving vehicle state', () => {
    expect(transformTdxVehicleState(TdxA2EventType.ARRIVING)).toBe(VehicleStateType.ARRIVING)
  })

  it('returns at-stop vehicle state when the event type is missing', () => {
    expect(transformTdxVehicleState(undefined)).toBe(VehicleStateType.AT_STOP)
    expect(transformTdxVehicleState(null)).toBe(VehicleStateType.AT_STOP)
  })
})
