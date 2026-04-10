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

  it('returns undefined when the event type is missing', () => {
    expect(transformTdxVehicleState(undefined)).toBeUndefined()
    expect(transformTdxVehicleState(null)).toBeUndefined()
  })
})
