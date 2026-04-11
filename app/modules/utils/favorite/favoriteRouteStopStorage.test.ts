// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CityNameType } from '../../enums/CityNameType'
import { DirectionType } from '../../enums/DirectionType'
import type { FavoriteRouteStop } from '../../interfaces/FavoriteRouteStop'
import {
  FAVORITE_ROUTE_STOPS_STORAGE_KEY,
  cacheFavoriteRouteStops,
  getFavoriteRouteStopsFromStorage,
  loadFavoriteRouteStopsFromCache
} from './favoriteRouteStopStorage'

const favoriteRouteStop: FavoriteRouteStop = {
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

describe('favoriteRouteStopStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('loads normalized favorite route stops from storage and filters malformed items', () => {
    const storage = {
      getItem: vi.fn(() => JSON.stringify([
        favoriteRouteStop,
        { favoriteId: 'broken-favorite' }
      ])),
      removeItem: vi.fn()
    }

    expect(getFavoriteRouteStopsFromStorage(storage)).toEqual([favoriteRouteStop])
    expect(storage.removeItem).not.toHaveBeenCalled()
  })

  it('clears the storage key when the stored JSON is invalid', () => {
    const storage = {
      getItem: vi.fn(() => '{invalid-json'),
      removeItem: vi.fn()
    }

    expect(getFavoriteRouteStopsFromStorage(storage)).toEqual([])
    expect(storage.removeItem).toHaveBeenCalledWith(FAVORITE_ROUTE_STOPS_STORAGE_KEY)
  })

  it('writes favorite route stops into localStorage', () => {
    cacheFavoriteRouteStops([favoriteRouteStop])

    expect(localStorage.getItem(FAVORITE_ROUTE_STOPS_STORAGE_KEY)).toBe(JSON.stringify([favoriteRouteStop]))
  })

  it('returns an empty array and warns when storage is unavailable during cache load', () => {
    const localStorageGetter = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked')
    })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(loadFavoriteRouteStopsFromCache()).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to load favorite route stops from localStorage.',
      expect.any(Error)
    )

    localStorageGetter.mockRestore()
  })

  it('warns instead of throwing when storage writes fail', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => cacheFavoriteRouteStops([favoriteRouteStop])).not.toThrow()
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to persist favorite route stops to localStorage.',
      expect.any(Error)
    )

    setItemSpy.mockRestore()
  })
})
