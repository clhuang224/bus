import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { busApi } from '~/modules/apis/bus'
import { isTdxRateLimitError } from '~/modules/apis/errors/busError'
import type { BusRoute, BusSubRoute } from '~/modules/interfaces/BusRoute'
import type { CityNameType } from '~/modules/enums/CityNameType'
import { RouteRealtimeInfoState } from '~/modules/enums/RouteRealtimeInfoState'
import { StopStatusType } from '~/modules/enums/StopStatusType'
import { selectLocale } from '~/modules/slices/localeSlice'
import { formatEstimatedArrivalLabel, getRouteRealtimeBusStatuses } from '~/modules/utils/getRouteRealtimeBusStatuses'
import { useDelay } from './useDelay'

const REALTIME_POLLING_INTERVAL = 30000
const REALTIME_INITIAL_DELAY_MS = 1200
const REALTIME_RATE_LIMIT_BACKOFF_MS = 3000

interface UseRouteRealtimeDataOptions {
  activeSubRoute: BusSubRoute<Date | null> | null
  busRoute: BusRoute<Date | null> | undefined
  city: string | undefined
  id: string | undefined
}

export function useRouteRealtimeData({
  activeSubRoute,
  busRoute,
  city,
  id
}: UseRouteRealtimeDataOptions) {
  const { t } = useTranslation()
  const locale = useSelector(selectLocale)
  const cityName = city as CityNameType
  const shouldPrepareRealtimeQueries = Boolean(city && id && busRoute && activeSubRoute)
  const [realtimeStartDelayMs, setRealtimeStartDelayMs] = useState<number | null>(null)
  const hasAppliedRateLimitBackoff = useRef(false)

  useEffect(() => {
    if (!shouldPrepareRealtimeQueries) {
      setRealtimeStartDelayMs(null)
      return
    }

    setRealtimeStartDelayMs(REALTIME_INITIAL_DELAY_MS)
  }, [activeSubRoute?.Direction, activeSubRoute?.SubRouteUID, busRoute, city, id, shouldPrepareRealtimeQueries])

  const canStartRealtime = useDelay({
    delayMs: realtimeStartDelayMs,
    enabled: shouldPrepareRealtimeQueries
  })

  const shouldSkipRealtimeQueries = !shouldPrepareRealtimeQueries || !canStartRealtime

  const {
    data: estimatedArrivals = [],
    error: estimatedArrivalsError,
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
    error: realtimeNearStopsError,
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

  const isRealtimeRateLimited = isTdxRateLimitError(estimatedArrivalsError) || isTdxRateLimitError(realtimeNearStopsError)

  useEffect(() => {
    if (!isRealtimeRateLimited) {
      hasAppliedRateLimitBackoff.current = false
      return
    }

    if (hasAppliedRateLimitBackoff.current) {
      return
    }

    hasAppliedRateLimitBackoff.current = true
    setRealtimeStartDelayMs(REALTIME_RATE_LIMIT_BACKOFF_MS)
  }, [isRealtimeRateLimited])

  const directionMatchedEstimatedArrivals = useMemo(() => {
    if (!activeSubRoute || !busRoute) return []

    return estimatedArrivals.filter((estimatedArrival) =>
      estimatedArrival.Direction === activeSubRoute.Direction
    )
  }, [activeSubRoute, busRoute, estimatedArrivals])

  const activeEstimatedArrivals = useMemo(() => {
    if (!activeSubRoute || !busRoute) return []

    const subRouteMatchedEstimatedArrivals = directionMatchedEstimatedArrivals.filter((estimatedArrival) =>
      estimatedArrival.SubRouteUID === activeSubRoute.SubRouteUID
    )

    if (subRouteMatchedEstimatedArrivals.length > 0) {
      return subRouteMatchedEstimatedArrivals
    }

    const routeLevelEstimatedArrivals = directionMatchedEstimatedArrivals.filter((estimatedArrival) =>
      estimatedArrival.RouteUID === busRoute.RouteUID ||
      estimatedArrival.SubRouteUID === busRoute.RouteUID
    )

    return routeLevelEstimatedArrivals.length > 0
      ? routeLevelEstimatedArrivals
      : directionMatchedEstimatedArrivals
  }, [activeSubRoute, busRoute, directionMatchedEstimatedArrivals])

  const activeRealtimeNearStops = useMemo(() => realtimeNearStops.filter((realtimeNearStop) =>
    realtimeNearStop.SubRouteUID === activeSubRoute?.SubRouteUID &&
    realtimeNearStop.Direction === activeSubRoute?.Direction
  ), [activeSubRoute, realtimeNearStops])

  const realtimeBusStatuses = useMemo(() => getRouteRealtimeBusStatuses(
    t,
    locale,
    activeRealtimeNearStops,
    activeEstimatedArrivals
  ), [activeEstimatedArrivals, activeRealtimeNearStops, locale, t])

  const realtimeBusesByStopSequence = useMemo(() => {
    return realtimeBusStatuses.reduce<Map<number, typeof realtimeBusStatuses>>((result, realtimeBus) => {
      const stopBuses = result.get(realtimeBus.stopSequence) ?? []
      stopBuses.push(realtimeBus)
      result.set(realtimeBus.stopSequence, stopBuses)
      return result
    }, new Map())
  }, [realtimeBusStatuses])

  const estimatedArrivalLabelsByStopKey = useMemo(() => {
    const sortedEstimatedArrivals = [...activeEstimatedArrivals].sort((left, right) => {
      const leftStopSequence = left.StopSequence ?? Number.POSITIVE_INFINITY
      const rightStopSequence = right.StopSequence ?? Number.POSITIVE_INFINITY

      if (left.EstimateTime == null && right.EstimateTime == null) {
        return leftStopSequence - rightStopSequence
      }
      if (left.EstimateTime == null) return 1
      if (right.EstimateTime == null) return -1
      return left.EstimateTime - right.EstimateTime
    })

    return sortedEstimatedArrivals.reduce<Map<string, string>>((result, estimatedArrival) => {
      const estimatedArrivalLabel = formatEstimatedArrivalLabel(
        t,
        estimatedArrival.EstimateTime,
        estimatedArrival.StopStatus
      )

      if (estimatedArrival.StopUID && !result.has(estimatedArrival.StopUID)) {
        result.set(estimatedArrival.StopUID, estimatedArrivalLabel)
      }

      if (estimatedArrival.StopID && !result.has(estimatedArrival.StopID)) {
        result.set(estimatedArrival.StopID, estimatedArrivalLabel)
      }

      return result
    }, new Map())
  }, [activeEstimatedArrivals, t])

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
    estimatedArrivalLabelsByStopKey,
    hasRealtimeError,
    isRealtimeLoading: isEstimatedArrivalsLoading || isRealtimeNearStopsLoading,
    isRealtimeRateLimited,
    realtimeBusesByStopSequence,
    realtimeBusStatuses,
    realtimeInfoState
  }
}
