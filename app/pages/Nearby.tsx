import { Accordion, AccordionControl, AccordionItem, AccordionPanel, Alert, Button, Card, Flex, Overlay, ScrollArea, Stack, Text, Title } from '@mantine/core'
import distance from '@turf/distance'
import { point } from '@turf/helpers'
import { useSelector } from 'react-redux'
import type { RootState } from '~/modules/store'
import { cityMapArea } from '~/modules/consts/area'
import { cityMapName } from '~/modules/consts/city'
import { nearbyMessages } from '~/modules/consts/pageMessages'
import {
  geoErrorMessages,
  geoPermissionMessages
} from '~/modules/consts/geoMessages'
import { GeoPermissionType } from '~/modules/enums/geo/GeoPermissionType'
import { busApi } from '~/modules/apis/bus'
import { useEffect, useMemo, useRef } from 'react'
import type { NearbyStopGroup } from '~/modules/interfaces/Nearby'
import type { StationRoute } from '~/modules/interfaces/StationRoute'
import { getCityByCoords } from '~/modules/utils/getCityByCoords'
import { useNearbySearchParams } from '~/modules/hooks/useNearbySearchParams'
import { NearbyStopDetail } from '~/components/nearby/NearbyStopDetail'
import { NearbyStopMap } from '~/components/nearby/NearbyStopMap'
import { NearbyStopRoutes } from '~/components/nearby/NearbyStopRoutes'

const NEARBY_DISTANCE_KM = 0.5
const disabledNearbyPermissions = [GeoPermissionType.UNSUPPORTED, GeoPermissionType.DENIED]

