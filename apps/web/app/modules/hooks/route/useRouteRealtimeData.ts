import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  CityNameType,
  RouteRealtimeStatus,
  type ApiRealtimeArrival,
  type ApiRouteRealtimeStop,
} from '@bus/shared'
import { transitApi } from '~/modules/apis/transit'
import { RouteRealtimeInfoState } from '~/modules/enums/RouteRealtimeInfoState'
import type {
  RouteDetailStop,
  RouteDetailSubRoute,
} from '~/modules/interfaces/RouteDetail'
import type { RouteMapVehicle } from '~/components/route/RouteMap'
import type { RouteRealtimeBusStatus } from '~/modules/interfaces/RouteRealtimeBusStatus'
import { selectLocale } from '~/modules/slices/localeSlice'
import { getLocalizedText } from '~/modules/utils/i18n/getLocalizedText'
import { toLocalizedText } from '~/modules/utils/i18n/toLocalizedText'
import { formatRealtimeArrival } from '~/modules/utils/route/formatRealtimeArrival'
import { normalizePlateNumb } from '~/modules/utils/route/normalizePlateNumb'

const REALTIME_POLLING_INTERVAL = 30000
const REALTIME_INITIAL_DELAY_MS = 1200
const API_FAILED_SNAPSHOT_CACHE_MS = 5000
const REALTIME_RATE_LIMIT_BACKOFF_MS = API_FAILED_SNAPSHOT_CACHE_MS + 1000

type RealtimeStop = Pick<RouteDetailStop, 'stopUID' | 'sequence'>

interface UseRouteRealtimeDataOptions {
  subRoute: Pick<RouteDetailSubRoute, 'id'> & { stops: RealtimeStop[] }
  city: CityNameType
  id: string
}

const REALTIME_INFO_STATES: Partial<
  Record<RouteRealtimeStatus, RouteRealtimeInfoState>
> = {
  [RouteRealtimeStatus.NO_REALTIME_DATA]:
    RouteRealtimeInfoState.NO_REALTIME_DATA,
  [RouteRealtimeStatus.NO_SERVICE]: RouteRealtimeInfoState.NO_SERVICE,
}

function getArrivalsByStopSequence(
  stops: RealtimeStop[],
  realtimeStops: ApiRouteRealtimeStop[],
): Map<number, ApiRealtimeArrival> {
  const toVisitKeys = (stopIds: string[]) => {
    const visitCounts = new Map<string, number>()

    return stopIds.map((stopId) => {
      const visit = visitCounts.get(stopId) ?? 0
      visitCounts.set(stopId, visit + 1)
      return `${stopId}#${visit}`
    })
  }
  const realtimeVisitKeys = toVisitKeys(realtimeStops.map(({ uuid }) => uuid))
  const arrivalsByVisit = new Map(
    realtimeStops.flatMap(({ arrival }, index) =>
      arrival ? [[realtimeVisitKeys[index], arrival] as const] : [],
    ),
  )
  const stopVisitKeys = toVisitKeys(stops.map(({ stopUID }) => stopUID))

  return new Map(
    stops.flatMap(({ sequence }, index) => {
      const arrival = arrivalsByVisit.get(stopVisitKeys[index])
      return arrival ? [[sequence, arrival] as const] : []
    }),
  )
}

