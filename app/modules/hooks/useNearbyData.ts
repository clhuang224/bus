import distance from '@turf/distance'
import { point } from '@turf/helpers'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { busApi } from '~/modules/apis/bus'
import { isTdxRateLimitError } from '~/modules/apis/errors/busError'
import { cityMapArea } from '~/modules/consts/area'
import {
  getGeoErrorMessages,
  getGeoPermissionMessages
} from '~/modules/consts/geoMessages'
import { NEARBY_DISTANCE_KM } from '~/modules/consts/nearby'
import { getNearbyMessages } from '~/modules/consts/pageMessages'
import { GeoPermissionType } from '~/modules/enums/geo/GeoPermissionType'
import type { AppLocaleType } from '~/modules/enums/AppLocaleType'
import type { BusRoute } from '~/modules/interfaces/BusRoute'
import type { NearbyStopGroup } from '~/modules/interfaces/Nearby'
import type { Stop } from '~/modules/interfaces/Stop'
import type { StopOfRoute } from '~/modules/interfaces/StopOfRoute'
import type { StationRoute } from '~/modules/interfaces/StationRoute'
import { useLocalizedTextCollator } from '~/modules/hooks/useLocalizedTextCollator'
import { selectLocale } from '~/modules/slices/localeSlice'
import type { RootState } from '~/modules/store'
import { getCityByCoords } from '~/modules/utils/geo/getCityByCoords'
import { toLngLat } from '~/modules/utils/geo/convertCoordinates'
import { getLocalizedText } from '~/modules/utils/i18n/getLocalizedText'
import { normalizeBusRoutesWithDates } from '~/modules/utils/route/normalizeBusRoutesWithDates'

