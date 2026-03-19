import { Alert, Card, Flex, Group, ScrollArea, Stack, Title } from '@mantine/core'
import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AreaSelect } from '~/components/AreaSelect'
import { SearchInput } from '~/components/SearchInput'
import { RouteInfoCard } from '~/components/routes/RouteInfoCard'
import { AreaType } from '~/modules/enums/AreaType'
import { searchMessages } from '~/modules/consts/pageMessages'
import { busApi } from '~/modules/apis/bus'
import type { BusRoute } from '~/modules/interfaces/BusRoute'
import { setKeyword, setSelectedArea } from '~/modules/slices/routeSearchSlice'
import type { AppDispatch, RootState } from '~/modules/store'
import { getAreaByCoords } from '~/modules/utils/getAreaByCoords'

const routeNameCollator = new Intl.Collator('zh-Hant-u-co-stroke', {
  numeric: true
})

function deduplicateRoutes(routes: BusRoute<string>[]) {
  return Array.from(
    routes.reduce<Map<string, BusRoute<string>>>((result, route) => {
      if (!result.has(route.RouteUID)) {
        result.set(route.RouteUID, route)
      }

      return result
    }, new Map()).values()
  )
}

function matchesRouteKeyword(route: BusRoute<string>, keyword: string) {
  if (!keyword) return true

  return [
    route.RouteName.zh_TW,
    route.DepartureStopName.zh_TW,
    route.DestinationStopName.zh_TW
  ].some((value) => value.toLowerCase().includes(keyword))
}

export default function Routes() {
  const dispatch = useDispatch<AppDispatch>()
  const { coords } = useSelector((state: RootState) => state.geolocation)
  const geojson = useSelector((state: RootState) => state.cityGeo.geojson)
  const { keyword, selectedArea } = useSelector((state: RootState) => state.routeSearch)
  const currentArea = getAreaByCoords(coords, geojson)
  const area = selectedArea ?? currentArea ?? AreaType.TAIPEI
  const { data: routes = [], isLoading, error } = busApi.useGetRoutesByAreaQuery(area)

  const filteredRoutes = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    return deduplicateRoutes(routes)
      .filter((route) => matchesRouteKeyword(route, normalizedKeyword))
      .sort((left, right) => routeNameCollator.compare(left.RouteName.zh_TW, right.RouteName.zh_TW))
  }, [keyword, routes])

  const message = useMemo(() => {
    if (error) return searchMessages.loadRoutesError
    if (isLoading) return searchMessages.loadingRoutes
    if (filteredRoutes.length === 0) return searchMessages.emptyRoutes

    return null
  }, [error, isLoading, filteredRoutes.length])

  return (
    <Flex justify="center" h="100%">
      <Card p="lg" w="100%" maw={720} h="100%" withBorder={false}>
        <Stack gap="md" h="100%">
          <Stack gap={4}>
            <Title order={3}>搜尋公車</Title>
          </Stack>
          <Group>
            <AreaSelect value={area} onChange={(nextArea) => dispatch(setSelectedArea(nextArea))} />
            <SearchInput
              value={keyword}
              onChange={(nextKeyword) => dispatch(setKeyword(nextKeyword))}
            />
          </Group>
          {message && (
            <Alert color={message.color} title={message.title}>
              {message.description}
            </Alert>
          )}
          <ScrollArea style={{ flex: 1, minHeight: 0 }}>
            <Stack gap="sm">
              {filteredRoutes.map((route) => (
                <RouteInfoCard
                  key={route.RouteUID}
                  to={`/routes/${route.City}/${route.RouteUID}`}
                  name={route.RouteName.zh_TW}
                  city={route.City}
                  departure={route.DepartureStopName.zh_TW}
                  destination={route.DestinationStopName.zh_TW}
                />
              ))}
            </Stack>
          </ScrollArea>
        </Stack>
      </Card>
    </Flex>
  )
}
