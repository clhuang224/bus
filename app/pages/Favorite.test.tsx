// @vitest-environment jsdom

import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { favoriteMessages } from '~/modules/consts/pageMessages'
import { DirectionType } from '~/modules/enums/DirectionType'
import { CityNameType } from '~/modules/enums/CityNameType'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'
import favoriteSlice from '~/modules/slices/favoriteSlice'
import { renderWithProvidersAndRouter } from '~/test/render'
import Favorite from './Favorite'

const favoriteRouteStops: FavoriteRouteStop[] = [
  {
    favoriteId: 'route-1-subroute-1-0-station-1',
    city: CityNameType.TAIPEI,
    routeUID: 'route-1',
    routeName: '藍1',
    subRouteUID: 'subroute-1',
    subRouteName: '往捷運昆陽站',
    direction: DirectionType.GO,
    stopUID: 'stop-1',
    stopID: 'stop-id-1',
    stationID: 'station-1',
    stationKey: 'station-1',
    stopName: '市政府',
    stopSequence: 1,
    departure: '市政府',
    destination: '捷運昆陽站'
  }
]

const unsortedFavoriteRouteStops: FavoriteRouteStop[] = [
  {
    favoriteId: 'route-2-subroute-1-0-station-2',
    city: CityNameType.TAIPEI,
    routeUID: 'route-2',
    routeName: '藍2',
    subRouteUID: 'subroute-2-1',
    subRouteName: '往市府轉運站',
    direction: DirectionType.GO,
    stopUID: 'stop-2',
    stopID: 'stop-id-2',
    stationID: 'station-2',
    stationKey: 'station-2',
    stopName: '忠孝敦化',
    stopSequence: 2,
    departure: '忠孝敦化',
    destination: '市府轉運站'
  },
  {
    favoriteId: 'route-1-subroute-2-0-station-3',
    city: CityNameType.TAIPEI,
    routeUID: 'route-1',
    routeName: '藍1',
    subRouteUID: 'subroute-1-2',
    subRouteName: '往捷運昆陽站',
    direction: DirectionType.GO,
    stopUID: 'stop-3',
    stopID: 'stop-id-3',
    stationID: 'station-3',
    stationKey: 'station-3',
    stopName: '國父紀念館',
    stopSequence: 2,
    departure: '市政府',
    destination: '捷運昆陽站'
  },
  {
    favoriteId: 'route-1-subroute-1-0-station-1',
    city: CityNameType.TAIPEI,
    routeUID: 'route-1',
    routeName: '藍1',
    subRouteUID: 'subroute-1-1',
    subRouteName: '往捷運昆陽站',
    direction: DirectionType.GO,
    stopUID: 'stop-1',
    stopID: 'stop-id-1',
    stationID: 'station-1',
    stationKey: 'station-1',
    stopName: '市政府',
    stopSequence: 1,
    departure: '市政府',
    destination: '捷運昆陽站'
  }
]

function renderFavoritePage(routeStops: FavoriteRouteStop[] = favoriteRouteStops) {
  localStorage.setItem('favoriteRouteStops', JSON.stringify(routeStops))

  const store = configureStore({
    reducer: {
      favorite: favoriteSlice.reducer
    },
    preloadedState: {
      favorite: {
        routeStops
      }
    }
  })

  return renderWithProvidersAndRouter(<Favorite />, {
    store
  })
}

describe('Favorite', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows the empty state when there are no favorite route stops', () => {
    renderFavoritePage([])

    expect(screen.getByText(favoriteMessages.emptyFavoriteRouteStops.title)).toBeInTheDocument()
  })

  it('renders favorite route stops and links back to the route page', () => {
    renderFavoritePage()

    expect(screen.getByText(/藍1/)).toBeInTheDocument()
    expect(screen.getByText('1. 市政府')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/routes/Taipei/route-1')
  })

  it('sorts favorite route stops by route name and stop sequence', () => {
    renderFavoritePage(unsortedFavoriteRouteStops)

    const stopNames = screen.getAllByText((_, element) => (
      element?.tagName === 'P' && element.textContent != null && /^\d+\.\s/.test(element.textContent)
    ))

    expect(stopNames.map((element) => element.textContent)).toEqual([
      '1. 市政府',
      '2. 國父紀念館',
      '2. 忠孝敦化'
    ])
  })

  it('removes a favorite route stop from the page', () => {
    renderFavoritePage()

    fireEvent.click(screen.getByRole('button', { name: '移除收藏站牌路線' }))

    expect(screen.getByText(favoriteMessages.emptyFavoriteRouteStops.title)).toBeInTheDocument()
  })
})
