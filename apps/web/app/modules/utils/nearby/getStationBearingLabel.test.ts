import { describe, expect, it } from 'vitest'
import { BearingType, CityNameType } from '@bus/shared'
import type { NearbyStation } from '~/modules/interfaces/Nearby'
import { getStationBearingLabel } from './getStationBearingLabel'

const stationBase: NearbyStation = {
  stationId: 'station-1',
  name: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
  city: CityNameType.TAIPEI,
  address: null,
  bearings: [],
  position: [121.5654, 25.033],
  routes: [],
}

describe('getStationBearingLabel', () => {
  const t = (key: string) => key

  it('returns one bearing label when station bearings are the same', () => {
    expect(
      getStationBearingLabel(t, {
        ...stationBase,
        bearings: [BearingType.EAST],
      }),
    ).toBe('common.bearing.east')
  })

  it('returns combined bearing labels when stop bearings differ', () => {
    expect(
      getStationBearingLabel(t, {
        ...stationBase,
        bearings: [BearingType.EAST, BearingType.WEST],
      }),
    ).toBe('common.bearing.east / common.bearing.west')
  })

  it('returns null when no stop has a bearing value', () => {
    expect(
      getStationBearingLabel(t, {
        ...stationBase,
        bearings: [],
      }),
    ).toBeNull()
  })
})
