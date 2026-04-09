import type { TFunction } from 'i18next'
import { A2EventType } from '../../enums/A2EventType'
import type { AppLocaleType } from '../../enums/AppLocaleType'
import { stopStatusTranslationKeyMap } from '../../consts/stopStatus'
import { StopStatusType } from '../../enums/StopStatusType'
import type { EstimatedArrival } from '../../interfaces/EstimatedArrival'
import type { RealtimeNearStop } from '../../interfaces/RealtimeNearStop'
import type { RouteRealtimeBusStatus } from '../../interfaces/RouteRealtimeBusStatus'
import { getLocalizedText } from '../i18n/getLocalizedText'
import { normalizePlateNumb } from './normalizePlateNumb'

function getStopStatusLabel(t: TFunction, stopStatus: StopStatusType) {
  return t(stopStatusTranslationKeyMap[stopStatus])
}

function getRealtimeFallbackLabel(t: TFunction, stopStatus: StopStatusType) {
  if ([StopStatusType.NOT_YET_DEPARTED, StopStatusType.UNKNOWN].includes(stopStatus)) {
    return t('routePage.realtime.inService')
  }

  return getStopStatusLabel(t, stopStatus)
}

export function formatEstimatedArrivalLabel(t: TFunction, estimateTime: number | null, stopStatus: StopStatusType) {
  if (estimateTime != null) {
    if (estimateTime <= 60) return t('routePage.realtime.comingSoon')
    const minutes = Math.ceil(estimateTime / 60)
    return t('routePage.realtime.minutesAway', { count: minutes })
  }
  if (stopStatus === StopStatusType.NORMAL) return t('routePage.realtime.noEstimate')
  return getStopStatusLabel(t, stopStatus)
}

export function getRouteRealtimeBusStatuses(
  t: TFunction,
  locale: AppLocaleType,
  realtimeBuses: RealtimeNearStop[],
  estimatedArrivals: EstimatedArrival[]
): RouteRealtimeBusStatus[] {
  return realtimeBuses
    .map((realtimeBus) => {
      const realtimePlateNumb = normalizePlateNumb(realtimeBus.PlateNumb)
      const plateMatchedArrival = estimatedArrivals.find((estimatedArrival) => {
        if (!estimatedArrival.PlateNumb) {
          return false
        }

        const estimatedArrivalPlateNumb = normalizePlateNumb(estimatedArrival.PlateNumb)

        if (
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
      const matchedArrival = realtimeBus.A2EventType === A2EventType.DEPARTED
        ? nextEstimatedArrival ?? plateMatchedArrival ?? stopMatchedArrival
        : stopMatchedArrival ?? plateMatchedArrival ?? nextEstimatedArrival
      const estimateLabel = matchedArrival
        ? formatEstimatedArrivalLabel(t, matchedArrival.EstimateTime, matchedArrival.StopStatus)
        : getRealtimeFallbackLabel(t, StopStatusType.UNKNOWN)
      const shouldUseRealtimeFallbackLabel =
        matchedArrival != null &&
        matchedArrival.EstimateTime == null &&
        [StopStatusType.NOT_YET_DEPARTED, StopStatusType.UNKNOWN].includes(matchedArrival.StopStatus)

      return {
        direction: realtimeBus.Direction,
        estimateLabel: shouldUseRealtimeFallbackLabel
          ? getRealtimeFallbackLabel(t, matchedArrival.StopStatus)
          : estimateLabel,
        estimateMinutes: matchedArrival?.EstimateTime != null
          ? Math.ceil(matchedArrival.EstimateTime / 60)
          : null,
        id: realtimePlateNumb,
        plateNumb: realtimeBus.PlateNumb,
        stopName: getLocalizedText(realtimeBus.StopName, locale),
        stopSequence: realtimeBus.StopSequence,
        subRouteUID: realtimeBus.SubRouteUID ?? ''
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
