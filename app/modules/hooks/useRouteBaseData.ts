import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { busApi } from '~/modules/apis/bus'
import { getRouteMessages } from '~/modules/consts/pageMessages'
import { CityNameType } from '~/modules/enums/CityNameType'
import { DirectionType } from '~/modules/enums/DirectionType'
import type { BusSubRoute } from '~/modules/interfaces/BusRoute'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'
import type { StopOfRouteStop } from '~/modules/interfaces/StopOfRoute'
import { selectLocale } from '~/modules/slices/localeSlice'
import { getDirectionTranslationKey } from '~/modules/utils/i18n/getDirectionTranslationKey'
import { getLocalizedText } from '~/modules/utils/i18n/getLocalizedText'
import { normalizeBusRoutesWithDates } from '~/modules/utils/route/normalizeBusRoutesWithDates'
import type { LngLat } from '~/modules/types/CoordsType'

export interface RouteTab {
  id: string
  label: string
  subRouteUID: string
  direction: DirectionType
}

export interface RouteBaseStop {
  favoriteRouteStop: FavoriteRouteStop
  id: string
  isFavorite: boolean
  name: string
  position: LngLat | null
  sequence: number
  stopID: string
}

interface UseRouteBaseDataOptions {
  activeTab: string | null
  city: CityNameType
  id: string
  isFavoriteRouteStop: (favoriteId: string) => boolean
  locationState: unknown
}

interface RouteLocationState {
  favoriteRouteStop?: FavoriteRouteStop
}

