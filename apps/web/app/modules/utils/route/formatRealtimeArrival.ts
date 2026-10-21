import type { TFunction } from 'i18next'
import { RealtimeArrivalStatus, type ApiRealtimeArrival } from '@bus/shared'

export function formatRealtimeArrival(
  t: TFunction,
  arrival: ApiRealtimeArrival,
): string {
  switch (arrival.status) {
    case RealtimeArrivalStatus.COMING_SOON:
      return t('routePage.realtime.comingSoon')
    case RealtimeArrivalStatus.MINUTES:
      return arrival.minutes == null
        ? t('routePage.realtime.noEstimate')
        : t('routePage.realtime.minutesAway', { count: arrival.minutes })
    case RealtimeArrivalStatus.NO_ESTIMATE:
      return t('routePage.realtime.noEstimate')
    case RealtimeArrivalStatus.NOT_YET_DEPARTED:
      return t('routePage.realtime.stopStatus.notYetDeparted')
    case RealtimeArrivalStatus.NO_STOP_DUE_TO_TRAFFIC_CONTROL:
      return t('routePage.realtime.stopStatus.noStopDueToTrafficControl')
    case RealtimeArrivalStatus.LAST_BUS_PASSED:
      return t('routePage.realtime.stopStatus.lastBusPassed')
    case RealtimeArrivalStatus.NOT_IN_SERVICE_TODAY:
      return t('routePage.realtime.stopStatus.notInServiceToday')
    case RealtimeArrivalStatus.IN_SERVICE:
      return t('routePage.realtime.inService')
    case RealtimeArrivalStatus.UNKNOWN:
      return t('routePage.realtime.stopStatus.unknown')
  }
}
