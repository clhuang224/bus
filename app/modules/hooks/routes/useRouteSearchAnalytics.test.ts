// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppLocaleType } from '~/modules/enums/AppLocaleType'
import { AreaType } from '~/modules/enums/AreaType'
import { CityNameType } from '~/modules/enums/CityNameType'
import {
  RouteSearchAnalyticsSource,
  useRouteSearchAnalytics
} from './useRouteSearchAnalytics'

const { mockTrackGoogleAnalyticsEvent } = vi.hoisted(() => ({
  mockTrackGoogleAnalyticsEvent: vi.fn()
}))

vi.mock('~/modules/utils/shared/googleAnalytics', () => ({
  trackGoogleAnalyticsEvent: mockTrackGoogleAnalyticsEvent
}))

const defaultOptions = {
  area: AreaType.TAIPEI,
  isLoading: false,
  keyword: '　藍－１０　',
  locale: AppLocaleType.ZH_TW,
  normalizedKeyword: '藍10',
  resultCount: 1
}

describe('useRouteSearchAnalytics', () => {
  beforeEach(() => {
    mockTrackGoogleAnalyticsEvent.mockReset()
  })

  it('tracks route searches with the search term and result count', () => {
    renderHook(() => useRouteSearchAnalytics(defaultOptions))

    expect(mockTrackGoogleAnalyticsEvent).toHaveBeenCalledWith('route_search', {
      area: AreaType.TAIPEI,
      locale: AppLocaleType.ZH_TW,
      normalized_search_term: '藍10',
      result_count: 1,
      search_term: '　藍－１０　'
    })
  })

  it('does not track empty keywords or loading search results', () => {
    const { rerender } = renderHook(
      (options: typeof defaultOptions) => useRouteSearchAnalytics(options),
      {
        initialProps: {
          ...defaultOptions,
          normalizedKeyword: ''
        }
      }
    )

    expect(mockTrackGoogleAnalyticsEvent).not.toHaveBeenCalled()

    rerender({
      ...defaultOptions,
      isLoading: true
    })

    expect(mockTrackGoogleAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('does not track the same completed search twice', () => {
    const { rerender } = renderHook(
      (options: typeof defaultOptions) => useRouteSearchAnalytics(options),
      {
        initialProps: defaultOptions
      }
    )

    rerender(defaultOptions)

    expect(mockTrackGoogleAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  it('tracks the same completed search again after the keyword is cleared', () => {
    const { rerender } = renderHook(
      (options: typeof defaultOptions) => useRouteSearchAnalytics(options),
      {
        initialProps: defaultOptions
      }
    )

    rerender({
      ...defaultOptions,
      keyword: '',
      normalizedKeyword: ''
    })
    rerender(defaultOptions)

    expect(mockTrackGoogleAnalyticsEvent).toHaveBeenCalledTimes(2)
  })

  it('tracks the selected route with route metadata', () => {
    const { result } = renderHook(() => useRouteSearchAnalytics({
      ...defaultOptions,
      keyword: '紅25',
      normalizedKeyword: '紅25'
    }))
    mockTrackGoogleAnalyticsEvent.mockClear()

    act(() => {
      result.current.trackRouteSelected({
        analyticsSource: RouteSearchAnalyticsSource.SEARCH_RESULT,
        city: CityNameType.TAIPEI,
        departure: '台北車站',
        destination: '北門',
        name: '紅25',
        routeUID: 'route-2'
      })
    })

    expect(mockTrackGoogleAnalyticsEvent).toHaveBeenCalledWith('select_route', {
      area: AreaType.TAIPEI,
      city: CityNameType.TAIPEI,
      departure: '台北車站',
      destination: '北門',
      locale: AppLocaleType.ZH_TW,
      route_name: '紅25',
      route_uid: 'route-2',
      search_term: '紅25',
      source: 'search_result'
    })
  })
})
