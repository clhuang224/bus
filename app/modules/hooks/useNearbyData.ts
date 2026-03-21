import distance from '@turf/distance'
import { point } from '@turf/helpers'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { busApi } from '~/modules/apis/bus'
import { cityMapArea } from '~/modules/consts/area'
import {
  getGeoErrorMessages,
  getGeoPermissionMessages
} from '~/modules/consts/geoMessages'
import { NEARBY_DISTANCE_KM } from '~/modules/consts/nearby'
import { getNearbyMessages } from '~/modules/consts/pageMessages'
import { GeoPermissionType } from '~/modules/enums/geo/GeoPermissionType'
import type { BusRoute } from '~/modules/interfaces/BusRoute'
import type { NearbyStopGroup } from '~/modules/interfaces/Nearby'
import type { Stop } from '~/modules/interfaces/Stop'
import type { StopOfRoute } from '~/modules/interfaces/StopOfRoute'
import type { StationRoute } from '~/modules/interfaces/StationRoute'
import type { RootState } from '~/modules/store'
import { getCityByCoords } from '~/modules/utils/getCityByCoords'
import { normalizeBusRoutesWithDates } from '~/modules/utils/normalizeBusRoutesWithDates'

const disabledNearbyPermissions = [GeoPermissionType.UNSUPPORTED, GeoPermissionType.DENIED]
const routeNameCollator = new Intl.Collator('zh-Hant-u-co-stroke', {
  numeric: true
})

interface UseNearbyDataOptions {
  selectedStopId: string | null
  selectedRouteStopId: string | null
}

function groupNearbyStops(
  allStops: Stop[] | undefined,
  coords: [number, number] | null,
  isSuccess: boolean
): NearbyStopGroup[] {
  if (!coords || !isSuccess || !allStops) return []

  const currentPoint = point([coords[1], coords[0]])
  const groupedStops = new Map<string, NearbyStopGroup>()

  allStops.forEach((stop) => {
    if (!stop.position) return

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
}

function buildStationRouteBadgesMap(
  stopOfRoutes: StopOfRoute[]
) {
  const stationRouteBadges = new Map<string, Array<Pick<StationRoute, 'routeUID' | 'name'>>>()

  stopOfRoutes.forEach((stopOfRoute) => {
    const routeBadge = {
      routeUID: stopOfRoute.RouteUID,
      name: stopOfRoute.SubRouteName.zh_TW || stopOfRoute.RouteName.zh_TW
    }

    stopOfRoute.Stops.forEach((stop) => {
      const stationKey = stop.StationID ?? stop.StopUID
      const stationBadges = stationRouteBadges.get(stationKey) ?? []

      if (!stationBadges.some((currentRoute) => currentRoute.routeUID === routeBadge.routeUID)) {
        stationBadges.push(routeBadge)
        stationBadges.sort((left, right) => routeNameCollator.compare(left.name, right.name))
        stationRouteBadges.set(stationKey, stationBadges)
      }
    })
  })

  return stationRouteBadges
}

function buildStationRoutes(
  routes: BusRoute<Date | null>[],
  stopOfRoutes: StopOfRoute[],
  selectedRouteStopId: string | null
): StationRoute[] {
  if (!selectedRouteStopId || routes.length === 0) return []

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
      const stationStopRoutes = stationRoutes.get(stationKey) ?? []

      if (!stationStopRoutes.some((currentRoute) => currentRoute.id === route.id)) {
        stationStopRoutes.push(route)
        stationRoutes.set(stationKey, stationStopRoutes)
      }
    })
  })

  return stationRoutes.get(selectedRouteStopId) ?? []
}

