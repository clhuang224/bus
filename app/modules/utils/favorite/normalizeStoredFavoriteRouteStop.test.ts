import { describe, expect, it } from 'vitest'
import { CityNameType } from '../../enums/CityNameType'
import { DirectionType } from '../../enums/DirectionType'
import { normalizeStoredFavoriteRouteStop } from './normalizeStoredFavoriteRouteStop'

const validStoredFavoriteRouteStop = {
  favoriteId: 'route-1-subroute-1-0-station-1',
  city: CityNameType.TAIPEI,
  routeUID: 'route-1',
  routeName: { 'zh-TW': '藍1', en: 'Blue 1' },
  subRouteUID: 'subroute-1',
  subRouteName: { 'zh-TW': '往捷運昆陽站', en: 'To MRT Kunyang Station' },
  direction: DirectionType.GO,
  stopUID: 'stop-1',
  stopID: 'stop-id-1',
  stationID: 'station-1',
  stationKey: 'station-1',
  stopName: { 'zh-TW': '市政府', en: 'City Hall' },
  stopSequence: 1,
  departure: { 'zh-TW': '市政府', en: 'City Hall' },
  destination: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' }
}

describe('normalizeStoredFavoriteRouteStop', () => {
  it('returns a favorite route stop for a valid stored object', () => {
    expect(normalizeStoredFavoriteRouteStop(validStoredFavoriteRouteStop)).toEqual(validStoredFavoriteRouteStop)
  })

  it('supports legacy zh_TW localized text keys and plain string values', () => {
    expect(normalizeStoredFavoriteRouteStop({
      ...validStoredFavoriteRouteStop,
      routeName: { zh_TW: '藍1', en: 'Blue 1' },
      subRouteName: '往捷運昆陽站',
      stopName: '市政府',
      departure: '市政府',
      destination: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' }
    })).toEqual({
      ...validStoredFavoriteRouteStop,
      routeName: { 'zh-TW': '藍1', en: 'Blue 1' },
      subRouteName: { 'zh-TW': '往捷運昆陽站', en: '' },
      stopName: { 'zh-TW': '市政府', en: '' },
      departure: { 'zh-TW': '市政府', en: '' },
      destination: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' }
    })
  })

  it('returns null when required fields are invalid', () => {
    expect(normalizeStoredFavoriteRouteStop({
      ...validStoredFavoriteRouteStop,
      direction: 99
    })).toBeNull()

    expect(normalizeStoredFavoriteRouteStop({
      ...validStoredFavoriteRouteStop,
      stopName: null
    })).toBeNull()
  })
})
