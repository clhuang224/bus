import { DirectionType, TdxA2EventType } from '@bus/shared'
import {
  isTdxRealtimeNearStop,
  normalizeTdxRealtimeNearStop,
} from './tdx-realtime.validator.js'

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
