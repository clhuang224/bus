import { Overlay, useMantineTheme } from '@mantine/core'
import distance from '@turf/distance'
import { point } from '@turf/helpers'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { useSelector } from 'react-redux'
import { MapSidebarLayout } from '~/components/common/MapSidebarLayout'
import { NearbySidebarContent } from '~/components/nearby/NearbySidebarContent'
import type { RootState } from '~/modules/store'
import { cityMapArea } from '~/modules/consts/area'
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
import { useScrollSelectedItem } from '~/modules/hooks/useScrollSelectedItem'
import { getCityByCoords } from '~/modules/utils/getCityByCoords'
import { useNearbySearchParams } from '~/modules/hooks/useNearbySearchParams'
import { NearbyStopDetail } from '~/components/nearby/NearbyStopDetail'
import { NearbyStopMap } from '~/components/nearby/NearbyStopMap'
import { NEARBY_DISTANCE_KM } from '~/modules/consts/nearby'

const disabledNearbyPermissions = [GeoPermissionType.UNSUPPORTED, GeoPermissionType.DENIED]

const Nearby = () => {
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const stopItemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const theme = useMantineTheme()
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)
  const [isSidebarOpened, { open: openSidebar, close: closeSidebar }] = useDisclosure(false)
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
  const activeStationId = selectedRouteStopId ?? selectedStopId
  const isNearbyDisabled = disabledNearbyPermissions.includes(permission) || geolocationError !== null
  const { data: allStops, isLoading, error, isSuccess } = busApi.useGetStopsByNearbyAreaQuery(
    { area: currentArea!, coords: coords! },
    {
      skip: !coords || !currentArea
    }
  )
  const { data: stopOfRoutes = [], isLoading: isStopOfRoutesLoading } = busApi.useGetStopOfRoutesByAreaQuery(currentArea!, {
    skip: !coords || !currentArea || !activeStationId
  })
  const { data: routes = [], isLoading: isRoutesLoading } = busApi.useGetRoutesByAreaQuery(currentArea!, {
    skip: !coords || !currentArea || !activeStationId
  })
  const isStationRoutesLoading = isRoutesLoading || isStopOfRoutesLoading

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

  const selectedMapStopGroup = useMemo(() => {
    if (!selectedStopId) return null
    return nearbyStopGroups.find((stopGroup) => stopGroup.StationID === selectedStopId) ?? null
  }, [nearbyStopGroups, selectedStopId])

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

  useScrollSelectedItem({
    itemElementRefs: stopItemRefs,
    listItems: nearbyStopGroups,
    selectedItemId: selectedStopId
  })

  useEffect(() => {
    if (isSm) {
      openSidebar()
      return
    }
  }, [isSm])

  useEffect(() => {
    if (!isSm || !selectedRouteStopId) return
    openSidebar()
  }, [isSm, selectedRouteStopId, openSidebar])

  const selectedStopPopupContent = selectedMapStopGroup
    ? (
      <NearbyStopDetail
        stopGroup={selectedMapStopGroup}
        routes={stationRouteBadgesMap.get(selectedMapStopGroup.StationID) ?? []}
        displayMode={isSm ? 'full' : 'title'}
        onViewRoutes={(stationID) => {
          viewStopRoutes(stationID)
          if (isSm) {
            openSidebar()
          }
        }}
      />
    )
    : null

  return (
    <MapSidebarLayout
      isSm={isSm}
      isSidebarOpened={isSidebarOpened}
      onCloseSidebar={closeSidebar}
      onOpenSidebar={openSidebar}
      openButtonLabel="開啟附近站牌列表"
      panel={(
        <NearbySidebarContent
          detailState={{
            isStationRoutesLoading,
            onBack: backToNearbyStops,
            stopGroup: selectedStopGroup,
            stationRoutes: selectedStationRoutes
          }}
          listState={{
            isStationRoutesLoading,
            nearbyStopGroups,
            onSelectStop: selectStop,
            onViewRoutes: viewStopRoutes,
            scrollViewportRef,
            selectedStopId,
            stationRouteBadgesMap,
            stopItemRefs
          }}
          message={message}
        />
      )}
    >
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
          selectedStopPopupContent={selectedStopPopupContent}
          isSm={isSm}
          onSelectStop={selectStop}
        />
    </MapSidebarLayout>
  )
}

export default Nearby