export function useRouteRealtimeData(
  options: UseRouteRealtimeDataOptions | null,
) {
  const { t } = useTranslation()
  const locale = useSelector(selectLocale)
  const subRoute = options?.subRoute ?? null

  const realtimeQueryArgs = options
    ? { city: options.city, routeUID: options.id }
    : { city: CityNameType.TAIPEI, routeUID: '' }
  const [isRealtimeReady, setIsRealtimeReady] = useState(false)
  const hasOptions = options != null

  useEffect(() => {
    setIsRealtimeReady(false)

    if (!hasOptions) return

    const timeoutId = window.setTimeout(() => {
      setIsRealtimeReady(true)
    }, REALTIME_INITIAL_DELAY_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [hasOptions, options?.id, options?.city])

  const {
    data: routeRealtime,
    isError,
    isLoading: isRealtimeLoading,
    refetch,
  } = transitApi.useGetRouteRealtimeQuery(realtimeQueryArgs, {
    skip: !options || !isRealtimeReady,
    pollingInterval: REALTIME_POLLING_INTERVAL,
    skipPollingIfUnfocused: true,
    refetchOnReconnect: true,
  })
  const realtimeSubRoute = useMemo(
    () =>
      routeRealtime?.sub_routes.find(({ uuid }) => uuid === subRoute?.id) ??
      null,
    [routeRealtime, subRoute?.id],
  )
  const realtimeStatus = realtimeSubRoute?.status ?? null
  const isRealtimeRateLimited =
    realtimeStatus === RouteRealtimeStatus.RATE_LIMITED

  useEffect(() => {
    if (!isRealtimeRateLimited) return

    const timeoutId = window.setTimeout(() => {
      void refetch()
    }, REALTIME_RATE_LIMIT_BACKOFF_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isRealtimeRateLimited, refetch])

  const realtimeVehicles = useMemo(
    () => realtimeSubRoute?.vehicles ?? [],
    [realtimeSubRoute],
  )

  const realtimeBusStatuses = useMemo<RouteRealtimeBusStatus[]>(
    () =>
      realtimeVehicles.flatMap(({ near_stop, plate_number, state }) =>
        near_stop && state
          ? [
              {
                id: normalizePlateNumb(plate_number),
                plateNumb: plate_number,
                stopSequence: near_stop.sequence,
                vehicleState: state,
              },
            ]
          : [],
      ),
    [realtimeVehicles],
  )

  const realtimeMapVehicles = useMemo<RouteMapVehicle[]>(
    () =>
      realtimeVehicles.flatMap(
        ({ arrival, near_stop, plate_number, position }) =>
          position
            ? [
                {
                  estimateLabel: formatRealtimeArrival(t, arrival),
                  id: normalizePlateNumb(plate_number),
                  plateNumb: plate_number,
                  position: [position.longitude, position.latitude],
                  stopName: near_stop
                    ? getLocalizedText(toLocalizedText(near_stop.name), locale)
                    : t('components.routeMap.vehiclePopup.recentStopUnknown'),
                },
              ]
            : [],
      ),
    [locale, realtimeVehicles, t],
  )

  const realtimeBusesByStopSequence = useMemo(() => {
    return realtimeBusStatuses.reduce<Map<number, RouteRealtimeBusStatus[]>>(
      (result, realtimeBus) => {
        const stopBuses = result.get(realtimeBus.stopSequence) ?? []
        stopBuses.push(realtimeBus)
        result.set(realtimeBus.stopSequence, stopBuses)
        return result
      },
      new Map(),
    )
  }, [realtimeBusStatuses])

  const estimatedArrivalLabelsByStopSequence = useMemo(() => {
    if (!subRoute || !realtimeSubRoute) return new Map<number, string>()

    const arrivals = getArrivalsByStopSequence(
      subRoute.stops,
      realtimeSubRoute.stops,
    )

    return new Map(
      [...arrivals].map(([sequence, arrival]) => [
        sequence,
        formatRealtimeArrival(t, arrival),
      ]),
    )
  }, [realtimeSubRoute, subRoute, t])

  const hasRealtimeError =
    (isError && !routeRealtime) ||
    realtimeStatus === RouteRealtimeStatus.UNAVAILABLE
  const realtimeInfoState =
    (realtimeStatus && REALTIME_INFO_STATES[realtimeStatus]) ??
    RouteRealtimeInfoState.NORMAL

  return {
    estimatedArrivalLabelsByStopSequence,
    hasRealtimeError,
    isRealtimeLoading,
    isRealtimeRateLimited,
    realtimeMapVehicles,
    realtimeBusesByStopSequence,
    realtimeBusStatuses,
    realtimeInfoState,
  }
}
