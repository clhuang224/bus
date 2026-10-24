// @vitest-environment jsdom

import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestStore } from '~/test/createTestStore'
import { renderWithStore } from '~/test/render'
import { NearbyStationMap } from './NearbyStationMap'

const { createdMarkers, mockMap, MockMarker, MockPopup } = vi.hoisted(() => {
  const createdMarkers: HTMLElement[] = []
  const mockMap = {
    flyTo: vi.fn(),
  }

  class MockMarker {
    private lngLat: [number, number] = [0, 0]
    private element: HTMLElement

    constructor({ element }: { element: HTMLElement }) {
      this.element = element
      createdMarkers.push(element)
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
    private element = document.createElement('div')

    getElement() {
      return this.element
    }

    setLngLat() {
      return this
    }

    setDOMContent() {
      return this
    }

    setText() {
      return this
    }

    addTo() {
      return this
    }

    remove() {}
  }

  return { createdMarkers, mockMap, MockMarker, MockPopup }
})

vi.mock('maplibre-gl', () => ({
  Marker: MockMarker,
  Popup: MockPopup,
  default: {
    Marker: MockMarker,
    Popup: MockPopup,
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

const stationMarkers = [
  {
    id: 'station-1',
    position: [121.5654, 25.033] as [number, number],
    label: '市政府',
  },
]

const renderNearbyStationMap = () => {
  const store = createTestStore()
  const view = renderWithStore(
    <NearbyStationMap
      center={[25.033, 121.5654]}
      markers={stationMarkers}
      selectedStation="station-1"
      onSelectStation={vi.fn()}
    />,
    { store },
  )

  const rerender = (markers = stationMarkers) =>
    view.rerender(
      <NearbyStationMap
        center={[25.033, 121.5654]}
        markers={markers}
        selectedStation="station-1"
        onSelectStation={vi.fn()}
      />,
    )

  return { rerender }
}

describe('NearbyStationMap', () => {
  beforeEach(() => {
    createdMarkers.length = 0
    mockMap.flyTo.mockReset()
  })

  it('keeps its markers when the page re-renders with a new select handler', () => {
    const { rerender } = renderNearbyStationMap()
    const markerCountAfterMount = createdMarkers.length

    rerender()

    expect(markerCountAfterMount).toBe(stationMarkers.length)
    expect(createdMarkers).toHaveLength(markerCountAfterMount)
  })

  it('flies to the selected stop once, even when the markers refresh', () => {
    const { rerender } = renderNearbyStationMap()

    rerender([...stationMarkers])

    expect(mockMap.flyTo).toHaveBeenCalledTimes(1)
  })
})
