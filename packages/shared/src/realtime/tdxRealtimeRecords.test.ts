import { describe, expect, it } from 'vitest'
import { DirectionType } from '../enums/DirectionType.js'
import { TdxA2EventType } from '../enums/TdxA2EventType.js'
import {
  isTdxEstimatedArrival,
  isTdxRealtimeByFrequency,
  isTdxRealtimeNearStop,
  normalizeTdxRealtimeNearStop,
} from './tdxRealtimeRecords.js'

const nearStop = {
  PlateNumb: 'KKA-0151',
  SubRouteUID: 'TPE101320',
  Direction: DirectionType.GO,
  StopUID: 'TPE1',
  StopSequence: 1,
}

describe('isTdxRealtimeNearStop', () => {
  it.each([TdxA2EventType.DEPARTED, TdxA2EventType.ARRIVING, 2, null])(
    'accepts a numeric or missing A2EventType: %p',
    (a2EventType) => {
      expect(
        isTdxRealtimeNearStop({ ...nearStop, A2EventType: a2EventType }),
      ).toBe(true)
    },
  )

  it('rejects a non-numeric A2EventType', () => {
    expect(isTdxRealtimeNearStop({ ...nearStop, A2EventType: '1' })).toBe(false)
  })

  it('rejects a record without a plate number', () => {
    expect(isTdxRealtimeNearStop({ ...nearStop, PlateNumb: ' ' })).toBe(false)
  })
})

describe('normalizeTdxRealtimeNearStop', () => {
  it.each([TdxA2EventType.DEPARTED, TdxA2EventType.ARRIVING])(
    'keeps the defined A2EventType %p',
    (a2EventType) => {
      expect(
        normalizeTdxRealtimeNearStop({ ...nearStop, A2EventType: a2EventType })
          .A2EventType,
      ).toBe(a2EventType)
    },
  )

  it('turns an undefined A2EventType value into null', () => {
    expect(
      normalizeTdxRealtimeNearStop({
        ...nearStop,
        A2EventType: 2 as TdxA2EventType,
      }),
    ).toEqual({ ...nearStop, A2EventType: null })
  })
})

describe('Direction validation', () => {
  it.each([
    DirectionType.GO,
    DirectionType.RETURN,
    DirectionType.LOOP,
    DirectionType.SHUTTLE,
    DirectionType.UNKNOWN,
  ])('accepts the defined direction %p', (direction) => {
    expect(isTdxEstimatedArrival({ Direction: direction })).toBe(true)
    expect(isTdxRealtimeNearStop({ ...nearStop, Direction: direction })).toBe(
      true,
    )
  })

  it.each([99, -1, '0'])('rejects the undefined direction %p', (direction) => {
    expect(isTdxEstimatedArrival({ Direction: direction })).toBe(false)
    expect(isTdxRealtimeNearStop({ ...nearStop, Direction: direction })).toBe(
      false,
    )
    expect(
      isTdxRealtimeByFrequency({ PlateNumb: 'KKA-0151', Direction: direction }),
    ).toBe(false)
  })

  it('allows GPS records without a direction', () => {
    expect(isTdxRealtimeByFrequency({ PlateNumb: 'KKA-0151' })).toBe(true)
  })
})
