import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { busApi } from '~/modules/apis/bus'
import { getSearchMessages } from '~/modules/consts/pageMessages'
import { AreaType } from '~/modules/enums/AreaType'
import type { AppLocaleType } from '~/modules/enums/AppLocaleType'
import type { BusRoute } from '~/modules/interfaces/BusRoute'
import { useLocalizedTextCollator } from '~/modules/hooks/useLocalizedTextCollator'
import {
  RouteSearchAnalyticsSource,
  useRouteSearchAnalytics,
  type RouteSearchAnalyticsRoute
} from '~/modules/hooks/useRouteSearchAnalytics'
import { selectLocale } from '~/modules/slices/localeSlice'
import { setKeyword, setSelectedArea } from '~/modules/slices/routeSearchSlice'
import type { AppDispatch, RootState } from '~/modules/store'
import { getAreaByCoords } from '~/modules/utils/geo/getAreaByCoords'
import { getLocalizedText } from '~/modules/utils/i18n/getLocalizedText'
import { normalizeBusRoutesWithDates } from '~/modules/utils/route/normalizeBusRoutesWithDates'
import { normalizeRouteSearchText } from '~/modules/utils/routes/normalizeRouteSearchText'
import { loadRouteSearchRecentFromStorage } from '~/modules/utils/routes/routeSearchRecentStorage'

type SearchableRoute = {
  route: BusRoute<Date | null>
  routeName: string
  normalizedRouteName: string
  normalizedDeparture: string
  normalizedDestination: string
}

type DisplayRoute = {
  to: string
} & RouteSearchAnalyticsRoute

type RoutesMessage = ReturnType<typeof getSearchMessages>['emptyRoutes'] | null

function deduplicateRoutes(routes: BusRoute<Date | null>[]) {
  return Array.from(
    routes.reduce<Map<string, BusRoute<Date | null>>>((result, route) => {
      if (!result.has(route.RouteUID)) {
        result.set(route.RouteUID, route)
      }

      return result
    }, new Map()).values()
  )
}

function getSearchableRoutes(routes: BusRoute<Date | null>[], locale: AppLocaleType) {
  return deduplicateRoutes(routes).map((route) => {
    const routeName = getLocalizedText(route.RouteName, locale)

    return {
      route,
      routeName,
      normalizedRouteName: normalizeRouteSearchText(routeName),
      normalizedDeparture: normalizeRouteSearchText(
        getLocalizedText(route.DepartureStopName, locale)
      ),
      normalizedDestination: normalizeRouteSearchText(
        getLocalizedText(route.DestinationStopName, locale)
      )
    }
  })
}

function getRouteKeywordMatchPriority(route: SearchableRoute, keyword: string) {
  if (!keyword) return 0

  if (route.normalizedRouteName === keyword) {
    return 0
  }

  if (route.normalizedRouteName.startsWith(keyword)) {
    return 1
  }

  if (route.normalizedRouteName.includes(keyword)) {
    return 2
  }

  if (route.normalizedDeparture.includes(keyword) || route.normalizedDestination.includes(keyword)) {
    return 3
  }

  return null
}

function compareSearchableRoutesByRecentAndName(
  left: SearchableRoute,
  right: SearchableRoute,
  recentRouteIndexMap: Map<string, number>,
  compareRouteNames: (left: string, right: string) => number
) {
  const leftRecentIndex = recentRouteIndexMap.get(left.route.RouteUID)
  const rightRecentIndex = recentRouteIndexMap.get(right.route.RouteUID)
  if (leftRecentIndex != null || rightRecentIndex != null) {
    const recentIndexDiff =
      (leftRecentIndex ?? Number.POSITIVE_INFINITY) -
      (rightRecentIndex ?? Number.POSITIVE_INFINITY)
    if (recentIndexDiff !== 0) {
      return recentIndexDiff
    }
  }

  const routeNameCompare = compareRouteNames(left.routeName, right.routeName)

  if (routeNameCompare !== 0) {
    return routeNameCompare
  }

  return left.route.RouteUID.localeCompare(right.route.RouteUID)
}

function getFilteredRoutes(
  routes: SearchableRoute[],
  keyword: string,
  recentRouteIndexMap: Map<string, number>,
  compareRouteNames: (left: string, right: string) => number
) {
  return routes
    .flatMap((route) => {
      const matchPriority = getRouteKeywordMatchPriority(route, keyword)

      return matchPriority == null ? [] : [{
        ...route,
        matchPriority
      }]
    })
    .sort((left, right) => {
      const matchPriorityDiff = left.matchPriority - right.matchPriority

      if (matchPriorityDiff !== 0) {
        return matchPriorityDiff
      }

      return compareSearchableRoutesByRecentAndName(
        left,
        right,
        recentRouteIndexMap,
        compareRouteNames
      )
    })
    .map(({ route }) => route)
}

function getRecentRoutes(
  routes: SearchableRoute[],
  recentRouteIndexMap: Map<string, number>,
  compareRouteNames: (left: string, right: string) => number
) {
  return routes
    .filter((route) => recentRouteIndexMap.has(route.route.RouteUID))
    .sort((left, right) => {
      return compareSearchableRoutesByRecentAndName(
        left,
        right,
        recentRouteIndexMap,
        compareRouteNames
      )
    })
    .map(({ route }) => route)
    .slice(0, 10)
}

