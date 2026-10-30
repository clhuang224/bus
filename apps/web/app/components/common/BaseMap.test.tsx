// @vitest-environment jsdom

import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppLocaleType } from '@bus/shared'
import i18n from '~/modules/i18n'
import geoSlice from '~/modules/slices/geoSlice'
import { createTestStore } from '~/test/createTestStore'
import { renderWithStore } from '~/test/render'
import BaseMap from './BaseMap'
import { MapOverlayInsetsContext } from './mapOverlayInsetsContext'

const focusUserLocationLabel = i18n.getFixedT(AppLocaleType.ZH_TW)(
  'components.baseMap.focusUserLocationAriaLabel',
)

const { mockMap, MockMap, MockMarker, MockLngLat } = vi.hoisted(() => {
  const mockMap = {
    isStyleLoaded: () => true,
    getContainer: () => document.createElement('div'),
    on: vi.fn(),
    once: vi.fn(),
    off: vi.fn(),
    remove: vi.fn(),
    flyTo: vi.fn(),
    easeTo: vi.fn(),
    setPadding: vi.fn(),
    loaded: vi.fn(() => false),
    isMoving: vi.fn(() => false),
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
      public lat: number,
    ) {}
  }

  return { mockMap, MockMap, MockMarker, MockLngLat }
})

vi.mock('maplibre-gl', () => ({
  default: {
    Map: MockMap,
  },
  Map: MockMap,
  Marker: MockMarker,
  LngLat: MockLngLat,
  setWorkerUrl: vi.fn(),
}))

describe('BaseMap', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockMap.flyTo.mockReset()
    mockMap.easeTo.mockReset()
    mockMap.setPadding.mockReset()
    mockMap.once.mockReset()
    mockMap.loaded.mockReturnValue(false)
    mockMap.isMoving.mockReturnValue(false)
  })

  it('disables the focus-my-location control when user coordinates are unavailable', () => {
    const store = createTestStore({
      reducer: {
        geolocation: geoSlice.reducer,
      },
      preloadedState: {
        geolocation: {
          ...geoSlice.getInitialState(),
          coords: null,
        },
      },
    })

    renderWithStore(<BaseMap center={[25.033, 121.5654]} showUserLocation />, {
      store,
    })

    expect(
      screen.getByRole('button', { name: focusUserLocationLabel }),
    ).toBeDisabled()
  })

  it('focuses the map on the user location when the control is clicked', () => {
    const store = createTestStore({
      reducer: {
        geolocation: geoSlice.reducer,
      },
      preloadedState: {
        geolocation: {
          ...geoSlice.getInitialState(),
          coords: [25.033, 121.5654],
        },
      },
    })

    renderWithStore(<BaseMap center={[25.033, 121.5654]} showUserLocation />, {
      store,
    })

    fireEvent.click(
      screen.getByRole('button', { name: focusUserLocationLabel }),
    )

    expect(mockMap.flyTo).toHaveBeenCalledWith({
      center: [121.5654, 25.033],
      zoom: 16,
      duration: 800,
    })
  })

  it('waits for the current camera movement to end before padding the map for overlays', () => {
    const store = createTestStore({
      reducer: {
        geolocation: geoSlice.reducer,
      },
    })
    mockMap.isMoving.mockReturnValue(true)

    renderWithStore(
      <MapOverlayInsetsContext.Provider value={{ top: 68, bottom: 200 }}>
        <BaseMap center={null} />
      </MapOverlayInsetsContext.Provider>,
      { store },
    )

    expect(mockMap.setPadding).not.toHaveBeenCalled()
    expect(mockMap.easeTo).not.toHaveBeenCalled()

    const applyPaddingAfterMove = mockMap.once.mock.calls.find(
      ([eventName]) => eventName === 'moveend',
    )?.[1]
    mockMap.isMoving.mockReturnValue(false)
    mockMap.loaded.mockReturnValue(true)
    applyPaddingAfterMove()

    expect(mockMap.easeTo).toHaveBeenCalledWith({
      padding: { top: 68, right: 0, bottom: 200, left: 0 },
      duration: 300,
    })
  })
})
