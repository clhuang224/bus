import { describe, expect, it } from 'vitest'
import { BearingType } from '~/modules/enums/BearingType'
import { CityNameType } from '~/modules/enums/CityNameType'
import type { NearbyStopGroup } from '~/modules/interfaces/Nearby'
import { getStopGroupBearingLabel } from './getStopGroupBearingLabel'

const stopGroupBase: NearbyStopGroup = {
  StationID: 'station-1',
  StopName: { 'zh-TW': '市政府', en: 'City Hall' },
  City: CityNameType.TAIPEI,
  position: [121.5654, 25.033],
  stops: []
}

describe('getStopGroupBearingLabel', () => {
  const t = (key: string) => key

  it('returns one bearing label when all stops share the same bearing', () => {
    expect(getStopGroupBearingLabel(t, {
      ...stopGroupBase,
      stops: [
        { Bearing: BearingType.EAST } as NearbyStopGroup['stops'][number],
        { Bearing: BearingType.EAST } as NearbyStopGroup['stops'][number]
      ]
    })).toBe('common.bearing.east')
  })

  it('returns combined bearing labels when stop bearings differ', () => {
    expect(getStopGroupBearingLabel(t, {
      ...stopGroupBase,
      stops: [
        { Bearing: BearingType.EAST } as NearbyStopGroup['stops'][number],
        { Bearing: BearingType.WEST } as NearbyStopGroup['stops'][number]
      ]
    })).toBe('common.bearing.east / common.bearing.west')
  })

  it('returns null when no stop has a bearing value', () => {
    expect(getStopGroupBearingLabel(t, {
      ...stopGroupBase,
      stops: [{ Bearing: null } as NearbyStopGroup['stops'][number]]
    })).toBeNull()
  })
})
