// @vitest-environment jsdom

import { fireEvent, screen } from '@testing-library/react'
import type { Reducer, UnknownAction } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestStore } from '~/test/createTestStore'
import { renderWithStore } from '~/test/render'
import BaseMap from './BaseMap'

const { mockMap, MockMap, MockMarker, MockLngLat } = vi.hoisted(() => {
  const mockMap = {
    isStyleLoaded: () => true,
    once: vi.fn(),
    off: vi.fn(),
    remove: vi.fn(),
    flyTo: vi.fn()
  }

  class MockMap {
    constructor() {
      return mockMap
    }
  }

  class MockMarker {
    setLngLat() {
      return this
    }

    addTo() {
      return this
    }

    remove() {}
  }

  class MockLngLat {
    constructor(
      public lng: number,
      public lat: number
    ) {}
  }

  return { mockMap, MockMap, MockMarker, MockLngLat }
})

vi.mock('maplibre-gl', () => ({
  default: {
    Map: MockMap
  },
  Map: MockMap,
  Marker: MockMarker,
  LngLat: MockLngLat
}))

describe('BaseMap', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockMap.flyTo.mockReset()
  })

  it('disables the focus-my-location control when user coordinates are unavailable', () => {
    const store = createTestStore({
      reducer: {
        geolocation: (() => ({
          coords: null
        })) as unknown as Reducer<unknown, UnknownAction>
      }
    })

    renderWithStore(
      <BaseMap center={[25.033, 121.5654]} showUserLocation />,
      { store }
    )

    expect(screen.getByRole('button', { name: '我的位置' })).toBeDisabled()
  })

  it('focuses the map on the user location when the control is clicked', () => {
    const store = createTestStore({
      reducer: {
        geolocation: (() => ({
          coords: [25.033, 121.5654]
        })) as unknown as Reducer<unknown, UnknownAction>
      }
    })

    renderWithStore(
      <BaseMap center={[25.033, 121.5654]} showUserLocation />,
      { store }
    )

    fireEvent.click(screen.getByRole('button', { name: '我的位置' }))

    expect(mockMap.flyTo).toHaveBeenCalledWith({
      center: [121.5654, 25.033],
      zoom: 16,
      duration: 800
    })
  })
})
