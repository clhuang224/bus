import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { busApi } from '~/modules/apis/bus'
import { getRouteMessages } from '~/modules/consts/pageMessages'
import type { CityNameType } from '~/modules/enums/CityNameType'
import { DirectionType } from '~/modules/enums/DirectionType'
import type { BusSubRoute } from '~/modules/interfaces/BusRoute'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'
import type { StopOfRouteStop } from '~/modules/interfaces/StopOfRoute'
import { selectLocale } from '~/modules/slices/localeSlice'
import { getDirectionLabel } from '~/modules/utils/i18n/getDirectionLabel'
import { getLocalizedText } from '~/modules/utils/i18n/getLocalizedText'
import { normalizeBusRoutesWithDates } from '~/modules/utils/route/normalizeBusRoutesWithDates'

export interface RouteTab {
  id: string
  label: string
  subRouteUID: string
  direction: DirectionType
}

export interface RouteBaseTimelineStop {
  favoriteRouteStop: FavoriteRouteStop
  id: string
  isFavorite: boolean
  name: string
  sequence: number
  stopID: string
}

interface UseRouteBaseDataOptions {
  activeTab: string | null
  city: string | undefined
  id: string | undefined
  isFavoriteRouteStop: (favoriteId: string) => boolean
  locationState: unknown
}

interface RouteLocationState {
  favoriteRouteStop?: FavoriteRouteStop
}

export function useRouteBaseData({
  activeTab,
  city,
  id,
  isFavoriteRouteStop,
  locationState
}: UseRouteBaseDataOptions) {
  const { t } = useTranslation()
  const locale = useSelector(selectLocale)
  const cityName = city as CityNameType

  const { data: routeData = [], isLoading: isRoutesLoading, error: routesError } = busApi.useGetRoutesByCityQuery(
    cityName,
    { skip: !city || !id }
  )
  const { data: stopOfRoutes = [], isLoading: isStopOfRoutesLoading, error: stopOfRoutesError } =
    busApi.useGetStopOfRoutesByCityQuery(
      { city: cityName, routeUID: id },
      { skip: !city || !id }
    )
  const { data: stopsByCity = [], isLoading: isStopsLoading, error: stopsError } =
    busApi.useGetStopsByCityQuery(cityName, { skip: !city || !id })

  const targetFavoriteRouteStop = useMemo(() => {
    const favoriteRouteStop = (locationState as RouteLocationState | null)?.favoriteRouteStop
    if (!favoriteRouteStop) return null
    if (favoriteRouteStop.city !== cityName || favoriteRouteStop.routeUID !== id) return null

    return favoriteRouteStop
  }, [cityName, id, locationState])

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
        getDirectionLabel(t, subRoute.Direction)
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

  const activeSubRoute = useMemo<BusSubRoute<Date | null> | null>(() => {
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

  const baseTimelineStops = useMemo<RouteBaseTimelineStop[]>(() => {
    if (!activeStopOfRoute || !activeSubRoute || !busRoute) return []

    return activeStopOfRoute.Stops.map((stop) => {
      const stationKey = stop.StationID ?? stop.StopUID
      const favoriteRouteStop: FavoriteRouteStop = {
        favoriteId: `${busRoute.RouteUID}-${activeSubRoute.SubRouteUID}-${activeSubRoute.Direction}-${stationKey}`,
        city: busRoute.City,
        routeUID: busRoute.RouteUID,
        routeName: busRoute.RouteName,
        subRouteUID: activeSubRoute.SubRouteUID,
        subRouteName: activeSubRoute.SubRouteName,
        direction: activeSubRoute.Direction,
        stopUID: stop.StopUID,
        stopID: stop.StopID,
        stationID: stop.StationID ?? null,
        stationKey,
        stopName: stop.StopName,
        stopSequence: stop.StopSequence,
        departure: activeSubRoute.DepartureStopName ?? busRoute.DepartureStopName,
        destination: activeSubRoute.DestinationStopName ?? busRoute.DestinationStopName
      }

      return {
        id: stop.StopUID,
        favoriteRouteStop,
        name: getLocalizedText(stop.StopName, locale),
        sequence: stop.StopSequence,
        stopID: stop.StopID,
        isFavorite: isFavoriteRouteStop(favoriteRouteStop.favoriteId)
      }
    })
  }, [activeStopOfRoute, activeSubRoute, busRoute, isFavoriteRouteStop, locale])

  const routeMapStops = useMemo(() => {
    return (activeStopOfRoute?.Stops ?? []).map((stop: StopOfRouteStop) => ({
      id: stop.StopUID,
      name: getLocalizedText(stop.StopName, locale),
      sequence: stop.StopSequence,
      position: stopPositionMap.get(stop.StopUID) ?? stopPositionMap.get(stop.StopID) ?? null
    }))
  }, [activeStopOfRoute, locale, stopPositionMap])

  const highlightedStopId = useMemo(() => {
    if (!targetFavoriteRouteStop || !activeSubRoute || !activeStopOfRoute || !busRoute) return null
    if (
      targetFavoriteRouteStop.routeUID !== busRoute.RouteUID ||
      targetFavoriteRouteStop.subRouteUID !== activeSubRoute.SubRouteUID ||
      targetFavoriteRouteStop.direction !== activeSubRoute.Direction
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
  }, [activeStopOfRoute, activeSubRoute, busRoute, targetFavoriteRouteStop])

  const isLoading = isRoutesLoading || isStopOfRoutesLoading || isStopsLoading
  const isStopListLoading = Boolean(busRoute) && routeTabs.length > 0 && (isStopOfRoutesLoading || isStopsLoading)
  const error = routesError || stopOfRoutesError || stopsError

  const message = useMemo(() => {
    if (error) return getRouteMessages(t).loadRouteError
    if (!busRoute || routeTabs.length === 0) return getRouteMessages(t).emptyRoute

    return null
  }, [busRoute, error, routeTabs.length, t])

  return {
    activeSubRoute,
    baseTimelineStops,
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
