// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getRouteSearchRecentFromStorage,
  loadRouteSearchRecentFromStorage,
  ROUTE_SEARCH_RECENT_STORAGE_KEY,
  saveRouteSearchRecent
} from './routeSearchRecentStorage'

describe('routeSearchRecentStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('loads normalized recently viewed route uids from storage', () => {
    const storage = {
      getItem: vi.fn((key: string) => key === ROUTE_SEARCH_RECENT_STORAGE_KEY
        ? JSON.stringify(['route-2', 'route-1', 'route-2', ''])
        : null),
      removeItem: vi.fn()
    }

    expect(getRouteSearchRecentFromStorage(storage)).toEqual(['route-2', 'route-1'])
    expect(storage.removeItem).not.toHaveBeenCalled()
  })

  it('saves the most recently viewed route to the front of the list', () => {
    localStorage.setItem(ROUTE_SEARCH_RECENT_STORAGE_KEY, JSON.stringify(['route-2', 'route-1']))

    saveRouteSearchRecent('route-3')
    saveRouteSearchRecent('route-1')

    expect(loadRouteSearchRecentFromStorage()).toEqual(['route-1', 'route-3', 'route-2'])
  })

  it('keeps only the most recent 100 viewed routes', () => {
    localStorage.setItem(
      ROUTE_SEARCH_RECENT_STORAGE_KEY,
      JSON.stringify(Array.from({ length: 100 }, (_, index) => `route-${index + 1}`))
    )

    saveRouteSearchRecent('route-101')

    const recentRouteUIDs = loadRouteSearchRecentFromStorage()

    expect(recentRouteUIDs).toHaveLength(100)
    expect(recentRouteUIDs[0]).toBe('route-101')
    expect(recentRouteUIDs.includes('route-100')).toBe(false)
  })

  it('warns instead of throwing when storage writes fail', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => saveRouteSearchRecent('route-1')).not.toThrow()
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to persist recently viewed routes to localStorage.',
      expect.any(Error)
    )

    setItemSpy.mockRestore()
  })
})
