// @vitest-environment jsdom

import type { Reducer, UnknownAction } from '@reduxjs/toolkit'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { getFavoriteMessages } from '~/modules/consts/pageMessages'
import { AppLocaleType } from '~/modules/enums/AppLocaleType'
import { DirectionType } from '~/modules/enums/DirectionType'
import { CityNameType } from '~/modules/enums/CityNameType'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'
import i18n from '~/modules/i18n'
import favoriteSlice from '~/modules/slices/favoriteSlice'
import { createTestStore } from '~/test/createTestStore'
import { renderWithProvidersAndRouter } from '~/test/render'
import Favorite from './Favorite'

const favoriteTerminalOriginLabel = `${i18n.t('components.favoriteRouteStopCard.departureLabel')}: 市政府`

const favoriteRouteStops: FavoriteRouteStop[] = [
  {
    favoriteId: 'route-1-subroute-1-0-station-1',
    city: CityNameType.TAIPEI,
    routeUID: 'route-1',
    routeName: { zh_TW: '藍1', en: 'Blue 1' },
    subRouteUID: 'subroute-1',
    subRouteName: { zh_TW: '往捷運昆陽站', en: 'To MRT Kunyang Station' },
    direction: DirectionType.GO,
    stopUID: 'stop-1',
    stopID: 'stop-id-1',
    stationID: 'station-1',
    stationKey: 'station-1',
    stopName: { zh_TW: '市政府', en: 'City Hall' },
    stopSequence: 1,
    departure: { zh_TW: '市政府', en: 'City Hall' },
    destination: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' }
  }
]

const unsortedFavoriteRouteStops: FavoriteRouteStop[] = [
  {
    favoriteId: 'route-2-subroute-1-0-station-2',
    city: CityNameType.TAIPEI,
    routeUID: 'route-2',
    routeName: { zh_TW: '藍2', en: 'Blue 20' },
    subRouteUID: 'subroute-2-1',
    subRouteName: { zh_TW: '往市府轉運站', en: 'To City Hall Bus Station' },
    direction: DirectionType.GO,
    stopUID: 'stop-2',
    stopID: 'stop-id-2',
    stationID: 'station-2',
    stationKey: 'station-2',
    stopName: { zh_TW: '忠孝敦化', en: 'Zhongxiao Dunhua' },
    stopSequence: 2,
    departure: { zh_TW: '忠孝敦化', en: 'Zhongxiao Dunhua' },
    destination: { zh_TW: '市府轉運站', en: 'City Hall Bus Station' }
  },
  {
    favoriteId: 'route-1-subroute-2-0-station-3',
    city: CityNameType.TAIPEI,
    routeUID: 'route-1',
    routeName: { zh_TW: '藍1', en: 'Blue 1' },
    subRouteUID: 'subroute-1-2',
    subRouteName: { zh_TW: '往捷運昆陽站', en: 'To MRT Kunyang Station' },
    direction: DirectionType.GO,
    stopUID: 'stop-3',
    stopID: 'stop-id-3',
    stationID: 'station-3',
    stationKey: 'station-3',
    stopName: { zh_TW: '國父紀念館', en: 'Sun Yat-Sen Memorial Hall' },
    stopSequence: 2,
    departure: { zh_TW: '市政府', en: 'City Hall' },
    destination: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' }
  },
  {
    favoriteId: 'route-1-subroute-1-0-station-1',
    city: CityNameType.TAIPEI,
    routeUID: 'route-1',
    routeName: { zh_TW: '藍1', en: 'Blue 1' },
    subRouteUID: 'subroute-1-1',
    subRouteName: { zh_TW: '往捷運昆陽站', en: 'To MRT Kunyang Station' },
    direction: DirectionType.GO,
    stopUID: 'stop-1',
    stopID: 'stop-id-1',
    stationID: 'station-1',
    stationKey: 'station-1',
    stopName: { zh_TW: '市政府', en: 'City Hall' },
    stopSequence: 1,
    departure: { zh_TW: '市政府', en: 'City Hall' },
    destination: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' }
  }
]

type FavoriteTestState = {
  favorite: {
    routeStops: FavoriteRouteStop[]
  }
}