export function useNearbyData({
  selectedStopId,
  selectedRouteStopId
}: UseNearbyDataOptions) {
  const { t } = useTranslation()
  const { coords, error: geolocationError, permission } = useSelector((state: RootState) => state.geolocation)
  const geojson = useSelector((state: RootState) => state.cityGeo.geojson)
  const geoPermissionMessages = getGeoPermissionMessages(t)
  const geoErrorMessages = getGeoErrorMessages(t)
  const nearbyMessages = getNearbyMessages(t)
  const currentCity = getCityByCoords(coords, geojson)
  const currentArea = currentCity ? cityMapArea[currentCity] : null
  const isNearbyDisabled = disabledNearbyPermissions.includes(permission) || geolocationError !== null

  const {
    data: allStops,
    isLoading: isStopsLoading,
    error: stopsError,
    isSuccess: isStopsSuccess
  } = busApi.useGetStopsByNearbyAreaQuery(
    { area: currentArea!, coords: coords! },
    {
      skip: !coords || !currentArea
    }
  )

  const nearbyStopGroups = useMemo(
    () => groupNearbyStops(allStops, coords, isStopsSuccess),
    [allStops, coords, isStopsSuccess]
  )

  const nearbyStopUIDs = useMemo(
    () => nearbyStopGroups.flatMap((stopGroup) => stopGroup.stops.map((stop) => stop.StopUID)),
    [nearbyStopGroups]
  )

  const {
    data: stopOfRoutes = [],
    isLoading: isStopOfRoutesLoading
  } = busApi.useGetStopOfRoutesByAreaQuery(
    { area: currentArea!, stopUIDs: nearbyStopUIDs },
    {
      skip: !coords || !currentArea || !selectedStopId || nearbyStopUIDs.length === 0
    }
  )

  const { data: routeData = [], isLoading: isRoutesLoading } = busApi.useGetRoutesByAreaQuery(currentArea!, {
    skip: !coords || !currentArea || !selectedRouteStopId
  })
  const routes = useMemo(() => normalizeBusRoutesWithDates(routeData), [routeData])

  const markers = useMemo(() => nearbyStopGroups.map((stopGroup) => ({
    id: stopGroup.StationID,
    position: stopGroup.position,
    label: stopGroup.StopName.zh_TW
  })), [nearbyStopGroups])

  const message = useMemo(() => {
    if ([GeoPermissionType.UNSUPPORTED, GeoPermissionType.DENIED].includes(permission)) {
      return geoPermissionMessages[permission]
    }
    if (geolocationError) return geoErrorMessages[geolocationError]
    if (stopsError) return nearbyMessages.loadStopsError
    if (nearbyStopGroups.length === 0) return nearbyMessages.emptyStops

    return null
  }, [permission, geolocationError, stopsError, nearbyStopGroups])

  const selectedStopGroup = useMemo(() => {
    if (!selectedRouteStopId) return null
    return nearbyStopGroups.find((stopGroup) => stopGroup.StationID === selectedRouteStopId) ?? null
  }, [nearbyStopGroups, selectedRouteStopId])

  const selectedMapStopGroup = useMemo(() => {
    if (!selectedStopId) return null
    return nearbyStopGroups.find((stopGroup) => stopGroup.StationID === selectedStopId) ?? null
  }, [nearbyStopGroups, selectedStopId])

  const selectedStationRoutes = useMemo(
    () => buildStationRoutes(routes, stopOfRoutes, selectedRouteStopId),
    [routes, selectedRouteStopId, stopOfRoutes]
  )

  const stationRouteBadgesMap = useMemo(
    () => buildStationRouteBadgesMap(stopOfRoutes),
    [stopOfRoutes]
  )

  return {
    coords,
    isNearbyDisabled,
    isStationRouteBadgesLoading: isStopOfRoutesLoading,
    isStationRoutesLoading: isStopOfRoutesLoading || isRoutesLoading,
    isStopsLoading: !coords || isStopsLoading,
    markers,
    message,
    nearbyStopGroups,
    selectedMapStopGroup,
    selectedStationRoutes,
    selectedStopGroup,
    stationRouteBadgesMap
  }
}
