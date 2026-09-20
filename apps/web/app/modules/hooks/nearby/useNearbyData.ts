import distance from '@turf/distance'
import { point } from '@turf/helpers'
import {
  AppLocaleType,
  type ApiLocalizedText,
  type ApiStation,
} from '@bus/shared'
import type { BearingType, LocalizedText } from '@bus/shared'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { busApi } from '~/modules/apis/bus'
import { databaseApi, isDatabaseApiEnabled } from '~/modules/apis/database'
import { isTdxRateLimitError } from '~/modules/apis/errors/busError'
import { cityMapArea } from '~/modules/consts/area'
import {
  getGeoErrorMessages,
  getGeoPermissionMessages,
} from '~/modules/consts/geoMessages'
import { NEARBY_DISTANCE_KM } from '~/modules/consts/nearby'
import { getNearbyMessages } from '~/modules/consts/pageMessages'
import { GeoPermissionType } from '~/modules/enums/geo/GeoPermissionType'
import { useLocalizedTextCollator } from '~/modules/hooks/shared/useLocalizedTextCollator'
import type { BusRoute } from '~/modules/interfaces/BusRoute'
import type { NearbyStation } from '~/modules/interfaces/Nearby'
import type { StationRoute } from '~/modules/interfaces/StationRoute'
import type { Stop } from '~/modules/interfaces/Stop'
import type { StopOfRoute } from '~/modules/interfaces/StopOfRoute'
import { selectLocale } from '~/modules/slices/localeSlice'
import type { RootState } from '~/modules/store'
import { toLngLat } from '~/modules/utils/geo/convertCoordinates'
import { getCityByCoords } from '~/modules/utils/geo/getCityByCoords'
import { getLocalizedText } from '~/modules/utils/i18n/getLocalizedText'
import { normalizeBusRoutesWithDates } from '~/modules/utils/route/normalizeBusRoutesWithDates'

const disabledNearbyPermissions = [
  GeoPermissionType.UNSUPPORTED,
  GeoPermissionType.DENIED,
]

interface UseNearbyDataOptions {
  selectedStationId: string | null
  selectedStationRoutesId: string | null
}

function toLocalizedText(text: ApiLocalizedText): LocalizedText {
  return {
    [AppLocaleType.ZH_TW]: text[AppLocaleType.ZH_TW],
    [AppLocaleType.EN]: text[AppLocaleType.EN],
    [AppLocaleType.JA]: '',
    [AppLocaleType.KO]: '',
  }
}

function toTdxAddress(addresses: string[]): LocalizedText | null {
  if (addresses.length === 0) return null

  return {
    [AppLocaleType.ZH_TW]: addresses.join('、'),
    [AppLocaleType.EN]: '',
    [AppLocaleType.JA]: '',
    [AppLocaleType.KO]: '',
  }
}

function toNearbyTdxStops(
  allStops: Stop[] | undefined,
  coords: [number, number] | null,
  isSuccess: boolean,
): Stop[] {
  if (!coords || !isSuccess || !allStops) return []

  const currentPoint = point(toLngLat(coords)!)

  return allStops.filter((stop) => {
    if (!stop.position) return false

    return (
      distance(currentPoint, point(stop.position), { units: 'kilometers' }) <=
      NEARBY_DISTANCE_KM
    )
  })
}

function toTdxStations(
  stops: Stop[],
  routesByStationId: Map<string, StationRoute[]>,
): NearbyStation[] {
  const stopsByStationId = new Map<string, Stop[]>()

  for (const stop of stops) {
    const stationId = stop.StationID ?? stop.StopUID
    const stationStops = stopsByStationId.get(stationId) ?? []

    stationStops.push(stop)
    stopsByStationId.set(stationId, stationStops)
  }

  return [...stopsByStationId].map(([stationId, stationStops]) => {
    const representativeStop = stationStops[0]!
    const addresses = [
      ...new Set(
        stationStops
          .map((stop) => stop.StopAddress)
          .filter((address): address is string => Boolean(address)),
      ),
    ]
    const bearings = [
      ...new Set(
        stationStops
          .map((stop) => stop.Bearing)
          .filter((bearing): bearing is BearingType => bearing != null),
      ),
    ]

    return {
      stationId,
      name: representativeStop.StopName,
      city: representativeStop.City,
      address: toTdxAddress(addresses),
      bearings,
      position: representativeStop.position,
      routes: routesByStationId.get(stationId) ?? [],
    }
  })
}

function toApiStations(
  stations: ApiStation[],
  locale: AppLocaleType,
): NearbyStation[] {
  return stations.map((station) => ({
    stationId: station.uuid,
    name: toLocalizedText(station.name),
    city: station.city,
    address: station.address ? toLocalizedText(station.address) : null,
    bearings: station.bearing ? [station.bearing] : [],
    position: [station.position.longitude, station.position.latitude],
    routes: station.route_directions.flatMap(({ direction, routes }) =>
      routes.map((route) => ({
        id: `${route.uuid}-${direction}`,
        routeUID: route.uuid,
        city: route.city,
        name: getLocalizedText(toLocalizedText(route.name), locale),
        departure: getLocalizedText(toLocalizedText(route.departure), locale),
        destination: getLocalizedText(
          toLocalizedText(route.destination),
          locale,
        ),
        direction,
      })),
    ),
  }))
}