function toDisplayRoute(
  route: BusRoute<Date | null>,
  locale: AppLocaleType,
  analyticsSource: RouteSearchAnalyticsSource
): DisplayRoute {
  return {
    routeUID: route.RouteUID,
    city: route.City,
    to: `/routes/${route.City}/${route.RouteUID}`,
    name: getLocalizedText(route.RouteName, locale),
    departure: getLocalizedText(route.DepartureStopName, locale),
    destination: getLocalizedText(route.DestinationStopName, locale),
    analyticsSource
  }
}

function getRoutesMessage({
  error,
  filteredRoutesLength,
  isLoading,
  normalizedKeyword,
  recentRoutesLength,
  t
}: {
  error: unknown
  filteredRoutesLength: number
  isLoading: boolean
  normalizedKeyword: string
  recentRoutesLength: number
  t: ReturnType<typeof useTranslation>['t']
}): RoutesMessage {
  if (isLoading) return null
  if (error) return getSearchMessages(t).loadRoutesError
  if (!normalizedKeyword && recentRoutesLength === 0) return getSearchMessages(t).emptyRouteSearch
  if (normalizedKeyword && filteredRoutesLength === 0) return getSearchMessages(t).emptyRoutes

  return null
}

function useResetRoutesScroll(
  scrollViewportRef: RefObject<HTMLDivElement | null>,
  area: AreaType,
  keyword: string
) {
  const previousSearchContextRef = useRef<{ area: AreaType, keyword: string } | null>(null)

  useEffect(() => {
    const previousSearchContext = previousSearchContextRef.current
    previousSearchContextRef.current = {
      area,
      keyword
    }

    if (
      !previousSearchContext ||
      (
        previousSearchContext.area === area &&
        previousSearchContext.keyword === keyword
      )
    ) {
      return
    }

    scrollViewportRef.current?.scrollTo({
      top: 0
    })
  }, [area, keyword, scrollViewportRef])
}

export function useRoutesData() {
  const dispatch = useDispatch<AppDispatch>()
  const { t } = useTranslation()
  const locale = useSelector(selectLocale)
  const { coords } = useSelector((state: RootState) => state.geolocation)
  const geojson = useSelector((state: RootState) => state.cityGeo.geojson)
  const { keyword, selectedArea } = useSelector((state: RootState) => state.routeSearch)
  const currentArea = getAreaByCoords(coords, geojson)
  const area = selectedArea ?? currentArea ?? AreaType.TAIPEI
  const { data: routeData = [], isLoading, error } = busApi.useGetRoutesByAreaQuery(area)
  const routes = useMemo(() => normalizeBusRoutesWithDates(routeData), [routeData])
  const routeNameCollator = useLocalizedTextCollator()
  const recentRouteUIDs = useMemo(() => loadRouteSearchRecentFromStorage(), [])
  const recentRouteIndexMap = useMemo(
    () => new Map(recentRouteUIDs.map((routeUID, index) => [routeUID, index])),
    [recentRouteUIDs]
  )
  const normalizedKeyword = normalizeRouteSearchText(keyword)
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const searchableRoutes = useMemo(() => getSearchableRoutes(routes, locale), [locale, routes])
  const compareRouteNames = routeNameCollator.compare

  const filteredRoutes = useMemo(() => {
    if (!normalizedKeyword) {
      return [] as BusRoute<Date | null>[]
    }

    return getFilteredRoutes(
      searchableRoutes,
      normalizedKeyword,
      recentRouteIndexMap,
      compareRouteNames
    )
  }, [compareRouteNames, normalizedKeyword, recentRouteIndexMap, searchableRoutes])

  const recentRoutes = useMemo(() => {
    if (normalizedKeyword) {
      return [] as BusRoute<Date | null>[]
    }

    return getRecentRoutes(searchableRoutes, recentRouteIndexMap, compareRouteNames)
  }, [compareRouteNames, normalizedKeyword, recentRouteIndexMap, searchableRoutes])

  const message = useMemo(() => {
    return getRoutesMessage({
      error,
      filteredRoutesLength: filteredRoutes.length,
      isLoading,
      normalizedKeyword,
      recentRoutesLength: recentRoutes.length,
      t
    })
  }, [error, filteredRoutes.length, isLoading, normalizedKeyword, recentRoutes.length, t])

  const displayedRoutes = useMemo(() => {
    const routesToDisplay = normalizedKeyword ? filteredRoutes : recentRoutes
    const analyticsSource = normalizedKeyword
      ? RouteSearchAnalyticsSource.SEARCH_RESULT
      : RouteSearchAnalyticsSource.RECENT_ROUTE

    return routesToDisplay.map((route) => toDisplayRoute(route, locale, analyticsSource))
  }, [filteredRoutes, locale, normalizedKeyword, recentRoutes])

  const { trackRouteSelected } = useRouteSearchAnalytics({
    area,
    isLoading,
    keyword,
    locale,
    normalizedKeyword,
    resultCount: filteredRoutes.length
  })

  useResetRoutesScroll(scrollViewportRef, area, keyword)

  return {
    area,
    displayedRoutes,
    isLoading,
    keyword,
    message,
    scrollViewportRef,
    showRecentRoutesTitle: !message && !normalizedKeyword && recentRoutes.length > 0,
    setArea: (nextArea: AreaType) => dispatch(setSelectedArea(nextArea)),
    setKeyword: (nextKeyword: string) => dispatch(setKeyword(nextKeyword)),
    trackRouteSelected
  }
}
