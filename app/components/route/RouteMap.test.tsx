// @vitest-environment jsdom

import { screen, waitFor } from '@testing-library/react'
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
  })

  it('renders only the stop name in the selected stop popup', async () => {
    const store = createTestStore({
      reducer: {
        geolocation: geoSlice.reducer
      },
      preloadedState: {
        geolocation: {
          ...geoSlice.getInitialState(),
          coords: [25.033, 121.5654],
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

    expect(await screen.findByText('市政府')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows the navigation button in the selected stop popup on small screens', async () => {
    const store = createTestStore({
      reducer: {
        geolocation: geoSlice.reducer
      },
      preloadedState: {
        geolocation: {
          ...geoSlice.getInitialState(),
          coords: [25.033, 121.5654],
          error: null
        }
      }
    })

    renderWithStore(
      <RouteMap
        isSm
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

    expect(await screen.findByText('市政府')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /導航至\s*市政府/ })).toBeInTheDocument()
  })

  it('renders custom selected stop popup content when provided', async () => {
    const store = createTestStore({
      reducer: {
        geolocation: geoSlice.reducer
      },
      preloadedState: {
        geolocation: {
          ...geoSlice.getInitialState(),
          coords: [25.033, 121.5654],
          error: null
        }
      }
    })

    renderWithStore(
      <RouteMap
        isSm
        onSelectStop={vi.fn()}
        onSelectVehicle={vi.fn()}
        selectedStop="stop-1"
        selectedStopPopupContent={<div>3 分鐘</div>}
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

    expect(await screen.findByText('3 分鐘')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /導航至\s*市政府/ })).not.toBeInTheDocument()
  })

  it('fits the initial bounds again when the route changes', async () => {
    const store = createTestStore({
      reducer: {
        geolocation: geoSlice.reducer
      },
      preloadedState: {
        geolocation: {
          ...geoSlice.getInitialState(),
          coords: [25.033, 121.5654],
          error: null
        }
      }
    })

    const { rerender } = renderWithStore(
      <RouteMap
        onSelectStop={vi.fn()}
        onSelectVehicle={vi.fn()}
        selectedStop={null}
        stops={[
          {
            id: 'stop-1',
            name: '市政府',
            position: [121.55, 25.03],
            sequence: 1
          }
        ]}
        vehicles={[]}
      />,
      { store }
    )

    await waitFor(() => {
      expect(mockMap.fitBounds).toHaveBeenCalledTimes(1)
    })

    rerender(
      <RouteMap
        onSelectStop={vi.fn()}
        onSelectVehicle={vi.fn()}
        selectedStop={null}
        routePath={[
          [121.55, 25.03],
          [121.56, 25.04]
        ]}
        stops={[
          {
            id: 'stop-1',
            name: '市政府',
            position: [121.55, 25.03],
            sequence: 1
          }
        ]}
        vehicles={[]}
      />
    )

    await waitFor(() => {
      expect(mockMap.fitBounds).toHaveBeenCalledTimes(1)
    })

    rerender(
      <RouteMap
        onSelectStop={vi.fn()}
        onSelectVehicle={vi.fn()}
        selectedStop={null}
        stops={[
          {
            id: 'stop-2',
            name: '市民廣場',
            position: [121.57, 25.05],
            sequence: 1
          }
        ]}
        vehicles={[]}
      />
    )

    await waitFor(() => {
      expect(mockMap.fitBounds).toHaveBeenCalledTimes(2)
    })
  })
})