function renderFavoritePage(
  routeStops: FavoriteRouteStop[] = favoriteRouteStops,
  locale: AppLocaleType = AppLocaleType.ZH_TW
) {
  localStorage.setItem('favoriteRouteStops', JSON.stringify(routeStops))

  const store = createTestStore<FavoriteTestState>({
    reducer: {
      favorite: favoriteSlice.reducer as unknown as Reducer<unknown, UnknownAction>
    },
    preloadedState: {
      favorite: {
        routeStops
      },
      locale: {
        value: locale
      }
    }
  })

  return renderWithProvidersAndRouter(<Favorite />, {
    store
  })
}

function renderFavoritePageFromLocalStorage(storedRouteStops: unknown, locale: AppLocaleType = AppLocaleType.ZH_TW) {
  localStorage.setItem('favoriteRouteStops', JSON.stringify(storedRouteStops))

  const store = createTestStore<FavoriteTestState>({
    reducer: {
      favorite: favoriteSlice.reducer as unknown as Reducer<unknown, UnknownAction>
    },
    preloadedState: {
      favorite: {
        routeStops: []
      },
      locale: {
        value: locale
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

    expect(screen.getByText(getFavoriteMessages(i18n.t).emptyFavoriteRouteStops.title)).toBeInTheDocument()
  })

  it('renders favorite route stops and links back to the route page', () => {
    renderFavoritePage()

    expect(screen.getByText(/藍1/)).toBeInTheDocument()
    expect(screen.getByText('1. 市政府')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/routes/Taipei/route-1')
  })

  it('renders localized favorite route text in English mode', () => {
    renderFavoritePage(favoriteRouteStops, AppLocaleType.EN)

    expect(screen.getByText(/Blue 1/)).toBeInTheDocument()
    expect(screen.getByText('1. City Hall')).toBeInTheDocument()
    expect(screen.getByText(/City Hall.*MRT Kunyang Station/)).toBeInTheDocument()
  })

  it('renders available terminal text when only one terminal value is present', () => {
    renderFavoritePage([{
      ...favoriteRouteStops[0],
      departure: { zh_TW: '市政府', en: 'City Hall' },
      destination: { zh_TW: '', en: '' }
    }])

    expect(screen.getByText(favoriteTerminalOriginLabel)).toBeInTheDocument()
    expect(
      screen.queryByText(`${i18n.t('components.favoriteRouteStopCard.terminalLabel')}: 市政府`)
    ).not.toBeInTheDocument()
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

    fireEvent.click(
      screen.getByRole('button', { name: i18n.t('components.favoriteRouteStopCard.removeAriaLabel') })
    )

    expect(screen.getByText(getFavoriteMessages(i18n.t).emptyFavoriteRouteStops.title)).toBeInTheDocument()
  })

  it('ignores malformed favorite route stops from localStorage', () => {
    renderFavoritePageFromLocalStorage([
      {
        favoriteId: 'broken-favorite',
        routeName: { zh_TW: '藍1', en: 'Blue 1' },
        subRouteName: { zh_TW: '往捷運昆陽站', en: 'To MRT Kunyang Station' },
        stopName: { zh_TW: '市政府', en: 'City Hall' },
        departure: { zh_TW: '市政府', en: 'City Hall' },
        destination: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' }
      }
    ])

    expect(screen.getByText(getFavoriteMessages(i18n.t).emptyFavoriteRouteStops.title)).toBeInTheDocument()
  })

  it('falls back to the empty state when localStorage contains invalid JSON', () => {
    localStorage.setItem('favoriteRouteStops', '{invalid-json')

    const store = createTestStore<FavoriteTestState>({
      reducer: {
        favorite: favoriteSlice.reducer as unknown as Reducer<unknown, UnknownAction>
      },
      preloadedState: {
        favorite: {
          routeStops: []
        },
        locale: {
          value: AppLocaleType.ZH_TW
        }
      }
    })

    renderWithProvidersAndRouter(<Favorite />, {
      store
    })

    expect(screen.getByText(getFavoriteMessages(i18n.t).emptyFavoriteRouteStops.title)).toBeInTheDocument()
    expect(localStorage.getItem('favoriteRouteStops')).toBeNull()
  })
})
