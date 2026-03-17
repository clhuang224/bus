import { Accordion, AccordionControl, AccordionItem, AccordionPanel, Alert, Button, Card, Flex, List, NavLink, ScrollArea, Stack, Tabs, Text, Title } from '@mantine/core'
import distance from '@turf/distance'
import { point } from '@turf/helpers'
import { useSelector } from 'react-redux'
import type { RootState } from '~/modules/store'
import { cityMapName } from '~/modules/consts/city'
import { directionMapName } from '~/modules/consts/direction'
import {
  geoErrorMessages,
  geoPermissionMessages
} from '~/modules/consts/geoMessages'
import { GeoPermissionType } from '~/modules/enums/geo/GeoPermissionType'
import { DirectionType } from '~/modules/enums/DirectionType'
import { busApi } from '~/modules/apis/bus'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { NearbyStopGroup } from '~/modules/interfaces/Nearby'
import type { StationRoute } from '~/modules/interfaces/StationRoute'
import { getEnumValues } from '~/modules/utils/getEnumValues'
import { getCityByCoords } from '~/modules/utils/getCityByCoords'
import { NearbyStopDetail } from '~/components/nearby/NearbyStopDetail'
import { NearbyStopMap } from '~/components/nearby/NearbyStopMap'

const NEARBY_DISTANCE_KM = 0.5
const locatingMessage = {
  color: 'blue',
  title: '定位中',
  description: '正在取得您的目前位置，請稍候...'
} as const

const loadingStopsMessage = {
  color: 'blue',
  title: '載入中',
  description: '正在取得附近的站牌資料，請稍候...'
} as const

const loadStopsErrorMessage = {
  color: 'red',
  title: '載入站牌資料失敗',
  description: '請稍後再試，或確認您的網路連線'
} as const

const emptyStopsMessage = {
  color: 'yellow',
  title: '附近沒有站牌',
  description: '目前在您附近沒有找到任何站牌'
} as const

const routeNameCollator = new Intl.Collator('zh-Hant-u-co-stroke', {
  numeric: true
})

