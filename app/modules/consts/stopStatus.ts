import { StopStatusType } from '../enums/StopStatusType'

export const stopStatusMapLabel: Record<StopStatusType, string> = {
  [StopStatusType.NORMAL]: '正常',
  [StopStatusType.NOT_YET_DEPARTED]: '尚未發車',
  [StopStatusType.NO_STOP_DUE_TO_TRAFFIC_CONTROL]: '交管不停靠',
  [StopStatusType.LAST_BUS_PASSED]: '末班已過',
  [StopStatusType.NOT_IN_SERVICE_TODAY]: '今日未營運',
  [StopStatusType.UNKNOWN]: '未知狀態'
}