const Nearby = () => {
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const {
    selectedStopId,
    selectedRouteStopId,
    selectStop,
    viewStopRoutes,
    backToNearbyStops
  } = useNearbySearchParams()

  const { coords, error: geolocationError, permission } = useSelector((state: RootState) => state.geolocation)
  const geojson = useSelector((state: RootState) => state.cityGeo.geojson)
  const currentCity = getCityByCoords(coords, geojson)
  const currentArea = currentCity ? cityMapArea[currentCity] : null
  const isNearbyDisabled = disabledNearbyPermissions.includes(permission) || geolocationError !== null
  const { data: allStops, isLoading, error, isSuccess } = busApi.useGetStopsByAreaQuery(
    currentArea!,
    {
      skip: !coords || !currentArea
    }
  )
  const { data: stopOfRoutes = [] } = busApi.useGetStopOfRoutesByAreaQuery(currentArea!, {
    skip: !coords || !currentArea
  })
  const { data: routes = [] } = busApi.useGetRoutesByAreaQuery(currentArea!, {
    skip: !coords || !currentArea
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
    const routeDepartureMap = new Map<string, string>()
    const routeDestinationMap = new Map<string, string>()
    const routeFallbackDepartureMap = new Map<string, string>()
    const routeFallbackDestinationMap = new Map<string, string>()

    routes.forEach((route) => {
      routeFallbackDepartureMap.set(route.RouteUID, route.DepartureStopName.zh_TW || route.RouteName.zh_TW)
      routeFallbackDestinationMap.set(route.RouteUID, route.DestinationStopName.zh_TW || route.RouteName.zh_TW)

      route.SubRoutes.forEach((subRoute) => {
        routeDepartureMap.set(
          `${subRoute.SubRouteUID}-${subRoute.Direction}`,
          subRoute.DepartureStopName.zh_TW
        )
        routeDestinationMap.set(
          `${subRoute.SubRouteUID}-${subRoute.Direction}`,
          subRoute.DestinationStopName.zh_TW
        )
      })
    })

    stopOfRoutes.forEach((stopOfRoute) => {
      const routeKey = `${stopOfRoute.SubRouteUID}-${stopOfRoute.Direction}`
      const route = {
        id: routeKey,
        routeUID: stopOfRoute.RouteUID,
        city: stopOfRoute.City,
        name: stopOfRoute.SubRouteName.zh_TW || stopOfRoute.RouteName.zh_TW,
        departure: routeDepartureMap.get(routeKey) ?? routeFallbackDepartureMap.get(stopOfRoute.RouteUID) ?? '',
        destination: routeDestinationMap.get(routeKey) ?? routeFallbackDestinationMap.get(stopOfRoute.RouteUID) ?? '',
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
  }, [routes, stopOfRoutes])

  const message = useMemo(() => {
    if ([GeoPermissionType.UNSUPPORTED, GeoPermissionType.DENIED].includes(permission)) {
      return geoPermissionMessages[permission]
    }
    if (geolocationError) return geoErrorMessages[geolocationError]
    if (!coords) return nearbyMessages.locating
    if (error) return nearbyMessages.loadStopsError
    if (isLoading) return nearbyMessages.loadingStops
    if (nearbyStopGroups.length === 0) return nearbyMessages.emptyStops

    return null
  }, [permission, geolocationError, coords, nearbyStopGroups, isLoading, error])

  const selectedStopGroup = useMemo(() => {
    if (!selectedRouteStopId) return null
    return nearbyStopGroups.find((stopGroup) => stopGroup.StationID === selectedRouteStopId) ?? null
  }, [nearbyStopGroups, selectedRouteStopId])

  const selectedStationRoutes = useMemo(() => {
    if (!selectedRouteStopId) return []
    return stationRoutesMap.get(selectedRouteStopId) ?? []
  }, [selectedRouteStopId, stationRoutesMap])

  const stationRouteBadgesMap = useMemo(() => {
    const stationRouteBadges = new Map<string, Array<Pick<StationRoute, 'routeUID' | 'name'>>>()

    const routeNameCollator = new Intl.Collator('zh-Hant-u-co-stroke', {
      numeric: true
    })

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

  useEffect(() => {
    if (!selectedStopId || !scrollViewportRef.current) return

    const item = itemRefs.current.get(selectedStopId)
    if (!item) return

    item.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    })

  }, [selectedStopId, nearbyStopGroups])

  return (
    <Flex h="100%">
      <Card shadow="sm" p="lg" w="375px" h="100%">
        <Flex direction="column" h="100%" gap="md">
        { message && (
          <Alert color={message.color} title={message.title}>
            {message.description}
          </Alert>
        )}
        <ScrollArea
          viewportRef={scrollViewportRef}
          style={{ flex: 1, minHeight: 0 }}
        >
          {selectedStopGroup
            ? (
              <Stack gap="md">
                <Button
                  variant="subtle"
                  w="fit-content"
                  onClick={backToNearbyStops}
                >
                  返回附近站牌
                </Button>
                <Stack gap="xs">
                  <Title order={4}>{selectedStopGroup.StopName.zh_TW}</Title>
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed">縣市</Text>
                    <Text size="sm">
                      {selectedStopGroup.City ? cityMapName[selectedStopGroup.City] : '未提供'}
                    </Text>
                  </Stack>
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed">地址</Text>
                    <Text size="sm">
                      {Array.from(new Set(selectedStopGroup.stops.map((stop) => stop.StopAddress).filter(Boolean))).join('、') || '未提供'}
                    </Text>
                  </Stack>
                </Stack>
                <NearbyStopRoutes routes={selectedStationRoutes} />
              </Stack>
              )
            : (
              <Accordion
                variant="separated"
                value={selectedStopId}
                onChange={selectStop}
              >
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
                        onViewRoutes={viewStopRoutes}
                      />
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
              )}
        </ScrollArea>
        </Flex>
      </Card>
      <Flex pos="relative" style={{ flex: 1 }}>
        {isNearbyDisabled && (
          <Overlay
            color="#fff"
            backgroundOpacity={0.55}
            zIndex={1}
            style={{ cursor: 'not-allowed' }}
          />
        )}
        <NearbyStopMap
          center={coords}
          markers={markers}
          selectedStop={selectedStopId}
          onSelectStop={selectStop}
        />
      </Flex>
    </Flex>
  )
}

export default Nearby