export function useRouteBaseData(
  options: UseRouteBaseDataOptions | null
) {
  const { t } = useTranslation()
  const locale = useSelector(selectLocale)
  const activeTab = options?.activeTab ?? null
  const id = options?.id
  const isFavoriteRouteStop = options?.isFavoriteRouteStop ?? (() => false)
  const locationState = options?.locationState

  // Keep RTK Query args well-typed; skip prevents requests until route options are ready.
  const routeQueryCity = options?.city ?? CityNameType.TAIPEI

  const { data: routeData = [], isLoading: isRoutesLoading, error: routesError } = busApi.useGetRoutesByCityQuery(
    routeQueryCity,
    { skip: !options }
  )
  const { data: stopOfRoutes = [], isLoading: isStopOfRoutesLoading, error: stopOfRoutesError } =
    busApi.useGetStopOfRoutesByCityQuery(
      { city: routeQueryCity, routeUID: id },
      { skip: !options }
    )
  const { data: stopsByCity = [], isLoading: isStopsLoading, error: stopsError } =
    busApi.useGetStopsByCityQuery(routeQueryCity, { skip: !options })
  const { data: routeShapes = [] } = busApi.useGetRouteShapesByRouteQuery(
    { city: routeQueryCity, routeUID: id ?? '' },
    { skip: !options || !id }
  )

  const targetFavoriteRouteStop = useMemo(() => {
    if (!options) return null

    const favoriteRouteStop = (locationState as RouteLocationState | null)?.favoriteRouteStop
    if (!favoriteRouteStop) return null
    if (favoriteRouteStop.city !== options.city || favoriteRouteStop.routeUID !== id) return null

    return favoriteRouteStop
  }, [id, locationState, options])

  const routes = useMemo(() => normalizeBusRoutesWithDates(routeData), [routeData])

  const busRoute = useMemo(
    () => routes.find((route) => route.RouteUID === id),
    [routes, id]
  )

  const routeTabs = useMemo<RouteTab[]>(() => {
    if (!busRoute) return []

    const routeName = getLocalizedText(busRoute.RouteName, locale).trim()

    return busRoute.SubRoutes.map((subRoute) => ({
      id: `${subRoute.SubRouteUID}-${subRoute.Direction}`,
      label: [
        getLocalizedText(subRoute.SubRouteName, locale).trim() === routeName
          ? null
          : getLocalizedText(subRoute.SubRouteName, locale).trim(),
        t(getDirectionTranslationKey(subRoute.Direction))
      ].filter(Boolean).join(' '),
      subRouteUID: subRoute.SubRouteUID,
      direction: subRoute.Direction
    }))
  }, [busRoute, locale, t])

  const defaultActiveTabId = useMemo(() => {
    if (!routeTabs.length) return null
    if (!targetFavoriteRouteStop) return routeTabs[0].id

    return routeTabs.find((tab) =>
      tab.subRouteUID === targetFavoriteRouteStop.subRouteUID &&
      tab.direction === targetFavoriteRouteStop.direction
    )?.id ?? routeTabs[0].id
  }, [routeTabs, targetFavoriteRouteStop])

  const activeStopOfRoute = useMemo(() => {
    if (!activeTab) return null
    const activeRouteTab = routeTabs.find((tab) => tab.id === activeTab)
    if (!activeRouteTab) return null

    return stopOfRoutes.find((stopOfRoute) =>
      stopOfRoute.RouteUID === id &&
      stopOfRoute.SubRouteUID === activeRouteTab.subRouteUID &&
      stopOfRoute.Direction === activeRouteTab.direction
    ) ?? null
  }, [activeTab, id, routeTabs, stopOfRoutes])

  const subRoute = useMemo<BusSubRoute<Date | null> | null>(() => {
    if (!busRoute || !activeTab) return null

    const activeRouteTab = routeTabs.find((tab) => tab.id === activeTab)
    if (!activeRouteTab) return null

    return busRoute.SubRoutes.find((subRoute) =>
      subRoute.SubRouteUID === activeRouteTab.subRouteUID &&
      subRoute.Direction === activeRouteTab.direction
    ) ?? null
  }, [activeTab, busRoute, routeTabs])

  const stopPositionMap = useMemo(() => {
    return stopsByCity.reduce<Map<string, (typeof stopsByCity)[number]['position']>>((result, stop) => {
      if (stop.position) {
        result.set(stop.StopUID, stop.position)
        result.set(stop.StopID, stop.position)
      }
      return result
    }, new Map())
  }, [stopsByCity])

  const baseStops = useMemo<RouteBaseStop[]>(() => {
    if (!activeStopOfRoute || !subRoute || !busRoute) return []

    return activeStopOfRoute.Stops.map((stop) => {
      const stationKey = stop.StationID ?? stop.StopUID
      const favoriteRouteStop: FavoriteRouteStop = {
        favoriteId: `${busRoute.RouteUID}-${subRoute.SubRouteUID}-${subRoute.Direction}-${stationKey}`,
        city: busRoute.City,
        routeUID: busRoute.RouteUID,
        routeName: busRoute.RouteName,
        subRouteUID: subRoute.SubRouteUID,
        subRouteName: subRoute.SubRouteName,
        direction: subRoute.Direction,
        stopUID: stop.StopUID,
        stopID: stop.StopID,
        stationID: stop.StationID ?? null,
        stationKey,
        stopName: stop.StopName,
        stopSequence: stop.StopSequence,
        departure: subRoute.DepartureStopName ?? busRoute.DepartureStopName,
        destination: subRoute.DestinationStopName ?? busRoute.DestinationStopName
      }

      return {
        id: stop.StopUID,
        favoriteRouteStop,
        name: getLocalizedText(stop.StopName, locale),
        position: stopPositionMap.get(stop.StopUID) ?? stopPositionMap.get(stop.StopID) ?? null,
        sequence: stop.StopSequence,
        stopID: stop.StopID,
        isFavorite: isFavoriteRouteStop(favoriteRouteStop.favoriteId)
      }
    })
  }, [activeStopOfRoute, subRoute, busRoute, isFavoriteRouteStop, locale])

  const routeMapStops = useMemo(() => {
    return (activeStopOfRoute?.Stops ?? []).map((stop: StopOfRouteStop) => ({
      id: stop.StopUID,
      name: getLocalizedText(stop.StopName, locale),
      sequence: stop.StopSequence,
      position: stopPositionMap.get(stop.StopUID) ?? stopPositionMap.get(stop.StopID) ?? null
    }))
  }, [activeStopOfRoute, locale, stopPositionMap])

  const routePath = useMemo(() => {
    if (!subRoute) return []

    return routeShapes.find((routeShape) =>
      routeShape.SubRouteUID === subRoute.SubRouteUID &&
      routeShape.Direction === subRoute.Direction
    )?.path ?? []
  }, [subRoute, routeShapes])

  const highlightedStopId = useMemo(() => {
    if (!targetFavoriteRouteStop || !subRoute || !activeStopOfRoute || !busRoute) return null
    if (
      targetFavoriteRouteStop.routeUID !== busRoute.RouteUID ||
      targetFavoriteRouteStop.subRouteUID !== subRoute.SubRouteUID ||
      targetFavoriteRouteStop.direction !== subRoute.Direction
    ) {
      return null
    }

    const matchedStop = activeStopOfRoute.Stops.find((stop) => {
      const stationKey = stop.StationID ?? stop.StopUID

      return stationKey === targetFavoriteRouteStop.stationKey ||
        stop.StopUID === targetFavoriteRouteStop.stopUID ||
        stop.StopID === targetFavoriteRouteStop.stopID
    })

    return matchedStop?.StopUID ?? null
  }, [activeStopOfRoute, subRoute, busRoute, targetFavoriteRouteStop])

  const isLoading = isRoutesLoading || isStopOfRoutesLoading || isStopsLoading
  const isStopListLoading = Boolean(busRoute) && routeTabs.length > 0 && (isStopOfRoutesLoading || isStopsLoading)
  const error = routesError || stopOfRoutesError || stopsError

  const message = useMemo(() => {
    if (error) return getRouteMessages(t).loadRouteError
    if (!busRoute || routeTabs.length === 0) return getRouteMessages(t).emptyRoute

    return null
  }, [busRoute, error, routeTabs.length, t])

  return {
    subRoute,
    routePath,
    baseStops,
    busRoute,
    highlightedStopId,
    isLoading,
    isStopListLoading,
    message,
    defaultActiveTabId,
    routeMapStops,
    routeTabs
  }
}
