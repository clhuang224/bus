// @vitest-environment jsdom

import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CityNameType } from '~/modules/enums/CityNameType'
import { DirectionType } from '~/modules/enums/DirectionType'
import type { RouteRealtimeBusStatus } from '~/modules/interfaces/RouteRealtimeBusStatus'
import { renderWithMantine } from '~/test/render'
import { RouteStopList } from './RouteStopList'

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

const realtimeBus: RouteRealtimeBusStatus = {
  direction: DirectionType.GO,
  estimateLabel: '4 分後到站',
  estimateMinutes: 4,
  id: 'bus-1',
  plateNumb: 'ABC-123',
  position: [121.56, 25.04],
  stopName: '市政府',
  stopSequence: 1,
  subRouteUID: 'subroute-1'
}

describe('RouteStopList', () => {
  it('selects a stop when the stop row is clicked', () => {
    const handleSelectStop = vi.fn()
    const handleToggleFavorite = vi.fn()

    renderWithMantine(
      <RouteStopList
        stops={[{
          estimatedArrivalLabel: null,
          id: 'stop-1',
          favoriteRouteStop,
          name: '市政府',
          realtimeBuses: [],
          sequence: 1,
          isFavorite: false
        }]}
        onSelectStop={handleSelectStop}
        onToggleFavorite={handleToggleFavorite}
      />
    )

    fireEvent.click(screen.getByText('市政府'))

    expect(handleSelectStop).toHaveBeenCalledWith('stop-1')
    expect(handleToggleFavorite).not.toHaveBeenCalled()
  })

  it('does not select the stop when toggling favorite', () => {
    const handleSelectStop = vi.fn()
    const handleToggleFavorite = vi.fn()

    renderWithMantine(
      <RouteStopList
        stops={[{
          estimatedArrivalLabel: null,
          id: 'stop-1',
          favoriteRouteStop,
          name: '市政府',
          realtimeBuses: [],
          sequence: 1,
          isFavorite: false
        }]}
        onSelectStop={handleSelectStop}
        onToggleFavorite={handleToggleFavorite}
      />
    )

    fireEvent.click(screen.getByLabelText('收藏站牌路線'))

    expect(handleToggleFavorite).toHaveBeenCalledWith(favoriteRouteStop)
    expect(handleSelectStop).not.toHaveBeenCalled()
  })

  it('renders estimated arrival text for a stop', () => {
    renderWithMantine(
      <RouteStopList
        stops={[{
          estimatedArrivalLabel: '4 分後到站',
          id: 'stop-1',
          favoriteRouteStop,
          name: '市政府',
          realtimeBuses: [],
          sequence: 1,
          isFavorite: false
        }]}
        onSelectStop={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    )

    expect(screen.getByText('4 分後到站')).toBeInTheDocument()
  })

  it('renders realtime bus plate badges without replacing stop ETA text', () => {
    renderWithMantine(
      <RouteStopList
        stops={[{
          estimatedArrivalLabel: '6 分後到站',
          id: 'stop-1',
          favoriteRouteStop,
          name: '市政府',
          realtimeBuses: [realtimeBus],
          sequence: 1,
          isFavorite: false
        }]}
        onSelectStop={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    )

    expect(screen.getByText('ABC-123')).toBeInTheDocument()
    expect(screen.getByText('6 分後到站')).toBeInTheDocument()
  })
})
