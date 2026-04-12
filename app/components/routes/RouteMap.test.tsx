// @vitest-environment jsdom

import { fireEvent, screen, waitFor } from '@testing-library/react'
import type { Reducer, UnknownAction } from '@reduxjs/toolkit'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import geoSlice from '~/modules/slices/geoSlice'
import { createTestStore } from '~/test/createTestStore'
import { renderWithStore } from '~/test/render'
import { RouteMap } from './RouteMap'

const { mockMap, MockLngLatBounds, MockMarker, MockPopup } = vi.hoisted(() => {
  const mockMap = {
    isStyleLoaded: () => true,
    once: vi.fn(),
    off: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    getLayer: vi.fn(() => null),
    getSource: vi.fn(() => null),
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
    fitBounds: vi.fn(),
    flyTo: vi.fn()
  }

  class MockMarker {
    private lngLat: [number, number] = [0, 0]
    private element: HTMLElement

    constructor({ element }: { element: HTMLElement }) {
      this.element = element
    }

    setLngLat(lngLat: [number, number]) {
      this.lngLat = lngLat
      return this
    }

    addTo() {
      return this
    }

    remove() {}

    getLngLat() {
      return this.lngLat
    }

    getElement() {
      return this.element
    }
  }

  class MockPopup {
    private container: HTMLDivElement | null = null

    setLngLat() {
      return this
    }

    setDOMContent(container: HTMLDivElement) {
      this.container = container
      document.body.appendChild(container)
      return this
    }

    addTo() {
      return this
    }

    remove() {
      this.container?.remove()
      this.container = null
    }
  }

  class MockLngLatBounds {
    extend() {
      return this
    }
  }

  return {
    mockMap,
    MockMarker,
    MockPopup,
    MockLngLatBounds
  }
})

vi.mock('maplibre-gl', () => ({
  default: {
    Marker: MockMarker,
    Popup: MockPopup,
    LngLatBounds: MockLngLatBounds
  }
}))

vi.mock('../common/BaseMap', () => ({
  default: ({ onLoad }: { onLoad?: (map: typeof mockMap) => void }) => {
    useEffect(() => {
      onLoad?.(mockMap)
    }, [onLoad])

    return <div>base-map</div>
  }
}))

describe('RouteMap', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  it('renders a navigation button in the selected stop popup and opens Google Maps directions', async () => {
    const store = createTestStore({
      reducer: {
        geolocation: geoSlice.reducer as unknown as Reducer<unknown, UnknownAction>
      },
      preloadedState: {
        geolocation: {
          coords: [25.033, 121.5654],
          isLocating: false,
          error: null
        }
      }
    })

    renderWithStore(
      <RouteMap
        onSelectStop={vi.fn()}
        onSelectVehicle={vi.fn()}
        selectedStop="stop-1"
        stops={[{
          id: 'stop-1',
          name: '市政府',
          position: [121.55, 25.03],
          sequence: 1
        }]}
        vehicles={[]}
      />,
      { store }
    )

    const navigationButton = await screen.findByRole('button', { name: /導航至\s*市政府/ })

    fireEvent.click(navigationButton)

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        'https://www.google.com/maps/dir/?api=1&destination=25.03%2C121.55&origin=25.033%2C121.5654',
        '_blank',
        'noopener,noreferrer'
      )
    })
  })
})
