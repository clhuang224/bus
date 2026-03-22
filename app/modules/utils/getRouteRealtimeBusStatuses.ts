import { stopStatusMapLabel } from '../consts/stopStatus'
import { StopStatusType } from '../enums/StopStatusType'
import type { EstimatedArrival } from '../interfaces/EstimatedArrival'
import type { RealtimeNearStop } from '../interfaces/RealtimeNearStop'
import type { RouteRealtimeBusStatus } from '../interfaces/RouteRealtimeBusStatus'

function normalizePlateNumb(plateNumb: string | null | undefined) {
  return plateNumb?.trim().toUpperCase() ?? null
}

function getRealtimeFallbackLabel(stopStatus: StopStatusType) {
  if ([StopStatusType.NOT_YET_DEPARTED, StopStatusType.UNKNOWN].includes(stopStatus)) {
    return '行駛中'
  }

  return stopStatusMapLabel[stopStatus]
}

function isStrongArrivalMatch(estimatedArrival: EstimatedArrival | undefined) {
  if (!estimatedArrival) {
    return false
  }

  if (estimatedArrival.EstimateTime != null) {
    return true
  }

  return ![
    StopStatusType.NORMAL,
    StopStatusType.NOT_YET_DEPARTED,
    StopStatusType.UNKNOWN
  ].includes(estimatedArrival.StopStatus)
}

export function formatEstimatedArrivalLabel(estimateTime: number | null, stopStatus: StopStatusType) {
  if (estimateTime != null) {
    if (estimateTime <= 60) return '即將進站'
    return `${Math.ceil(estimateTime / 60)} 分後到站`
  }
  if (stopStatus === StopStatusType.NORMAL) return '暫無預估'
  return stopStatusMapLabel[stopStatus]
}

export function getRouteRealtimeBusStatuses(
  realtimeBuses: RealtimeNearStop[],
  estimatedArrivals: EstimatedArrival[]
): RouteRealtimeBusStatus[] {
  return realtimeBuses
    .map((realtimeBus) => {
      const realtimePlateNumb = normalizePlateNumb(realtimeBus.PlateNumb)
      const plateMatchedArrival = estimatedArrivals.find((estimatedArrival) => {
        const estimatedArrivalPlateNumb = normalizePlateNumb(estimatedArrival.PlateNumb)

        if (
          realtimePlateNumb &&
          estimatedArrivalPlateNumb &&
          realtimePlateNumb === estimatedArrivalPlateNumb
        ) {
          return true
        }

        return false
      })
      const stopMatchedArrival = estimatedArrivals.find((estimatedArrival) => {
        if (
          realtimeBus.StopUID &&
          estimatedArrival.StopUID &&
          realtimeBus.StopUID === estimatedArrival.StopUID
        ) {
          return true
        }

        if (
          realtimeBus.StopID &&
          estimatedArrival.StopID &&
          realtimeBus.StopID === estimatedArrival.StopID
        ) {
          return true
        }

        return estimatedArrival.StopSequence != null &&
          realtimeBus.StopSequence === estimatedArrival.StopSequence
      })
      const nextEstimatedArrival = estimatedArrivals
        .filter((estimatedArrival) =>
          estimatedArrival.StopSequence != null &&
          estimatedArrival.StopSequence > realtimeBus.StopSequence &&
          estimatedArrival.EstimateTime != null
        )
        .sort((left, right) => {
          if (left.StopSequence == null || right.StopSequence == null) {
            return 0
          }

          return left.StopSequence - right.StopSequence
        })[0]
      const matchedArrival = plateMatchedArrival ??
        (isStrongArrivalMatch(stopMatchedArrival)
          ? stopMatchedArrival
          : nextEstimatedArrival ?? stopMatchedArrival)
      const estimateLabel = matchedArrival
        ? formatEstimatedArrivalLabel(
            matchedArrival.EstimateTime,
            matchedArrival.EstimateTime == null
              ? matchedArrival.StopStatus
              : matchedArrival.StopStatus
          )
        : getRealtimeFallbackLabel(StopStatusType.UNKNOWN)
      const shouldUseRealtimeFallbackLabel =
        matchedArrival != null &&
        matchedArrival.EstimateTime == null &&
        [StopStatusType.NOT_YET_DEPARTED, StopStatusType.UNKNOWN].includes(matchedArrival.StopStatus)

      return {
        direction: realtimeBus.Direction,
        estimateLabel: shouldUseRealtimeFallbackLabel
          ? getRealtimeFallbackLabel(matchedArrival.StopStatus)
          : estimateLabel,
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