function buildTdxRoutesByStationId(
  routes: BusRoute<Date | null>[],
  stopOfRoutes: StopOfRoute[],
  locale: AppLocaleType,
): Map<string, StationRoute[]> {
  const routesByStationId = new Map<string, StationRoute[]>()
  const routeDepartureMap = new Map<string, string>()
  const routeDestinationMap = new Map<string, string>()
  const routeFallbackDepartureMap = new Map<string, string>()
  const routeFallbackDestinationMap = new Map<string, string>()

  for (const route of routes) {
    routeFallbackDepartureMap.set(
      route.RouteUID,
      getLocalizedText(route.DepartureStopName, locale) ||
        getLocalizedText(route.RouteName, locale),
    )
    routeFallbackDestinationMap.set(
      route.RouteUID,
      getLocalizedText(route.DestinationStopName, locale) ||
        getLocalizedText(route.RouteName, locale),
    )

    for (const subRoute of route.SubRoutes) {
      const routeKey = `${subRoute.SubRouteUID}-${subRoute.Direction}`

      routeDepartureMap.set(
        routeKey,
        getLocalizedText(subRoute.DepartureStopName, locale),
      )
      routeDestinationMap.set(
        routeKey,
        getLocalizedText(subRoute.DestinationStopName, locale),
      )
    }
  }

  for (const stopOfRoute of stopOfRoutes) {
    const routeKey = `${stopOfRoute.SubRouteUID}-${stopOfRoute.Direction}`
    const route = {
      id: routeKey,
      routeUID: stopOfRoute.RouteUID,
      city: stopOfRoute.City,
      name:
        getLocalizedText(stopOfRoute.SubRouteName, locale) ||
        getLocalizedText(stopOfRoute.RouteName, locale),
      departure:
        routeDepartureMap.get(routeKey) ??
        routeFallbackDepartureMap.get(stopOfRoute.RouteUID) ??
        '',
      destination:
        routeDestinationMap.get(routeKey) ??
        routeFallbackDestinationMap.get(stopOfRoute.RouteUID) ??
        '',
      direction: stopOfRoute.Direction,
    }

    for (const stop of stopOfRoute.Stops) {
      const stationId = stop.StationID ?? stop.StopUID
      const stationRoutes = routesByStationId.get(stationId) ?? []

      if (!stationRoutes.some((currentRoute) => currentRoute.id === route.id)) {
        stationRoutes.push(route)
        routesByStationId.set(stationId, stationRoutes)
      }
    }
  }

  return routesByStationId
}

function buildStationRouteBadgesMap(
  stations: NearbyStation[],
  routeNameCollator: Intl.Collator,
) {
  const stationRouteBadges = new Map<
    string,
    Array<Pick<StationRoute, 'routeUID' | 'name'>>
  >()

  for (const station of stations) {
    const routes = new Map<string, Pick<StationRoute, 'routeUID' | 'name'>>()

    for (const route of station.routes) {
      routes.set(route.routeUID, {
        routeUID: route.routeUID,
        name: route.name,
      })
    }

    stationRouteBadges.set(
      station.stationId,
      [...routes.values()].sort((left, right) =>
        routeNameCollator.compare(left.name, right.name),
      ),
    )
  }

  return stationRouteBadges
}

