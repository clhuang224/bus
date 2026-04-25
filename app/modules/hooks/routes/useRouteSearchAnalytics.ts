import { useCallback, useEffect, useRef } from 'react'
import type { AppLocaleType } from '~/modules/enums/AppLocaleType'
import type { AreaType } from '~/modules/enums/AreaType'
import type { CityNameType } from '~/modules/enums/CityNameType'
import { trackGoogleAnalyticsEvent } from '~/modules/utils/shared/googleAnalytics'

export enum RouteSearchAnalyticsSource {
  RECENT_ROUTE = 'recent_route',
  SEARCH_RESULT = 'search_result'
}

export interface RouteSearchAnalyticsRoute {
  routeUID: string
  city: CityNameType
  name: string
  departure: string
  destination: string
  analyticsSource: RouteSearchAnalyticsSource
}

interface UseRouteSearchAnalyticsOptions {
  area: AreaType
  isLoading: boolean
  keyword: string
  locale: AppLocaleType
  normalizedKeyword: string
  resultCount: number
}

export function useRouteSearchAnalytics({
  area,
  isLoading,
  keyword,
  locale,
  normalizedKeyword,
  resultCount
}: UseRouteSearchAnalyticsOptions) {
  const previousTrackedSearchRef = useRef<string | null>(null)

  useEffect(() => {
    if (!normalizedKeyword) {
      previousTrackedSearchRef.current = null
      return
    }

    if (isLoading) return

    const trackingKey = `${area}:${normalizedKeyword}:${resultCount}:${locale}`
    if (previousTrackedSearchRef.current === trackingKey) return
    previousTrackedSearchRef.current = trackingKey

    trackGoogleAnalyticsEvent('route_search', {
      area,
      locale,
      normalized_search_term: normalizedKeyword,
      result_count: resultCount,
      search_term: keyword
    })
  }, [area, isLoading, keyword, locale, normalizedKeyword, resultCount])

  const trackRouteSelected = useCallback((route: RouteSearchAnalyticsRoute) => {
    trackGoogleAnalyticsEvent('select_route', {
      area,
      city: route.city,
      departure: route.departure,
      destination: route.destination,
      locale,
      route_name: route.name,
      route_uid: route.routeUID,
      search_term: keyword,
      source: route.analyticsSource
    })
  }, [area, keyword, locale])

  return {
    trackRouteSelected
  }
}
