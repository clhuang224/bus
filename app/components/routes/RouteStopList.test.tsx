// @vitest-environment jsdom

import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_APP_LOCALE } from '~/modules/consts/i18n'
import { CityNameType } from '~/modules/enums/CityNameType'
import { DirectionType } from '~/modules/enums/DirectionType'
import i18n from '~/modules/i18n'
import type { RouteRealtimeBusStatus } from '~/modules/interfaces/RouteRealtimeBusStatus'
import { renderWithMantine } from '~/test/render'
import { RouteStopList } from './RouteStopList'

const t = i18n.getFixedT(DEFAULT_APP_LOCALE)

const favoriteRouteStop = {
  favoriteId: 'favorite-1',
  city: CityNameType.TAIPEI,
  routeUID: 'route-1',
  routeName: { 'zh-TW': '藍1', en: 'Blue 1' },
  subRouteUID: 'subroute-1',
  subRouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
  direction: DirectionType.GO,
  stopUID: 'stop-1',
  stopID: 'stop-1',
  stationID: 'station-1',
  stationKey: 'station-1',
  stopName: { 'zh-TW': '市政府', en: 'City Hall' },
  stopSequence: 1,
  departure: { 'zh-TW': '市政府', en: 'City Hall' },
  destination: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' }
}

const realtimeBus: RouteRealtimeBusStatus = {
  direction: DirectionType.GO,
  estimateLabel: t('routePage.realtime.minutesAway', { count: 4 }),
  estimateMinutes: 4,
  id: 'bus-1',
  plateNumb: 'ABC-123',
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

    fireEvent.click(screen.getByLabelText(i18n.t('components.routeStopList.addFavoriteAriaLabel')))

    expect(handleToggleFavorite).toHaveBeenCalledWith(favoriteRouteStop)
    expect(handleSelectStop).not.toHaveBeenCalled()
  })

  it('renders estimated arrival text for a stop', () => {
    const estimateLabel = t('routePage.realtime.minutesAway', { count: 4 })

    renderWithMantine(
      <RouteStopList
        stops={[{
          estimatedArrivalLabel: estimateLabel,
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

    expect(screen.getByText(estimateLabel)).toBeInTheDocument()
  })

  it('renders realtime bus plate badges without replacing stop ETA text', () => {
    const estimateLabel = t('routePage.realtime.minutesAway', { count: 6 })

    renderWithMantine(
      <RouteStopList
        stops={[{
          estimatedArrivalLabel: estimateLabel,
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
    expect(screen.getByText(estimateLabel)).toBeInTheDocument()
  })
})
