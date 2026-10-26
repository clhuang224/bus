// @vitest-environment jsdom

import { screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import geoSlice from '~/modules/slices/geoSlice'
import { createTestStore } from '~/test/createTestStore'
import { renderWithStore } from '~/test/render'
import { RouteMap, type RouteMapStop } from './RouteMap'

const { markerElements, mockMap, MockLngLatBounds, MockMarker, MockPopup } =
  vi.hoisted(() => {
    const markerElements: HTMLElement[] = []
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
      flyTo: vi.fn(),
      on: vi.fn(),
      project: vi.fn(([longitude, latitude]: [number, number]) => ({
        x: longitude * 10_000,
        y: latitude * 10_000,
      })),
    }

    class MockMarker {
      private lngLat: [number, number] = [0, 0]
      private element: HTMLElement

      constructor({ element }: { element: HTMLElement }) {
        this.element = element
        markerElements.push(element)
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
      private element = document.createElement('div')

      getElement() {
        return this.element
      }

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
      markerElements,
      mockMap,
      MockMarker,
      MockPopup,
      MockLngLatBounds,
    }
  })

vi.mock('maplibre-gl', () => ({
  Marker: MockMarker,
  Popup: MockPopup,
  LngLatBounds: MockLngLatBounds,
  default: {
    Marker: MockMarker,
    Popup: MockPopup,
    LngLatBounds: MockLngLatBounds,
  },
}))

vi.mock('../common/BaseMap', () => ({
  default: ({ onLoad }: { onLoad?: (map: typeof mockMap) => void }) => {
    useEffect(() => {
      onLoad?.(mockMap)
    }, [onLoad])

    return <div>base-map</div>
  },
}))

const createGeolocationStore = () =>
  createTestStore({
    reducer: {
      geolocation: geoSlice.reducer,
    },
    preloadedState: {
      geolocation: {
        ...geoSlice.getInitialState(),
        coords: [25.033, 121.5654],
        error: null,
      },
    },
  })

const findMarkerElement = (labelText: string) =>
  [...markerElements]
    .reverse()
    .find((element) => element.getAttribute('aria-label')?.includes(labelText))

const stop = {
  id: 'stop-1',
  name: '市政府',
  position: [121.55, 25.03] as [number, number],
  sequence: 1,
}

const vehicle = {
  id: 'vehicle-1',
  estimateLabel: '3 分',
  plateNumb: 'EAL-2082',
  position: [121.551, 25.031] as [number, number],
  stopName: '市政府',
}

describe('RouteMap', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    markerElements.length = 0
  })

  it('hides stop markers that would overlap, keeping both terminals', async () => {
    const crowdedStops = [
      { id: 'first', name: '起站', position: [121.55, 25.03], sequence: 1 },
      {
        id: 'crowded',
        name: '擠在一起',
        position: [121.5501, 25.03],
        sequence: 2,
      },
      { id: 'last', name: '終站', position: [121.56, 25.03], sequence: 3 },
    ] satisfies RouteMapStop[]

    renderWithStore(
      <RouteMap
        onSelectStop={vi.fn()}
        onSelectVehicle={vi.fn()}
        selectedStop={null}
        stops={crowdedStops}
        vehicles={[]}
      />,
      { store: createGeolocationStore() },
    )

    await waitFor(() => {
      expect(findMarkerElement('終站')).toBeDefined()
    })

    expect(findMarkerElement('起站')?.style.display).toBe('')
    expect(findMarkerElement('擠在一起')?.style.display).toBe('none')
    expect(findMarkerElement('終站')?.style.display).toBe('')
    expect(mockMap.on).toHaveBeenCalledWith('zoomend', expect.any(Function))
  })

  it('clears the selected stop when its marker is clicked again', async () => {
    const onSelectStop = vi.fn()

    renderWithStore(
      <RouteMap
        onSelectStop={onSelectStop}
        onSelectVehicle={vi.fn()}
        selectedStop="stop-1"
        stops={[stop]}
        vehicles={[]}
      />,
      { store: createGeolocationStore() },
    )

    await waitFor(() => {
      expect(findMarkerElement(stop.name)).toBeDefined()
    })
    findMarkerElement(stop.name)?.click()

    expect(onSelectStop).toHaveBeenCalledWith(null)
  })

  it('selects a stop when an unselected stop marker is clicked', async () => {
    const onSelectStop = vi.fn()

    renderWithStore(
      <RouteMap
        onSelectStop={onSelectStop}
        onSelectVehicle={vi.fn()}
        selectedStop={null}
        stops={[stop]}
        vehicles={[]}
      />,
      { store: createGeolocationStore() },
    )

    await waitFor(() => {
      expect(findMarkerElement(stop.name)).toBeDefined()
    })
    findMarkerElement(stop.name)?.click()

    expect(onSelectStop).toHaveBeenCalledWith(stop.id)
  })

  it('clears the selected vehicle when its marker is clicked again', async () => {
    const onSelectVehicle = vi.fn()

    renderWithStore(
      <RouteMap
        onSelectStop={vi.fn()}
        onSelectVehicle={onSelectVehicle}
        selectedStop={null}
        selectedVehicleId={vehicle.id}
        stops={[stop]}
        vehicles={[vehicle]}
      />,
      { store: createGeolocationStore() },
    )

    await waitFor(() => {
      expect(findMarkerElement(vehicle.plateNumb)).toBeDefined()
    })
    findMarkerElement(vehicle.plateNumb)?.click()

    expect(onSelectVehicle).toHaveBeenCalledWith(null)
    expect(mockMap.flyTo).not.toHaveBeenCalledWith(
      expect.objectContaining({ center: vehicle.position }),
    )
  })

  it('renders only the stop name in the selected stop popup', async () => {
    const store = createTestStore({
      reducer: {
        geolocation: geoSlice.reducer,
      },
      preloadedState: {
        geolocation: {
          ...geoSlice.getInitialState(),
          coords: [25.033, 121.5654],
          error: null,
        },
      },
    })

    renderWithStore(
      <RouteMap
        onSelectStop={vi.fn()}
        onSelectVehicle={vi.fn()}
        selectedStop="stop-1"
        stops={[
          {
            id: 'stop-1',
            name: '市政府',
            position: [121.55, 25.03],
            sequence: 1,
          },
        ]}
        vehicles={[]}
      />,
      { store },
    )

    expect(await screen.findByText('市政府')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows the navigation button in the selected stop popup on small screens', async () => {
    const store = createTestStore({
      reducer: {
        geolocation: geoSlice.reducer,
      },
      preloadedState: {
        geolocation: {
          ...geoSlice.getInitialState(),
          coords: [25.033, 121.5654],
          error: null,
        },
      },
    })

    renderWithStore(
      <RouteMap
        isSm
        onSelectStop={vi.fn()}
        onSelectVehicle={vi.fn()}
        selectedStop="stop-1"
        selectedStopEstimatedArrivalLabel="3 分鐘"
        stops={[
          {
            id: 'stop-1',
            name: '市政府',
            position: [121.55, 25.03],
            sequence: 1,
          },
        ]}
        vehicles={[]}
      />,
      { store },
    )

    expect(await screen.findByText('市政府')).toBeInTheDocument()
    expect(screen.getByText('3 分鐘')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /導航至\s*市政府/ }),
    ).toBeInTheDocument()
  })

  it('fits the initial bounds again when the route changes', async () => {
    const store = createTestStore({
      reducer: {
        geolocation: geoSlice.reducer,
      },
      preloadedState: {
        geolocation: {
          ...geoSlice.getInitialState(),
          coords: [25.033, 121.5654],
          error: null,
        },
      },
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
            sequence: 1,
          },
        ]}
        vehicles={[]}
      />,
      { store },
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
          [121.56, 25.04],
        ]}
        stops={[
          {
            id: 'stop-1',
            name: '市政府',
            position: [121.55, 25.03],
            sequence: 1,
          },
        ]}
        vehicles={[]}
      />,
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
            sequence: 1,
          },
        ]}
        vehicles={[]}
      />,
    )

    await waitFor(() => {
      expect(mockMap.fitBounds).toHaveBeenCalledTimes(2)
    })
  })
})
