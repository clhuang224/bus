import { Card, Flex, ScrollArea, Skeleton, Stack, Title } from '@mantine/core'
import { useMemo } from 'react'
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
import { AppLocaleType } from '~/modules/enums/AppLocaleType'
import { useLocalizedTextCollator } from '~/modules/hooks/useLocalizedTextCollator'
import { selectLocale } from '~/modules/slices/localeSlice'
import { setKeyword, setSelectedArea } from '~/modules/slices/routeSearchSlice'
import type { AppDispatch, RootState } from '~/modules/store'
import { getAreaByCoords } from '~/modules/utils/geo/getAreaByCoords'
import { getLocalizedText } from '~/modules/utils/i18n/getLocalizedText'
import { normalizeBusRoutesWithDates } from '~/modules/utils/route/normalizeBusRoutesWithDates'

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

function matchesRouteKeyword(route: BusRoute<Date | null>, keyword: string, locale: AppLocaleType) {
  if (!keyword) return true

  return [
    getLocalizedText(route.RouteName, locale),
    getLocalizedText(route.DepartureStopName, locale),
    getLocalizedText(route.DestinationStopName, locale)
  ].some((value) => value.toLowerCase().includes(keyword))
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

  const filteredRoutes = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    return deduplicateRoutes(routes)
      .filter((route) => matchesRouteKeyword(route, normalizedKeyword, locale))
      .sort((left, right) => routeNameCollator.compare(
        getLocalizedText(left.RouteName, locale),
        getLocalizedText(right.RouteName, locale)
      ))
  }, [keyword, locale, routeNameCollator, routes])

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
    if (error) return getSearchMessages(t).loadRoutesError
    if (filteredRoutes.length === 0) return getSearchMessages(t).emptyRoutes

    return null
  }, [error, filteredRoutes.length, t])

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
          <ScrollArea style={{ flex: 1, minHeight: 0 }}>
            <Stack gap="sm">
              {isLoading
                ? routeCardSkeletons
                : filteredRoutes.map((route) => (
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