const Nearby = () => {
  const directionTabs = getEnumValues(DirectionType).map((type) => ({ type, value: String(type), label: directionMapName[type] }))

  const [selectedStop, setSelectedStop] = useState<string | null>(null)
  const [selectedStationRouteStop, setSelectedStationRouteStop] = useState<string | null>(null)
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())

  const { coords, error: geolocationError, permission } = useSelector((state: RootState) => state.geolocation)
  const geojson = useSelector((state: RootState) => state.cityGeo.geojson)
  const currentCity = getCityByCoords(coords, geojson)
  const { data: allStops, isLoading, error, isSuccess } = busApi.useGetStopsByCityQuery(
    currentCity,
    {
      skip: !coords
    }
  )
  const { data: stopOfRoutes = [] } = busApi.useGetStopOfRoutesByCityQuery(currentCity, {
    skip: !coords
  })

  const nearbyStopGroups = useMemo(() => {
    if (!coords || !isSuccess) return []

    const currentPoint = point([coords[1], coords[0]])
    const groupedStops = new Map<string, NearbyStopGroup>()

    allStops.forEach((stop) => {
      if (!stop.position) return false

      const stopPoint = point(stop.position)
      if (distance(currentPoint, stopPoint, { units: 'kilometers' }) > NEARBY_DISTANCE_KM) {
        return
      }

      const stationKey = stop.StationID ?? stop.StopUID
      const stopGroup = groupedStops.get(stationKey)
      if (stopGroup) {
        stopGroup.stops.push(stop)
        return
      }

      groupedStops.set(stationKey, {
        StationID: stationKey,
        StopName: stop.StopName,
        City: stop.City,
        position: stop.position,
        stops: [stop]
      })
    })

    return Array.from(groupedStops.values())
  }, [allStops, coords, isSuccess])

  const markers = useMemo(() => nearbyStopGroups.map((stopGroup) => ({
    id: stopGroup.StationID,
    position: stopGroup.position,
    label: stopGroup.StopName.zh_TW
  })), [nearbyStopGroups])

  const stationRoutesMap = useMemo(() => {
    const stationRoutes = new Map<string, StationRoute[]>()

    stopOfRoutes.forEach((stopOfRoute) => {
      const routeKey = `${stopOfRoute.SubRouteUID}-${stopOfRoute.Direction}`
      const route = {
        id: routeKey,
        routeUID: stopOfRoute.RouteUID,
        name: stopOfRoute.SubRouteName.zh_TW || stopOfRoute.RouteName.zh_TW,
        direction: stopOfRoute.Direction
      }

      stopOfRoute.Stops.forEach((stop) => {
        const stationKey = stop.StationID ?? stop.StopUID
        const routes = stationRoutes.get(stationKey) ?? []

        if (!routes.some((currentRoute) => currentRoute.id === route.id)) {
          routes.push(route)
          stationRoutes.set(stationKey, routes)
        }
      })
    })

    return stationRoutes
  }, [stopOfRoutes])

  const message = useMemo(() => {
    if ([GeoPermissionType.UNSUPPORTED, GeoPermissionType.DENIED].includes(permission)) {
      return geoPermissionMessages[permission]
    }
    if (geolocationError) return geoErrorMessages[geolocationError]
    if (!coords) return locatingMessage
    if (error) return loadStopsErrorMessage
    if (isLoading) return loadingStopsMessage
    if (nearbyStopGroups.length === 0) return emptyStopsMessage

    return null
  }, [permission, geolocationError, coords, nearbyStopGroups, isLoading, error])

  const selectedStopGroup = useMemo(() => {
    if (!selectedStationRouteStop) return null
    return nearbyStopGroups.find((stopGroup) => stopGroup.StationID === selectedStationRouteStop) ?? null
  }, [nearbyStopGroups, selectedStationRouteStop])

  const selectedStationRoutes = useMemo(() => {
    if (!selectedStationRouteStop) return []
    return stationRoutesMap.get(selectedStationRouteStop) ?? []
  }, [selectedStationRouteStop, stationRoutesMap])

  const routesByDirection = useMemo(() => {
    return directionTabs.reduce<Record<string, StationRoute[]>>((result, tab) => {
      result[tab.value] = selectedStationRoutes
        .filter((route) => route.direction === tab.type)
          .sort((left, right) => routeNameCollator.compare(left.name, right.name))
      return result
    }, {})
  }, [directionTabs, selectedStationRoutes])

  const stationRouteBadgesMap = useMemo(() => {
    const stationRouteBadges = new Map<string, Array<Pick<StationRoute, 'routeUID' | 'name'>>>()

    stationRoutesMap.forEach((routes, stationID) => {
      const uniqueRoutes = routes.reduce<Array<Pick<StationRoute, 'routeUID' | 'name'>>>((result, route) => {
        if (!result.some((currentRoute) => currentRoute.routeUID === route.routeUID)) {
          result.push({
            routeUID: route.routeUID,
            name: route.name
          })
        }
        return result
      }, []).sort((left, right) => routeNameCollator.compare(left.name, right.name))

      stationRouteBadges.set(stationID, uniqueRoutes)
    })

    return stationRouteBadges
  }, [stationRoutesMap])

  const renderInfoRow = (label: string, value: string) => (
    <Stack gap={2}>
      <Text size="sm" c="dimmed">{label}</Text>
      <Text size="sm">{value}</Text>
    </Stack>
  )

  useEffect(() => {
    if (!selectedStop || !scrollViewportRef.current) return

    const item = itemRefs.current.get(selectedStop)
    if (!item) return

    item.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    })

  }, [selectedStop, nearbyStopGroups])

  return (
    <Flex h="100%">
      <Card shadow="sm" p="lg" w="375px" mih="400px">
        { message && (
          <Alert color={message.color} title={message.title}>
            {message.description}
          </Alert>
        )}
        <ScrollArea viewportRef={scrollViewportRef} style={{ height: '100%', marginTop: '1rem' }}>
          {selectedStopGroup
            ? (
              <Stack gap="md">
                <Button variant="subtle" w="fit-content" onClick={() => setSelectedStationRouteStop(null)}>
                  返回附近站牌
                </Button>
                <Stack gap="xs">
                  <Title order={4}>{selectedStopGroup.StopName.zh_TW}</Title>
                  {renderInfoRow('縣市', selectedStopGroup.City ? cityMapName[selectedStopGroup.City] : '未提供')}
                  {renderInfoRow('地址', Array.from(new Set(selectedStopGroup.stops.map((stop) => stop.StopAddress).filter(Boolean))).join('、') || '未提供')}
                </Stack>
                <Tabs defaultValue={String(DirectionType.GO)}>
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
                            <List.Item key={route.id}>
                              <NavLink
                                component={Link}
                                to={`/bus-route/${currentCity}/${route.routeUID}`}
                                label={route.name}
                              />
                            </List.Item>
                          ))}
                        </List>
                      </Tabs.Panel>
                    ))}
                </Tabs>
              </Stack>
              )
            : (
              <Accordion variant="separated" value={selectedStop} onChange={setSelectedStop}>
                {nearbyStopGroups.map((stopGroup) => (
                  <AccordionItem
                    value={stopGroup.StationID}
                    key={stopGroup.StationID}
                    ref={(node) => {
                      if (node) {
                        itemRefs.current.set(stopGroup.StationID, node)
                      } else {
                        itemRefs.current.delete(stopGroup.StationID)
                      }
                    }}
                  >
                    <AccordionControl>
                      {stopGroup.StopName.zh_TW}
                    </AccordionControl>
                    <AccordionPanel>
                      <NearbyStopDetail
                        stopGroup={stopGroup}
                        routes={stationRouteBadgesMap.get(stopGroup.StationID) ?? []}
                        onViewRoutes={setSelectedStationRouteStop}
                      />
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
              )}
          </ScrollArea>
      </Card>
      <NearbyStopMap
        center={coords}
        markers={markers}
        selectedStop={selectedStop}
        onSelectStop={setSelectedStop}
      />
    </Flex>
  )
}

export default Nearby
