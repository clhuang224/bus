import { TdxStopStatus } from '@bus/shared'

type ZhTWLocale = typeof import('../i18n/locales/zh-TW').zhTW
type StopStatusTranslationKey =
  `routePage.realtime.stopStatus.${keyof ZhTWLocale['translation']['routePage']['realtime']['stopStatus']}`

export const stopStatusTranslationKeyMap: Record<
  TdxStopStatus,
  StopStatusTranslationKey
> = {
  [TdxStopStatus.NORMAL]: 'routePage.realtime.stopStatus.normal',
  [TdxStopStatus.NOT_YET_DEPARTED]:
    'routePage.realtime.stopStatus.notYetDeparted',
  [TdxStopStatus.NO_STOP_DUE_TO_TRAFFIC_CONTROL]:
    'routePage.realtime.stopStatus.noStopDueToTrafficControl',
  [TdxStopStatus.LAST_BUS_PASSED]:
    'routePage.realtime.stopStatus.lastBusPassed',
  [TdxStopStatus.NOT_IN_SERVICE_TODAY]:
    'routePage.realtime.stopStatus.notInServiceToday',
  [TdxStopStatus.UNKNOWN]: 'routePage.realtime.stopStatus.unknown',
}
