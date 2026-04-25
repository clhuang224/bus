import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { busApi } from '~/modules/apis/bus'
import { isTdxRateLimitError } from '~/modules/apis/errors/busError'
import type { BusRoute, BusSubRoute } from '~/modules/interfaces/BusRoute'
import { CityNameType } from '~/modules/enums/CityNameType'
import { RouteRealtimeInfoState } from '~/modules/enums/RouteRealtimeInfoState'
import { StopStatusType } from '~/modules/enums/StopStatusType'
import { selectLocale } from '~/modules/slices/localeSlice'
import { formatEstimatedArrivalLabel, getRouteRealtimeBusStatuses } from '~/modules/utils/route/getRouteRealtimeBusStatuses'
import { normalizePlateNumb } from '~/modules/utils/route/normalizePlateNumb'

const REALTIME_POLLING_INTERVAL = 30000
const REALTIME_INITIAL_DELAY_MS = 1200
const REALTIME_RATE_LIMIT_BACKOFF_MS = 3000

enum RealtimeQueryStatus {
  IDLE,
  WAITING,
  READY
}

type RealtimeQueryState =
  | { status: RealtimeQueryStatus.IDLE }
  | { status: RealtimeQueryStatus.WAITING, waitMs: number }
  | { status: RealtimeQueryStatus.READY }

interface UseRouteRealtimeDataOptions {
  subRoute: BusSubRoute<Date | null>
  busRoute: BusRoute<Date | null>
  city: CityNameType
  id: string
}

export function useRouteRealtimeData(options: UseRouteRealtimeDataOptions | null) {
  const { t } = useTranslation()
  const locale = useSelector(selectLocale)
  const subRoute = options?.subRoute ?? null
  const busRoute = options?.busRoute ?? null

  // Keep RTK Query args well-typed; skip prevents requests until realtime options are ready.
  const realtimeQueryArgs = options
    ? { city: options.city, routeUID: options.id }
    : { city: CityNameType.TAIPEI, routeUID: '' }
  const [realtimeQueryState, setRealtimeQueryState] = useState<RealtimeQueryState>({
    status: RealtimeQueryStatus.IDLE
  })
  const hasAppliedRateLimitBackoff = useRef(false)

  useEffect(() => {
    if (!options) {
      setRealtimeQueryState({ status: RealtimeQueryStatus.IDLE })
      return
    }

    setRealtimeQueryState({
      status: RealtimeQueryStatus.WAITING,
      waitMs: REALTIME_INITIAL_DELAY_MS
    })
  }, [subRoute?.Direction, subRoute?.SubRouteUID, busRoute?.RouteUID, options?.id, options?.city])

  useEffect(() => {
    if (realtimeQueryState.status !== RealtimeQueryStatus.WAITING) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setRealtimeQueryState({ status: RealtimeQueryStatus.READY })
    }, realtimeQueryState.waitMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [realtimeQueryState])

  const skipRealtime = !options || realtimeQueryState.status !== RealtimeQueryStatus.READY

  const {
    data: estimatedArrivals = [],
    error: estimatedArrivalsError,
    isError: isEstimatedArrivalsError,
    isLoading: isEstimatedArrivalsLoading
  } = busApi.useGetEstimatedArrivalByRouteQuery(
    realtimeQueryArgs,
    {
      skip: skipRealtime,
      pollingInterval: REALTIME_POLLING_INTERVAL,
      skipPollingIfUnfocused: true,
      refetchOnReconnect: true
    }
  )
  const {
    data: realtimeByFrequency = []
  } = busApi.useGetRealtimeByFrequencyByRouteQuery(
    realtimeQueryArgs,
    {
      skip: skipRealtime,
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
    realtimeQueryArgs,
    {
      skip: skipRealtime,
      pollingInterval: REALTIME_POLLING_INTERVAL,
      skipPollingIfUnfocused: true,
      refetchOnReconnect: true
    }
  )
  const isRealtimeRateLimited = isTdxRateLimitError(estimatedArrivalsError) ||
    isTdxRateLimitError(realtimeNearStopsError)

  useEffect(() => {
    if (!isRealtimeRateLimited) {
      hasAppliedRateLimitBackoff.current = false
      return
    }

    if (hasAppliedRateLimitBackoff.current) {
      return
    }

    hasAppliedRateLimitBackoff.current = true
    setRealtimeQueryState({
      status: RealtimeQueryStatus.WAITING,
      waitMs: REALTIME_RATE_LIMIT_BACKOFF_MS
    })
  }, [isRealtimeRateLimited])

  const directionMatchedEstimatedArrivals = useMemo(() => {
    if (!subRoute || !busRoute) return []

    return estimatedArrivals.filter((estimatedArrival) =>
      estimatedArrival.Direction === subRoute.Direction
    )
  }, [subRoute, busRoute, estimatedArrivals])

  const activeEstimatedArrivals = useMemo(() => {
    if (!subRoute || !busRoute) return []

    const subRouteMatchedEstimatedArrivals = directionMatchedEstimatedArrivals.filter((estimatedArrival) =>
      estimatedArrival.SubRouteUID === subRoute.SubRouteUID
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
  }, [subRoute, busRoute, directionMatchedEstimatedArrivals])

  const activeRealtimeNearStops = useMemo(() => realtimeNearStops.filter((realtimeNearStop) =>
    realtimeNearStop.SubRouteUID === subRoute?.SubRouteUID &&
    realtimeNearStop.Direction === subRoute?.Direction
  ), [subRoute, realtimeNearStops])
  const activeRealtimeByFrequency = useMemo(() => realtimeByFrequency.filter((realtimeVehicle) =>
    realtimeVehicle.SubRouteUID === subRoute?.SubRouteUID &&
    realtimeVehicle.Direction === subRoute?.Direction &&
    realtimeVehicle.position != null
  ) as Array<(typeof realtimeByFrequency)[number] & { position: NonNullable<(typeof realtimeByFrequency)[number]['position']> }>, [subRoute, realtimeByFrequency])

  const realtimeBusStatuses = useMemo(() => getRouteRealtimeBusStatuses(
    t,
    locale,
    activeRealtimeNearStops,
    activeEstimatedArrivals
  ), [activeEstimatedArrivals, activeRealtimeNearStops, locale, t])
  const realtimeMapVehicles = useMemo(() => {
    const realtimeStatusesByPlate = realtimeBusStatuses.reduce<Map<string, typeof realtimeBusStatuses[number]>>((result, realtimeBusStatus) => {
      result.set(normalizePlateNumb(realtimeBusStatus.plateNumb), realtimeBusStatus)
      return result
    }, new Map())

    return activeRealtimeByFrequency.map((realtimeVehicle) => {
      const vehicleId = normalizePlateNumb(realtimeVehicle.PlateNumb)
      const matchedStatus = realtimeStatusesByPlate.get(vehicleId)

      return {
        estimateLabel: matchedStatus?.estimateLabel ?? t('routePage.realtime.inService'),
        id: vehicleId,
        plateNumb: realtimeVehicle.PlateNumb,
        position: realtimeVehicle.position,
        stopName: matchedStatus?.stopName ?? t('components.routeMap.vehiclePopup.recentStopUnknown')
      }
    })
  }, [activeRealtimeByFrequency, realtimeBusStatuses, t])

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

  return {
    estimatedArrivalLabelsByStopKey,
    hasRealtimeError,
    isRealtimeLoading: isEstimatedArrivalsLoading || isRealtimeNearStopsLoading,
    isRealtimeRateLimited,
    realtimeMapVehicles,
    realtimeBusesByStopSequence,
    realtimeBusStatuses,
    realtimeInfoState
  }
}
