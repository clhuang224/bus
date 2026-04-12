import { Card, Flex, ScrollArea, Skeleton, Stack, Title } from '@mantine/core'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { AreaSelect } from '~/components/AreaSelect'
import { SearchInput } from '~/components/SearchInput'
import { BaseAlert } from '~/components/common/BaseAlert'
import { RouteInfoCard } from '~/components/routes/RouteInfoCard'
import { APP_PAGE_PADDING } from '~/modules/consts/layout'
import { AreaType } from '~/modules/enums/AreaType'
import { getSearchMessages } from '~/modules/consts/pageMessages'
import { busApi } from '~/modules/apis/bus'
import type { BusRoute } from '~/modules/interfaces/BusRoute'
import type { AppLocaleType } from '~/modules/enums/AppLocaleType'
import { useLocalizedTextCollator } from '~/modules/hooks/useLocalizedTextCollator'
import { selectLocale } from '~/modules/slices/localeSlice'
import { setKeyword, setSelectedArea } from '~/modules/slices/routeSearchSlice'
import type { AppDispatch, RootState } from '~/modules/store'
import { getAreaByCoords } from '~/modules/utils/geo/getAreaByCoords'
import { getLocalizedText } from '~/modules/utils/i18n/getLocalizedText'
import { normalizeRouteSearchText } from '~/modules/utils/routes/normalizeRouteSearchText'
import { loadRouteSearchRecentFromStorage } from '~/modules/utils/routes/routeSearchRecentStorage'
import { normalizeBusRoutesWithDates } from '~/modules/utils/route/normalizeBusRoutesWithDates'

type SearchableRoute = {
  route: BusRoute<Date | null>
  routeName: string
  normalizedRouteName: string
  normalizedDeparture: string
  normalizedDestination: string
}

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

function matchesRouteKeyword(route: SearchableRoute, keyword: string) {
  return getRouteKeywordMatchPriority(route, keyword) != null
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

export default function Routes() {
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
  const previousSearchContextRef = useRef<{ area: AreaType, keyword: string } | null>(null)
  const searchableRoutes = useMemo(() => getSearchableRoutes(routes, locale), [locale, routes])

  const filteredRoutes = useMemo(() => {
    return searchableRoutes
      .filter((route) => matchesRouteKeyword(route, normalizedKeyword))
      .sort((left, right) => {
        const leftMatchPriority = getRouteKeywordMatchPriority(left, normalizedKeyword)
        const rightMatchPriority = getRouteKeywordMatchPriority(right, normalizedKeyword)
        const matchPriorityDiff = (leftMatchPriority ?? Number.POSITIVE_INFINITY) -
          (rightMatchPriority ?? Number.POSITIVE_INFINITY)

        if (matchPriorityDiff !== 0) {
          return matchPriorityDiff
        }

        const recentIndexDiff =
          (recentRouteIndexMap.get(left.route.RouteUID) ?? Number.POSITIVE_INFINITY) -
          (recentRouteIndexMap.get(right.route.RouteUID) ?? Number.POSITIVE_INFINITY)

        if (recentIndexDiff !== 0) {
          return recentIndexDiff
        }

        const routeNameCompare = routeNameCollator.compare(left.routeName, right.routeName)

        if (routeNameCompare !== 0) {
          return routeNameCompare
        }

        return left.route.RouteUID.localeCompare(right.route.RouteUID)
      })
      .map(({ route }) => route)
  }, [normalizedKeyword, recentRouteIndexMap, routeNameCollator, searchableRoutes])

  const recentRoutes = useMemo(() => {
    if (normalizedKeyword) {
      return [] as BusRoute<Date | null>[]
    }

    return searchableRoutes
      .filter((route) => recentRouteIndexMap.has(route.route.RouteUID))
      .sort((left, right) => {
        const recentIndexDiff =
          (recentRouteIndexMap.get(left.route.RouteUID) ?? Number.POSITIVE_INFINITY) -
          (recentRouteIndexMap.get(right.route.RouteUID) ?? Number.POSITIVE_INFINITY)

        if (recentIndexDiff !== 0) {
          return recentIndexDiff
        }

        const routeNameCompare = routeNameCollator.compare(left.routeName, right.routeName)

        if (routeNameCompare !== 0) {
          return routeNameCompare
        }

        return left.route.RouteUID.localeCompare(right.route.RouteUID)
      })
      .map(({ route }) => route)
      .slice(0, 10)
  }, [normalizedKeyword, recentRouteIndexMap, routeNameCollator, searchableRoutes])

  const routeCardSkeletons = Array.from({ length: 6 }, (_, index) => (
    <Card key={index} withBorder radius="md" p="xs" shadow="xs" data-testid="routes-skeleton-card">
      <Stack gap={8}>
        <Flex justify="space-between" align="center">
          <Skeleton h={26} w={64} radius="xl" />
          <Skeleton h={26} w={72} radius="xl" />
        </Flex>
        <Skeleton h={14} radius="sm" />
      </Stack>
    </Card>
  ))

  const message = useMemo(() => {
    if (isLoading) return null
    if (error) return getSearchMessages(t).loadRoutesError
    if (!normalizedKeyword && recentRoutes.length === 0) return getSearchMessages(t).emptyRouteSearch
    if (normalizedKeyword && filteredRoutes.length === 0) return getSearchMessages(t).emptyRoutes

    return null
  }, [error, filteredRoutes.length, isLoading, normalizedKeyword, recentRoutes.length, t])

  const displayedRoutes = normalizedKeyword ? filteredRoutes : recentRoutes

  useEffect(() => {
    const previousSearchContext = previousSearchContextRef.current
    previousSearchContextRef.current = {
      area,
      keyword: normalizedKeyword
    }

    if (
      !previousSearchContext ||
      (
        previousSearchContext.area === area &&
        previousSearchContext.keyword === normalizedKeyword
      )
    ) {
      return
    }

    scrollViewportRef.current?.scrollTo({
      top: 0
    })
  }, [area, normalizedKeyword])

  return (
    <Flex justify="center" h="100%">
      <Card p={APP_PAGE_PADDING} w="100%" maw={720} h="100%" withBorder={false}>
        <Stack gap="md" h="100%">
          <Stack gap={4}>
            <Title order={3}>{t('pages.routes.title')}</Title>
          </Stack>
          <Flex gap="sm" align="stretch">
            <AreaSelect value={area} onChange={(nextArea) => dispatch(setSelectedArea(nextArea))} />
            <SearchInput
              value={keyword}
              onChange={(nextKeyword) => dispatch(setKeyword(nextKeyword))}
            />
          </Flex>
          {message && <BaseAlert {...message} />}
          <ScrollArea viewportRef={scrollViewportRef} style={{ flex: 1, minHeight: 0 }}>
            <Stack gap="sm">
              {!message && !normalizedKeyword && recentRoutes.length > 0 && (
                <Title order={5}>{t('pages.routes.recentViewedRoutesTitle')}</Title>
              )}
              {isLoading
                ? routeCardSkeletons
                : displayedRoutes.map((route) => (
                  <RouteInfoCard
                    key={route.RouteUID}
                    to={`/routes/${route.City}/${route.RouteUID}`}
                    name={getLocalizedText(route.RouteName, locale)}
                    city={route.City}
                    departure={getLocalizedText(route.DepartureStopName, locale)}
                    destination={getLocalizedText(route.DestinationStopName, locale)}
                  />
                ))}
            </Stack>
          </ScrollArea>
        </Stack>
      </Card>
    </Flex>
  )
}
