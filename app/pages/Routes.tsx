import { Alert, Card, Flex, ScrollArea, Stack, Text, Title } from '@mantine/core'
import { useMemo } from 'react'
import { useOutletContext } from 'react-router'
import { SearchInput } from '~/components/SearchInput'
import { RouteInfoCard } from '~/components/routes/RouteInfoCard'
import { areaMapAreaName } from '~/modules/consts/area'
import { searchMessages } from '~/modules/consts/pageMessages'
import { useSearchRouteParams } from '~/modules/hooks/useSearchRouteParams'
import { busApi } from '~/modules/apis/bus'
import type { BusRoute } from '~/modules/interfaces/BusRoute'
import type { AreaContext } from './AppLayout'

export default function Routes() {
  const { keyword, setKeyword } = useSearchRouteParams()
  const { area } = useOutletContext<AreaContext>()
  const { data: routes = [], isLoading, error } = busApi.useGetRoutesByAreaQuery(area)

  const filteredRoutes = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    const uniqueRoutes = routes.reduce<Map<string, BusRoute<string>>>((result, route) => {
      if (!result.has(route.RouteUID)) {
        result.set(route.RouteUID, route)
      }

      return result
    }, new Map())

    const routeNameCollator = new Intl.Collator('zh-Hant-u-co-stroke', {
      numeric: true
    })

    return Array.from(uniqueRoutes.values())
      .filter((route) => {
        if (!normalizedKeyword) return true

        return [
          route.RouteName.zh_TW,
          route.DepartureStopName.zh_TW,
          route.DestinationStopName.zh_TW
        ].some((value) => value.toLowerCase().includes(normalizedKeyword))
      })
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
            <Text size="sm" c="dimmed">
              目前搜尋範圍：{areaMapAreaName[area]}
            </Text>
          </Stack>
          <SearchInput
            value={keyword}
            onChange={setKeyword}
            w="100%"
          />
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
