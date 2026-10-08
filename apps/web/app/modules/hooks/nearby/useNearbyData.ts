import { skipToken } from '@reduxjs/toolkit/query/react'
import type { AppLocaleType } from '@bus/shared'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { isTdxRateLimitError } from '~/modules/apis/errors/busError'
import { transitApi } from '~/modules/apis/transit'
import { cityMapArea } from '~/modules/consts/area'
import {
  getGeoErrorMessages,
  getGeoPermissionMessages,
} from '~/modules/consts/geoMessages'
import { getNearbyMessages } from '~/modules/consts/pageMessages'
import { GeoPermissionType } from '~/modules/enums/geo/GeoPermissionType'
import { useLocalizedTextCollator } from '~/modules/hooks/shared/useLocalizedTextCollator'
import type {
  NearbyStation,
  NearbyStationRoute,
  NearbyStationRoutesMap,
} from '~/modules/interfaces/Nearby'
import type { StationRoute } from '~/modules/interfaces/StationRoute'
import { selectLocale } from '~/modules/slices/localeSlice'
import type { RootState } from '~/modules/store'
import { getCityByCoords } from '~/modules/utils/geo/getCityByCoords'
import { getLocalizedText } from '~/modules/utils/i18n/getLocalizedText'

const disabledNearbyPermissions = [
  GeoPermissionType.UNSUPPORTED,
  GeoPermissionType.DENIED,
]

const EMPTY_STATIONS: NearbyStation[] = []

interface UseNearbyDataOptions {
  selectedStationId: string | null
  selectedStationRoutesId: string | null
}

function toStationRoute(
  route: NearbyStationRoute,
  locale: AppLocaleType,
): StationRoute {
  return {
    ...route,
    name: getLocalizedText(route.name, locale),
    departure: getLocalizedText(route.departure, locale),
    destination: getLocalizedText(route.destination, locale),
  }
}

function buildStationRouteBadgesMap(
  stations: NearbyStation[],
  routesByStationId: NearbyStationRoutesMap | null,
  locale: AppLocaleType,
  routeNameCollator: Intl.Collator,
) {
  const stationRouteBadges = new Map<
    string,
    Array<Pick<StationRoute, 'routeUID' | 'name'>>
  >()

  for (const station of stations) {
    const routes = new Map<string, Pick<StationRoute, 'routeUID' | 'name'>>()

    for (const route of routesByStationId?.[station.stationId] ?? []) {
      routes.set(route.routeUID, {
        routeUID: route.routeUID,
        name: getLocalizedText(route.name, locale),
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
  const isNearbyDisabled =
    disabledNearbyPermissions.includes(permission) || geolocationError !== null
  const isAwaitingUsableLocation = !coords && !isNearbyDisabled
  const routeNameCollator = useLocalizedTextCollator()
  const nearbyQuery =
    coords && currentArea ? { area: currentArea, coords } : null

  const {
    data: stationsResult,
    error: stationsError,
    isLoading: isStationsQueryLoading,
    isSuccess: isStationsSuccess,
  } = transitApi.useGetNearbyStationsQuery(nearbyQuery ?? skipToken)
  const nearbyStations = stationsResult?.stations ?? EMPTY_STATIONS
  // Some sources return station routes with the stations; others need a
  // separate request, which waits until the user selects a station.
  const shouldLoadStationRoutes =
    stationsResult?.routesByStationId === null && nearbyStations.length > 0

  const {
    data: routeBadgesData,
    error: routeBadgesError,
    isError: isRouteBadgesError,
    isLoading: isRouteBadgesLoading,
  } = transitApi.useGetNearbyStationRoutesQuery(
    nearbyQuery && shouldLoadStationRoutes && selectedStationId
      ? { ...nearbyQuery, includeTerminals: false }
      : skipToken,
  )
  const {
    data: stationRoutesData,
    error: stationRoutesError,
    isError: isStationRoutesError,
    isLoading: isStationRoutesQueryLoading,
  } = transitApi.useGetNearbyStationRoutesQuery(
    nearbyQuery && shouldLoadStationRoutes && selectedStationRoutesId
      ? { ...nearbyQuery, includeTerminals: true }
      : skipToken,
  )
  const routesByStationId =
    stationsResult?.routesByStationId ??
    stationRoutesData ??
    routeBadgesData ??
    null

  const stationRouteBadgesMap = useMemo(
    () =>
      buildStationRouteBadgesMap(
        nearbyStations,
        routesByStationId,
        locale,
        routeNameCollator,
      ),
    [locale, nearbyStations, routeNameCollator, routesByStationId],
  )
  const isStationRouteBadgesRateLimited = isTdxRateLimitError(routeBadgesError)
  const hasStationRouteBadgesError =
    isRouteBadgesError && !isStationRouteBadgesRateLimited
  const isStationRoutesRateLimited =
    isStationRouteBadgesRateLimited || isTdxRateLimitError(stationRoutesError)
  const hasStationRoutesError =
    (isRouteBadgesError || isStationRoutesError) && !isStationRoutesRateLimited
  const isStationsLoading = isAwaitingUsableLocation || isStationsQueryLoading

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

  const selectedStationRoutes = useMemo(() => {
    if (!selectedRouteStation) return []

    return (routesByStationId?.[selectedRouteStation.stationId] ?? []).map(
      (route) => toStationRoute(route, locale),
    )
  }, [locale, routesByStationId, selectedRouteStation])

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
    isStationRouteBadgesLoading: isRouteBadgesLoading,
    isStationRouteBadgesRateLimited,
    isStationRoutesLoading: isRouteBadgesLoading || isStationRoutesQueryLoading,
    isStationRoutesRateLimited,
    isStationsLoading,
    markers,
    message,
    nearbyStations,
    selectedMapStation,
    selectedRouteStation,
    selectedStationRoutes,
    stationRouteBadgesMap,
  }
}
