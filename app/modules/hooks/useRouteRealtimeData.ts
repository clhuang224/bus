import { useMemo } from 'react'
import { busApi } from '~/modules/apis/bus'
import type { BusRoute, BusSubRoute } from '~/modules/interfaces/BusRoute'
import type { CityNameType } from '~/modules/enums/CityNameType'
import { RouteRealtimeInfoState } from '~/modules/enums/RouteRealtimeInfoState'
import { StopStatusType } from '~/modules/enums/StopStatusType'
import { getRouteRealtimeBusStatuses } from '~/modules/utils/getRouteRealtimeBusStatuses'

const REALTIME_POLLING_INTERVAL = 30000

interface UseRouteRealtimeDataOptions {
  activeSubRoute: BusSubRoute<string> | null
  busRoute: BusRoute<string> | undefined
  city: string | undefined
  id: string | undefined
}

export function useRouteRealtimeData({
  activeSubRoute,
  busRoute,
  city,
  id
}: UseRouteRealtimeDataOptions) {
  const cityName = city as CityNameType
  const shouldSkipRealtimeQueries = !city || !id || !busRoute || !activeSubRoute

  const {
    data: estimatedArrivals = [],
    isError: isEstimatedArrivalsError,
    isLoading: isEstimatedArrivalsLoading
  } = busApi.useGetEstimatedArrivalByRouteQuery(
    { city: cityName, routeUID: id! },
    {
      skip: shouldSkipRealtimeQueries,
      pollingInterval: REALTIME_POLLING_INTERVAL,
      skipPollingIfUnfocused: true,
      refetchOnReconnect: true
    }
  )
  const {
    data: realtimeNearStops = [],
    isError: isRealtimeNearStopsError,
    isLoading: isRealtimeNearStopsLoading
  } = busApi.useGetRealtimeNearStopsByRouteQuery(
    { city: cityName, routeUID: id! },
    {
      skip: shouldSkipRealtimeQueries,
      pollingInterval: REALTIME_POLLING_INTERVAL,
      skipPollingIfUnfocused: true,
      refetchOnReconnect: true
    }
  )
  const { data: routeShapes = [] } = busApi.useGetRouteShapesByRouteQuery(
    { city: cityName, routeUID: id! },
    { skip: shouldSkipRealtimeQueries }
  )

  const realtimeBusStatuses = useMemo(() => getRouteRealtimeBusStatuses(
    realtimeNearStops.filter((realtimeNearStop) =>
      realtimeNearStop.SubRouteUID === activeSubRoute?.SubRouteUID &&
      realtimeNearStop.Direction === activeSubRoute?.Direction
    ),
    estimatedArrivals.filter((estimatedArrival) =>
      estimatedArrival.SubRouteUID === activeSubRoute?.SubRouteUID &&
      estimatedArrival.Direction === activeSubRoute?.Direction
    )
  ), [activeSubRoute, estimatedArrivals, realtimeNearStops])

  const activeEstimatedArrivals = useMemo(() => estimatedArrivals.filter((estimatedArrival) =>
    estimatedArrival.SubRouteUID === activeSubRoute?.SubRouteUID &&
    estimatedArrival.Direction === activeSubRoute?.Direction
  ), [activeSubRoute, estimatedArrivals])

  const activeRealtimeNearStops = useMemo(() => realtimeNearStops.filter((realtimeNearStop) =>
    realtimeNearStop.SubRouteUID === activeSubRoute?.SubRouteUID &&
    realtimeNearStop.Direction === activeSubRoute?.Direction
  ), [activeSubRoute, realtimeNearStops])

  const realtimeBusesByStopSequence = useMemo(() => {
    return realtimeBusStatuses.reduce<Map<number, typeof realtimeBusStatuses>>((result, realtimeBus) => {
      const stopBuses = result.get(realtimeBus.stopSequence) ?? []
      stopBuses.push(realtimeBus)
      result.set(realtimeBus.stopSequence, stopBuses)
      return result
    }, new Map())
  }, [realtimeBusStatuses])

  const hasRealtimeError = useMemo(() => {
    if (isEstimatedArrivalsError && estimatedArrivals.length === 0) {
      return true
    }

    if (isRealtimeNearStopsError && realtimeNearStops.length === 0 && estimatedArrivals.length === 0) {
      return true
    }

    return false
  }, [
    estimatedArrivals.length,
    isEstimatedArrivalsError,
    isRealtimeNearStopsError,
    realtimeNearStops.length
  ])

  const realtimeInfoState = useMemo<RouteRealtimeInfoState>(() => {
    if (hasRealtimeError || isEstimatedArrivalsLoading || isRealtimeNearStopsLoading) {
      return RouteRealtimeInfoState.NORMAL
    }

    if (realtimeBusStatuses.length > 0) {
      return RouteRealtimeInfoState.NORMAL
    }

    if (activeEstimatedArrivals.length === 0 && activeRealtimeNearStops.length === 0) {
      return RouteRealtimeInfoState.NO_REALTIME_DATA
    }

    const isOutOfService = activeEstimatedArrivals.every((estimatedArrival) => [
      StopStatusType.NOT_YET_DEPARTED,
      StopStatusType.LAST_BUS_PASSED,
      StopStatusType.NOT_IN_SERVICE_TODAY
    ].includes(estimatedArrival.StopStatus))

    return isOutOfService ? RouteRealtimeInfoState.NO_SERVICE : RouteRealtimeInfoState.NO_REALTIME_DATA
  }, [
    activeEstimatedArrivals,
    activeRealtimeNearStops.length,
    hasRealtimeError,
    isEstimatedArrivalsLoading,
    isRealtimeNearStopsLoading,
    realtimeBusStatuses.length
  ])

  const activeRoutePath = useMemo(() => {
    if (!activeSubRoute) return []

    return routeShapes.find((routeShape) =>
      routeShape.SubRouteUID === activeSubRoute.SubRouteUID &&
      routeShape.Direction === activeSubRoute.Direction
    )?.path ?? []
  }, [activeSubRoute, routeShapes])

  return {
    activeRoutePath,
    hasRealtimeError,
    isRealtimeLoading: isEstimatedArrivalsLoading || isRealtimeNearStopsLoading,
    realtimeBusesByStopSequence,
    realtimeBusStatuses,
    realtimeInfoState
  }
}
