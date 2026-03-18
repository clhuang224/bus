import { Alert, Card, Flex, List, Tabs, Text, Title } from '@mantine/core'
import { useMemo } from 'react'
import { useParams } from 'react-router'
import { busApi } from '~/modules/apis/bus'
import { directionMapName } from '~/modules/consts/direction'
import { DirectionType } from '~/modules/enums/DirectionType'
import type { CityNameType } from '~/modules/enums/CityNameType'
import { getEnumValues } from '~/modules/utils/getEnumValues'

export default function Route() {
  const directionTabs = getEnumValues(DirectionType).map((type) => ({ type, value: String(type), label: directionMapName[type] }))

  const { city, id } = useParams()
  const { data: routes = [], isLoading, error } = busApi.useGetRoutesByCityQuery(
    city as CityNameType,
    { skip: !city || !id }
  )

  const busRoute = useMemo(() =>
    routes.find((route) => route.RouteUID === id),
  [routes, id])

  const routesByDirection = useMemo(() => {
    return directionTabs.reduce<Record<string, NonNullable<typeof busRoute>['SubRoutes']>>((result, tab) => {
      result[tab.value] = busRoute?.SubRoutes.filter((route) => route.Direction === tab.type) ?? []
      return result
    }, {})
  }, [busRoute])

  if (error) {
    return (
      <Alert color="red" title="載入路線失敗">
        請稍後再試，或確認您的網路連線。
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Alert color="blue" title="載入中">
        正在取得此站牌的路線資料，請稍候...
      </Alert>
    )
  }

  if (!busRoute) {
    return (
      <Alert color="yellow" title="查無路線">
        目前找不到這條公車路線資料。
      </Alert>
    )
  }

  return (
    <Flex p="lg">
      <Card w="100%">
        <Title order={3}>{busRoute.RouteName.zh_TW || '公車路線'}</Title>
        <Text mt="xs">
          {busRoute.DepartureStopName.zh_TW} - {busRoute.DestinationStopName.zh_TW}
        </Text>
        <Tabs defaultValue={String(DirectionType.GO)} mt="md">
          <Tabs.List>
            {directionTabs
              .filter((tab) => routesByDirection[tab.value].length > 0)
              .map((tab) => (
                <Tabs.Tab key={tab.value} value={tab.value}>
                  {tab.label}
                </Tabs.Tab>
              ))}
          </Tabs.List>

          {directionTabs
            .filter((tab) => routesByDirection[tab.value].length > 0)
              .map((tab) => (
                <Tabs.Panel key={tab.value} value={tab.value} pt="md">
                  <List spacing="xs">
                    {routesByDirection[tab.value].map((route) => (
                      <List.Item key={`${route.SubRouteUID}-${route.Direction}`}>
                        <Text>{route.SubRouteName.zh_TW}</Text>
                      </List.Item>
                    ))}
                  </List>
                </Tabs.Panel>
              ))}
        </Tabs>
      </Card>
    </Flex>
  )
}
