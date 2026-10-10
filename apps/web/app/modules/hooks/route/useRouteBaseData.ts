import { skipToken } from '@reduxjs/toolkit/query/react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { transitApi } from '~/modules/apis/transit'
import { getRouteMessages } from '~/modules/consts/pageMessages'
import type { CityNameType, DirectionType } from '@bus/shared'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'
import type { RouteDetailSubRoute } from '~/modules/interfaces/RouteDetail'
import { selectLocale } from '~/modules/slices/localeSlice'
import { getDirectionTranslationKey } from '~/modules/utils/i18n/getDirectionTranslationKey'
import { getLocalizedText } from '~/modules/utils/i18n/getLocalizedText'
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

const EMPTY_PATH: LngLat[] = []

export function useRouteBaseData(options: UseRouteBaseDataOptions | null) {
  const { t } = useTranslation()
  const locale = useSelector(selectLocale)
  const activeTab = options?.activeTab ?? null
  const id = options?.id
  const isFavoriteRouteStop = options?.isFavoriteRouteStop ?? (() => false)
  const locationState = options?.locationState

  // currentData stays empty while another route loads, so the page never
  // shows the previous route's stops under the new URL.
  const {
    currentData: routeDetail,
    error,
    isFetching,
  } = transitApi.useGetRouteDetailQuery(
    options ? { city: options.city, routeUID: options.id } : skipToken,
  )
  const isLoading = isFetching && !routeDetail

  const targetFavoriteRouteStop = useMemo(() => {
    if (!options) return null

    const favoriteRouteStop = (locationState as RouteLocationState | null)
      ?.favoriteRouteStop
    if (!favoriteRouteStop) return null
    if (
      favoriteRouteStop.city !== options.city ||
      favoriteRouteStop.routeUID !== id
    )
      return null

    return favoriteRouteStop
  }, [id, locationState, options])

  const routeTabs = useMemo<RouteTab[]>(() => {
    if (!routeDetail) return []

    const routeName = getLocalizedText(routeDetail.name, locale).trim()

    return routeDetail.subRoutes.map((subRoute) => {
      const subRouteName = getLocalizedText(subRoute.name, locale).trim()

      return {
        id: subRoute.id,
        label: [
          subRouteName === routeName ? null : subRouteName,
          t(getDirectionTranslationKey(subRoute.direction)),
        ]
          .filter(Boolean)
          .join(' '),
        subRouteUID: subRoute.subRouteUID,
        direction: subRoute.direction,
      }
    })
  }, [routeDetail, locale, t])

  const defaultActiveTabId = useMemo(() => {
    if (!routeTabs.length) return null
    if (!targetFavoriteRouteStop) return routeTabs[0].id

    return (
      routeTabs.find(
        (tab) =>
          tab.subRouteUID === targetFavoriteRouteStop.subRouteUID &&
          tab.direction === targetFavoriteRouteStop.direction,
      )?.id ?? routeTabs[0].id
    )
  }, [routeTabs, targetFavoriteRouteStop])

  const subRoute = useMemo<RouteDetailSubRoute | null>(() => {
    if (!routeDetail || !activeTab) return null

    return (
      routeDetail.subRoutes.find((subRoute) => subRoute.id === activeTab) ??
      null
    )
  }, [activeTab, routeDetail])

  const baseStops = useMemo<RouteBaseStop[]>(() => {
    if (!subRoute || !routeDetail) return []

    return subRoute.stops.map((stop) => {
      const stationKey = stop.stationID ?? stop.stopUID
      const favoriteRouteStop: FavoriteRouteStop = {
        favoriteId: `${routeDetail.routeUID}-${subRoute.subRouteUID}-${subRoute.direction}-${stationKey}`,
        city: routeDetail.city,
        routeUID: routeDetail.routeUID,
        routeName: routeDetail.name,
        subRouteUID: subRoute.subRouteUID,
        subRouteName: subRoute.name,
        direction: subRoute.direction,
        stopUID: stop.stopUID,
        stopID: stop.stopID,
        stationID: stop.stationID,
        stationKey,
        stopName: stop.name,
        stopSequence: stop.sequence,
        departure: subRoute.departure,
        destination: subRoute.destination,
      }

      return {
        id: stop.stopUID,
        favoriteRouteStop,
        name: getLocalizedText(stop.name, locale),
        position: stop.position,
        sequence: stop.sequence,
        stopID: stop.stopID,
        isFavorite: isFavoriteRouteStop(favoriteRouteStop.favoriteId),
      }
    })
  }, [subRoute, routeDetail, isFavoriteRouteStop, locale])

  const routeMapStops = useMemo(() => {
    return (subRoute?.stops ?? []).map((stop) => ({
      id: stop.stopUID,
      name: getLocalizedText(stop.name, locale),
      sequence: stop.sequence,
      position: stop.position,
    }))
  }, [subRoute, locale])

  const highlightedStopId = useMemo(() => {
    if (!targetFavoriteRouteStop || !subRoute || !routeDetail) return null
    if (
      targetFavoriteRouteStop.routeUID !== routeDetail.routeUID ||
      targetFavoriteRouteStop.subRouteUID !== subRoute.subRouteUID ||
      targetFavoriteRouteStop.direction !== subRoute.direction
    ) {
      return null
    }

    const matchedStop = subRoute.stops.find((stop) => {
      const stationKey = stop.stationID ?? stop.stopUID

      return (
        stationKey === targetFavoriteRouteStop.stationKey ||
        stop.stopUID === targetFavoriteRouteStop.stopUID ||
        stop.stopID === targetFavoriteRouteStop.stopID
      )
    })

    return matchedStop?.stopUID ?? null
  }, [subRoute, routeDetail, targetFavoriteRouteStop])

  const message = useMemo(() => {
    if (error) return getRouteMessages(t).loadRouteError
    if (!routeDetail || routeTabs.length === 0)
      return getRouteMessages(t).emptyRoute

    return null
  }, [routeDetail, error, routeTabs.length, t])

  return {
    subRoute,
    routePath: subRoute?.path ?? EMPTY_PATH,
    baseStops,
    routeDetail: routeDetail ?? null,
    highlightedStopId,
    isLoading,
    message,
    defaultActiveTabId,
    routeMapStops,
    routeTabs,
  }
}