export function useNearbyData({
  selectedStationId,
  selectedStationRoutesId,
}: UseNearbyDataOptions) {
  const { t } = useTranslation()
  const locale = useSelector(selectLocale)
  const {
    coords,
    error: geolocationError,
    permission,
  } = useSelector((state: RootState) => state.geolocation)
  const geojson = useSelector((state: RootState) => state.cityGeo.geojson)
  const currentCity = getCityByCoords(coords, geojson)
  const currentArea = currentCity ? cityMapArea[currentCity] : null
  const usesDatabaseApi = isDatabaseApiEnabled()
  const isNearbyDisabled =
    disabledNearbyPermissions.includes(permission) || geolocationError !== null
  const isAwaitingUsableLocation = !coords && !isNearbyDisabled
  const routeNameCollator = useLocalizedTextCollator()

  const {
    data: apiStations = [],
    error: apiStationsError,
    isLoading: isApiStationsLoading,
    isSuccess: isApiStationsSuccess,
  } = databaseApi.useGetNearbyStationsQuery(
    {
      latitude: coords?.[0] ?? 0,
      longitude: coords?.[1] ?? 0,
      radius_meters: NEARBY_DISTANCE_KM * 1_000,
    },
    { skip: !usesDatabaseApi || !coords },
  )

  const {
    data: allStops,
    isLoading: isTdxStopsLoading,
    error: tdxStopsError,
    isSuccess: isTdxStopsSuccess,
  } = busApi.useGetStopsByNearbyAreaQuery(
    { area: currentArea!, coords: coords! },
    {
      skip: usesDatabaseApi || !coords || !currentArea,
    },
  )

  const nearbyTdxStops = useMemo(
    () => toNearbyTdxStops(allStops, coords, isTdxStopsSuccess),
    [allStops, coords, isTdxStopsSuccess],
  )
  const nearbyStopUIDs = useMemo(
    () => nearbyTdxStops.map((stop) => stop.StopUID),
    [nearbyTdxStops],
  )

  const {
    data: stopOfRoutes = [],
    error: stopOfRoutesError,
    isLoading: isStopOfRoutesLoading,
    isError: isStopOfRoutesError,
  } = busApi.useGetStopOfRoutesByAreaQuery(
    { area: currentArea!, stopUIDs: nearbyStopUIDs },
    {
      skip:
        usesDatabaseApi ||
        !coords ||
        !currentArea ||
        !selectedStationId ||
        nearbyStopUIDs.length === 0,
    },
  )

  const {
    data: routeData = [],
    error: routesError,
    isLoading: isRoutesLoading,
    isError: isRoutesError,
  } = busApi.useGetRoutesByAreaQuery(currentArea!, {
    skip:
      usesDatabaseApi || !coords || !currentArea || !selectedStationRoutesId,
  })
  const routes = useMemo(
    () => normalizeBusRoutesWithDates(routeData),
    [routeData],
  )
  const tdxRoutesByStationId = useMemo(
    () => buildTdxRoutesByStationId(routes, stopOfRoutes, locale),
    [locale, routes, stopOfRoutes],
  )
  const tdxStations = useMemo(
    () => toTdxStations(nearbyTdxStops, tdxRoutesByStationId),
    [nearbyTdxStops, tdxRoutesByStationId],
  )
  const nearbyStations = useMemo(
    () => (usesDatabaseApi ? toApiStations(apiStations, locale) : tdxStations),
    [apiStations, locale, tdxStations, usesDatabaseApi],
  )
  const stationRouteBadgesMap = useMemo(
    () => buildStationRouteBadgesMap(nearbyStations, routeNameCollator),
    [nearbyStations, routeNameCollator],
  )
  const isStationRouteBadgesRateLimited =
    !usesDatabaseApi && isTdxRateLimitError(stopOfRoutesError)
  const hasStationRouteBadgesError =
    !usesDatabaseApi && isStopOfRoutesError && !isStationRouteBadgesRateLimited
  const isStationRoutesRateLimited =
    !usesDatabaseApi &&
    (isStationRouteBadgesRateLimited || isTdxRateLimitError(routesError))
  const hasStationRoutesError =
    !usesDatabaseApi &&
    (isStopOfRoutesError || isRoutesError) &&
    !isStationRoutesRateLimited
  const isStationsLoading =
    isAwaitingUsableLocation ||
    (usesDatabaseApi ? isApiStationsLoading : isTdxStopsLoading)
  const isStationsSuccess = usesDatabaseApi
    ? isApiStationsSuccess
    : isTdxStopsSuccess
  const stationsError = usesDatabaseApi ? apiStationsError : tdxStopsError

  const markers = useMemo(
    () =>
      nearbyStations.map((station) => ({
        id: station.stationId,
        position: station.position,
        label: getLocalizedText(station.name, locale),
      })),
    [locale, nearbyStations],
  )

  const message = useMemo(() => {
    if (
      [GeoPermissionType.UNSUPPORTED, GeoPermissionType.DENIED].includes(
        permission,
      )
    ) {
      return getGeoPermissionMessages(t)[permission]
    }
    if (geolocationError) return getGeoErrorMessages(t)[geolocationError]
    if (stationsError) return getNearbyMessages(t).loadStopsError
    if (isStationsSuccess && nearbyStations.length === 0) {
      return getNearbyMessages(t).emptyStops
    }

    return null
  }, [
    geolocationError,
    isStationsSuccess,
    nearbyStations.length,
    permission,
    stationsError,
    t,
  ])

  const selectedRouteStation = useMemo(() => {
    if (!selectedStationRoutesId) return null

    return (
      nearbyStations.find(
        (station) => station.stationId === selectedStationRoutesId,
      ) ?? null
    )
  }, [nearbyStations, selectedStationRoutesId])

  const selectedMapStation = useMemo(() => {
    if (!selectedStationId) return null

    return (
      nearbyStations.find(
        (station) => station.stationId === selectedStationId,
      ) ?? null
    )
  }, [nearbyStations, selectedStationId])

  return {
    coords,
    hasStationRouteBadgesError,
    hasStationRoutesError,
    isNearbyDisabled,
    isStationRouteBadgesLoading: !usesDatabaseApi && isStopOfRoutesLoading,
    isStationRouteBadgesRateLimited,
    isStationRoutesLoading:
      !usesDatabaseApi && (isStopOfRoutesLoading || isRoutesLoading),
    isStationRoutesRateLimited,
    isStationsLoading,
    markers,
    message,
    nearbyStations,
    selectedMapStation,
    selectedRouteStation,
    selectedStationRoutes: selectedRouteStation?.routes ?? [],
    stationRouteBadgesMap,
  }
}
