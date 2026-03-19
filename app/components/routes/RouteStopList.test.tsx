// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { MantineProvider } from '@mantine/core'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CityNameType } from '~/modules/enums/CityNameType'
import { DirectionType } from '~/modules/enums/DirectionType'
import { RouteStopList } from './RouteStopList'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

const favoriteRouteStop = {
  favoriteId: 'favorite-1',
  city: CityNameType.TAIPEI,
  routeUID: 'route-1',
  routeName: '藍1',
  subRouteUID: 'subroute-1',
  subRouteName: '藍1',
  direction: DirectionType.GO,
  stopUID: 'stop-1',
  stopID: 'stop-1',
  stationID: 'station-1',
  stationKey: 'station-1',
  stopName: '市政府',
  stopSequence: 1,
  departure: '市政府',
  destination: '捷運昆陽站'
}

describe('RouteStopList', () => {
  afterEach(() => {
    cleanup()
  })

  it('selects a stop when the stop row is clicked', () => {
    const handleSelectStop = vi.fn()
    const handleToggleFavorite = vi.fn()

    render(
      <MantineProvider>
        <RouteStopList
          stops={[{
            id: 'stop-1',
            favoriteRouteStop,
            name: '市政府',
            sequence: 1,
            isFavorite: false
          }]}
          onSelectStop={handleSelectStop}
          onToggleFavorite={handleToggleFavorite}
        />
      </MantineProvider>
    )

    fireEvent.click(screen.getByText('1. 市政府'))

    expect(handleSelectStop).toHaveBeenCalledWith('stop-1')
    expect(handleToggleFavorite).not.toHaveBeenCalled()
  })

  it('does not select the stop when toggling favorite', () => {
    const handleSelectStop = vi.fn()
    const handleToggleFavorite = vi.fn()

    render(
      <MantineProvider>
        <RouteStopList
          stops={[{
            id: 'stop-1',
            favoriteRouteStop,
            name: '市政府',
            sequence: 1,
            isFavorite: false
          }]}
          onSelectStop={handleSelectStop}
          onToggleFavorite={handleToggleFavorite}
        />
      </MantineProvider>
    )

    fireEvent.click(screen.getByLabelText('收藏站牌路線'))

    expect(handleToggleFavorite).toHaveBeenCalledWith(favoriteRouteStop)
    expect(handleSelectStop).not.toHaveBeenCalled()
  })
})
