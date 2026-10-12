import { DirectionType, TdxA2EventType } from '@bus/shared'
import { isTdxRealtimeNearStop } from './tdx-realtime.validator.js'

const nearStop = {
  PlateNumb: 'KKA-0151',
  SubRouteUID: 'TPE101320',
  Direction: DirectionType.GO,
  StopUID: 'TPE1',
  StopSequence: 1,
}

describe('isTdxRealtimeNearStop', () => {
  it.each([TdxA2EventType.DEPARTED, TdxA2EventType.ARRIVING, null, undefined])(
    'accepts A2EventType %s',
    (a2EventType) => {
      expect(
        isTdxRealtimeNearStop({ ...nearStop, A2EventType: a2EventType }),
      ).toBe(true)
    },
  )

  it.each([2, -1, '1'])('rejects A2EventType %p', (a2EventType) => {
    expect(
      isTdxRealtimeNearStop({ ...nearStop, A2EventType: a2EventType }),
    ).toBe(false)
  })

  it('rejects a record without a plate number', () => {
    expect(isTdxRealtimeNearStop({ ...nearStop, PlateNumb: ' ' })).toBe(false)
  })
})
