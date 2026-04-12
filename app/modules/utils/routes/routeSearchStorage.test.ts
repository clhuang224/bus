// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AreaType } from '../../enums/AreaType'
import { initialRouteSearchState } from '../../slices/routeSearchSlice'
import {
  getRouteSearchFromStorage,
  loadRouteSearchFromStorage,
  persistRouteSearchToStorage,
  ROUTE_SEARCH_STORAGE_KEY
} from './routeSearchStorage'

describe('routeSearchStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('loads route search state from storage', () => {
    const storage = {
      getItem: vi.fn(() => JSON.stringify({
        selectedArea: AreaType.TAIPEI
      })),
      removeItem: vi.fn()
    }

    expect(getRouteSearchFromStorage(storage)).toEqual({
      keyword: '',
      selectedArea: AreaType.TAIPEI
    })
    expect(storage.removeItem).not.toHaveBeenCalled()
  })

  it('falls back to defaults when stored fields are malformed', () => {
    const storage = {
      getItem: vi.fn(() => JSON.stringify({
        selectedArea: 'Mars'
      })),
      removeItem: vi.fn()
    }

    expect(getRouteSearchFromStorage(storage)).toEqual(initialRouteSearchState)
    expect(storage.removeItem).not.toHaveBeenCalled()
  })

  it('clears the storage key when the stored JSON is invalid', () => {
    const storage = {
      getItem: vi.fn(() => '{invalid-json'),
      removeItem: vi.fn()
    }

    expect(getRouteSearchFromStorage(storage)).toEqual(initialRouteSearchState)
    expect(storage.removeItem).toHaveBeenCalledWith(ROUTE_SEARCH_STORAGE_KEY)
  })

  it('writes route search state into localStorage', () => {
    persistRouteSearchToStorage({
      keyword: '紅25',
      selectedArea: AreaType.TAIPEI
    })

    expect(localStorage.getItem(ROUTE_SEARCH_STORAGE_KEY)).toBe(JSON.stringify({
      selectedArea: AreaType.TAIPEI
    }))
  })

  it('returns defaults and warns when storage is unavailable during load', () => {
    const localStorageGetter = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked')
    })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(loadRouteSearchFromStorage()).toEqual(initialRouteSearchState)
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to load route search from localStorage.',
      expect.any(Error)
    )

    localStorageGetter.mockRestore()
  })

  it('warns instead of throwing when storage writes fail', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => persistRouteSearchToStorage({
      keyword: '307',
      selectedArea: AreaType.TAIPEI
    })).not.toThrow()
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to persist route search to localStorage.',
      expect.any(Error)
    )

    setItemSpy.mockRestore()
  })
})
