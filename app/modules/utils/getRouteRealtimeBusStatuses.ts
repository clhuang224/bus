import { stopStatusMapLabel } from '../consts/stopStatus'
import { StopStatusType } from '../enums/StopStatusType'
import type { EstimatedArrival } from '../interfaces/EstimatedArrival'
import type { RealtimeNearStop } from '../interfaces/RealtimeNearStop'
import type { RouteRealtimeBusStatus } from '../interfaces/RouteRealtimeBusStatus'

function formatEstimatedArrival(estimateTime: number | null, stopStatus: StopStatusType) {
  if (estimateTime != null) {
    if (estimateTime <= 60) return '即將進站'
    return `${Math.ceil(estimateTime / 60)} 分`
  }

  return stopStatusMapLabel[stopStatus]
}

export function getRouteRealtimeBusStatuses(
  realtimeBuses: RealtimeNearStop[],
  estimatedArrivals: EstimatedArrival[]
): RouteRealtimeBusStatus[] {
  return realtimeBuses
    .map((realtimeBus) => {
      const matchedArrival = estimatedArrivals.find((estimatedArrival) => {
        if (
          realtimeBus.PlateNumb &&
          estimatedArrival.PlateNumb &&
          realtimeBus.PlateNumb === estimatedArrival.PlateNumb
        ) {
          return true
        }

        return realtimeBus.StopUID === estimatedArrival.StopUID
      })

      return {
        direction: realtimeBus.Direction,
        estimateLabel: formatEstimatedArrival(
          matchedArrival?.EstimateTime ?? null,
          matchedArrival?.StopStatus ?? StopStatusType.UNKNOWN
        ),
        estimateMinutes: matchedArrival?.EstimateTime != null
          ? Math.ceil(matchedArrival.EstimateTime / 60)
          : null,
        id: realtimeBus.PlateNumb ?? `${realtimeBus.SubRouteUID}-${realtimeBus.Direction}-${realtimeBus.StopUID}`,
        plateNumb: realtimeBus.PlateNumb,
        position: realtimeBus.position,
        stopName: realtimeBus.StopName.zh_TW,
        stopSequence: realtimeBus.StopSequence,
        subRouteUID: realtimeBus.SubRouteUID
      }
    })
    .sort((left, right) => {
      if (left.estimateMinutes == null && right.estimateMinutes == null) {
        return left.stopSequence - right.stopSequence
      }
      if (left.estimateMinutes == null) return 1
      if (right.estimateMinutes == null) return -1
      return left.estimateMinutes - right.estimateMinutes
    })
}
