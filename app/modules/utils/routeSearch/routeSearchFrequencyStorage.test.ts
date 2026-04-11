// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getRouteSearchFrequencyFromStorage,
  incrementRouteSearchFrequency,
  loadRouteSearchFrequencyFromStorage,
  ROUTE_SEARCH_FREQUENCY_STORAGE_KEY
} from './routeSearchFrequencyStorage'

describe('routeSearchFrequencyStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('loads a normalized route search frequency map from storage', () => {
    const storage = {
      getItem: vi.fn(() => JSON.stringify({
        'route-1': 3,
        'route-2': 1,
        broken: 0
      })),
      removeItem: vi.fn()
    }

    expect(getRouteSearchFrequencyFromStorage(storage)).toEqual({
      'route-1': 3,
      'route-2': 1
    })
    expect(storage.removeItem).not.toHaveBeenCalled()
  })

  it('clears the storage key when the stored JSON is invalid', () => {
    const storage = {
      getItem: vi.fn(() => '{invalid-json'),
      removeItem: vi.fn()
    }

    expect(getRouteSearchFrequencyFromStorage(storage)).toEqual({})
    expect(storage.removeItem).toHaveBeenCalledWith(ROUTE_SEARCH_FREQUENCY_STORAGE_KEY)
  })

  it('increments route frequency counts in localStorage', () => {
    localStorage.setItem(ROUTE_SEARCH_FREQUENCY_STORAGE_KEY, JSON.stringify({
      'route-1': 2
    }))

    incrementRouteSearchFrequency('route-1')
    incrementRouteSearchFrequency('route-2')

    expect(loadRouteSearchFrequencyFromStorage()).toEqual({
      'route-1': 3,
      'route-2': 1
    })
  })

  it('keeps only the top 100 routes by frequency', () => {
    const storedMap = Object.fromEntries(
      Array.from({ length: 100 }, (_, index) => [`route-${index + 1}`, 100 - index])
    )

    localStorage.setItem(ROUTE_SEARCH_FREQUENCY_STORAGE_KEY, JSON.stringify(storedMap))

    incrementRouteSearchFrequency('route-101')
    incrementRouteSearchFrequency('route-101')

    const routeSearchFrequency = loadRouteSearchFrequencyFromStorage()

    expect(Object.keys(routeSearchFrequency)).toHaveLength(100)
    expect(routeSearchFrequency['route-101']).toBeUndefined()
    expect(routeSearchFrequency['route-1']).toBe(100)
  })

  it('warns instead of throwing when storage writes fail', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => incrementRouteSearchFrequency('route-1')).not.toThrow()
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to persist route search frequency to localStorage.',
      expect.any(Error)
    )

    setItemSpy.mockRestore()
  })
})