const disabledNearbyPermissions = [GeoPermissionType.UNSUPPORTED, GeoPermissionType.DENIED]
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

  const currentPoint = point(toLngLat(coords)!)
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
  stopOfRoutes: StopOfRoute[],
  locale: AppLocaleType,
  routeNameCollator: Intl.Collator
) {
  const stationRouteBadges = new Map<string, Array<Pick<StationRoute, 'routeUID' | 'name'>>>()

  stopOfRoutes.forEach((stopOfRoute) => {
    const routeBadge = {
      routeUID: stopOfRoute.RouteUID,
      name: getLocalizedText(stopOfRoute.SubRouteName, locale) || getLocalizedText(stopOfRoute.RouteName, locale)
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
  selectedRouteStopId: string | null,
  locale: AppLocaleType
): StationRoute[] {
  if (!selectedRouteStopId || routes.length === 0) return []

  const stationRoutes = new Map<string, StationRoute[]>()
  const routeDepartureMap = new Map<string, string>()
  const routeDestinationMap = new Map<string, string>()
  const routeFallbackDepartureMap = new Map<string, string>()
  const routeFallbackDestinationMap = new Map<string, string>()

  routes.forEach((route) => {
    routeFallbackDepartureMap.set(
      route.RouteUID,
      getLocalizedText(route.DepartureStopName, locale) || getLocalizedText(route.RouteName, locale)
    )
    routeFallbackDestinationMap.set(
      route.RouteUID,
      getLocalizedText(route.DestinationStopName, locale) || getLocalizedText(route.RouteName, locale)
    )

    route.SubRoutes.forEach((subRoute) => {
      routeDepartureMap.set(
        `${subRoute.SubRouteUID}-${subRoute.Direction}`,
        getLocalizedText(subRoute.DepartureStopName, locale)
      )
      routeDestinationMap.set(
        `${subRoute.SubRouteUID}-${subRoute.Direction}`,
        getLocalizedText(subRoute.DestinationStopName, locale)
      )
    })
  })

  stopOfRoutes.forEach((stopOfRoute) => {
    const routeKey = `${stopOfRoute.SubRouteUID}-${stopOfRoute.Direction}`
    const route = {
      id: routeKey,
      routeUID: stopOfRoute.RouteUID,
      city: stopOfRoute.City,
      name: getLocalizedText(stopOfRoute.SubRouteName, locale) || getLocalizedText(stopOfRoute.RouteName, locale),
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
  const locale = useSelector(selectLocale)
  const { coords, error: geolocationError, permission } = useSelector((state: RootState) => state.geolocation)
  const geojson = useSelector((state: RootState) => state.cityGeo.geojson)
  const currentCity = getCityByCoords(coords, geojson)
  const currentArea = currentCity ? cityMapArea[currentCity] : null
  const isNearbyDisabled = disabledNearbyPermissions.includes(permission) || geolocationError !== null
  const isAwaitingUsableLocation = !coords && !isNearbyDisabled
  const routeNameCollator = useLocalizedTextCollator()

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
    error: stopOfRoutesError,
    isLoading: isStopOfRoutesLoading,
    isError: isStopOfRoutesError
  } = busApi.useGetStopOfRoutesByAreaQuery(
    { area: currentArea!, stopUIDs: nearbyStopUIDs },
    {
      skip: !coords || !currentArea || !selectedStopId || nearbyStopUIDs.length === 0
    }
  )

  const {
    data: routeData = [],
    error: routesError,
    isLoading: isRoutesLoading,
    isError: isRoutesError
  } = busApi.useGetRoutesByAreaQuery(currentArea!, {
    skip: !coords || !currentArea || !selectedRouteStopId
  })
  const routes = useMemo(() => normalizeBusRoutesWithDates(routeData), [routeData])
  const isStationRouteBadgesRateLimited = isTdxRateLimitError(stopOfRoutesError)
  const hasStationRouteBadgesError = isStopOfRoutesError && !isStationRouteBadgesRateLimited
  const isStationRoutesRateLimited = isStationRouteBadgesRateLimited || isTdxRateLimitError(routesError)
  const hasStationRoutesError = (isStopOfRoutesError || isRoutesError) && !isStationRoutesRateLimited

  const markers = useMemo(() => nearbyStopGroups.map((stopGroup) => ({
    id: stopGroup.StationID,
    position: stopGroup.position,
    label: getLocalizedText(stopGroup.StopName, locale)
  })), [locale, nearbyStopGroups])

  const message = useMemo(() => {
    if ([GeoPermissionType.UNSUPPORTED, GeoPermissionType.DENIED].includes(permission)) {
      return getGeoPermissionMessages(t)[permission]
    }
    if (geolocationError) return getGeoErrorMessages(t)[geolocationError]
    if (stopsError) return getNearbyMessages(t).loadStopsError
    if (nearbyStopGroups.length === 0) return getNearbyMessages(t).emptyStops

    return null
  }, [permission, geolocationError, stopsError, nearbyStopGroups, t])

  const selectedStopGroup = useMemo(() => {
    if (!selectedRouteStopId) return null
    return nearbyStopGroups.find((stopGroup) => stopGroup.StationID === selectedRouteStopId) ?? null
  }, [nearbyStopGroups, selectedRouteStopId])

  const selectedMapStopGroup = useMemo(() => {
    if (!selectedStopId) return null
    return nearbyStopGroups.find((stopGroup) => stopGroup.StationID === selectedStopId) ?? null
  }, [nearbyStopGroups, selectedStopId])

  const selectedStationRoutes = useMemo(
    () => buildStationRoutes(routes, stopOfRoutes, selectedRouteStopId, locale),
    [locale, routes, selectedRouteStopId, stopOfRoutes]
  )

  const stationRouteBadgesMap = useMemo(
    () => buildStationRouteBadgesMap(stopOfRoutes, locale, routeNameCollator),
    [locale, routeNameCollator, stopOfRoutes]
  )

  return {
    coords,
    hasStationRouteBadgesError,
    hasStationRoutesError,
    isNearbyDisabled,
    isStationRouteBadgesLoading: isStopOfRoutesLoading,
    isStationRouteBadgesRateLimited,
    isStationRoutesLoading: isStopOfRoutesLoading || isRoutesLoading,
    isStationRoutesRateLimited,
    isStopsLoading: isAwaitingUsableLocation || isStopsLoading,
    markers,
    message,
    nearbyStopGroups,
    selectedMapStopGroup,
    selectedStationRoutes,
    selectedStopGroup,
    stationRouteBadgesMap
  }
}
