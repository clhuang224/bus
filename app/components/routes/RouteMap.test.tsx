// @vitest-environment jsdom

import { useEffect } from 'react'
import { fireEvent, screen } from '@testing-library/react'
import type { Reducer, UnknownAction } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import geoSlice from '~/modules/slices/geoSlice'
import { createTestStore } from '~/test/createTestStore'
import { renderWithStore } from '~/test/render'
import { RouteMap } from './RouteMap'

const mockFlyTo = vi.fn()

vi.mock('../common/BaseMap', () => ({
  default: ({
    onLoad
  }: {
    onLoad?: (map: {
      addLayer: () => void
      addSource: () => void
      fitBounds: () => void
      flyTo: typeof mockFlyTo
      getLayer: () => null
      getSource: () => null
      isStyleLoaded: () => boolean
      off: () => void
      once: () => void
      removeLayer: () => void
      removeSource: () => void
    }) => void
  }) => {
    useEffect(() => {
      onLoad?.({
        addLayer: () => {},
        addSource: () => {},
        fitBounds: () => {},
        flyTo: mockFlyTo,
        getLayer: () => null,
        getSource: () => null,
        isStyleLoaded: () => true,
        once: () => {},
        off: () => {},
        removeLayer: () => {},
        removeSource: () => {}
      })
    }, [onLoad])

    return <div data-testid="base-map" />
  }
}))

type RouteMapTestState = {
  geolocation: {
    coords: [number, number] | null
  }
}

function renderRouteMap(coords: [number, number] | null) {
  const store = createTestStore<RouteMapTestState>({
    reducer: {
      geolocation: geoSlice.reducer as unknown as Reducer<unknown, UnknownAction>
    },
    preloadedState: {
      geolocation: {
        coords
      }
    }
  })

  return renderWithStore(
    <RouteMap
      onSelectStop={() => {}}
      onSelectVehicle={() => {}}
      selectedStop={null}
      stops={[]}
    />,
    { store }
  )
}

describe('RouteMap', () => {
  beforeEach(() => {
    mockFlyTo.mockReset()
  })

  it('disables the focus-my-location control when user coordinates are unavailable', () => {
    renderRouteMap(null)

    expect(
      screen.getByRole('button', { name: '定位到我的位置' })
    ).toBeDisabled()
  })

  it('focuses the map on the user location when the control is clicked', () => {
    renderRouteMap([25.033, 121.5654])

    fireEvent.click(screen.getByRole('button', { name: '定位到我的位置' }))

    expect(mockFlyTo).toHaveBeenCalledWith({
      center: [121.5654, 25.033],
      zoom: 16,
      duration: 800
    })
  })
})
