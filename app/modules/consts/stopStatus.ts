import { StopStatusType } from '../enums/StopStatusType'
import { zhTW } from '../i18n/locales/zh-TW'

type StopStatusTranslationKey = `routePage.realtime.stopStatus.${keyof typeof zhTW.translation.routePage.realtime.stopStatus}`

export const stopStatusTranslationKeyMap: Record<StopStatusType, StopStatusTranslationKey> = {
  [StopStatusType.NORMAL]: 'routePage.realtime.stopStatus.normal',
  [StopStatusType.NOT_YET_DEPARTED]: 'routePage.realtime.stopStatus.notYetDeparted',
  [StopStatusType.NO_STOP_DUE_TO_TRAFFIC_CONTROL]: 'routePage.realtime.stopStatus.noStopDueToTrafficControl',
  [StopStatusType.LAST_BUS_PASSED]: 'routePage.realtime.stopStatus.lastBusPassed',
  [StopStatusType.NOT_IN_SERVICE_TODAY]: 'routePage.realtime.stopStatus.notInServiceToday',
  [StopStatusType.UNKNOWN]: 'routePage.realtime.stopStatus.unknown'
}
