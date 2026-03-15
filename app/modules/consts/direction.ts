import { DirectionType } from '../enums/DirectionType'

export const directionMapName: Record<DirectionType, string> = {
  [DirectionType.GO]: '去程',
  [DirectionType.RETURN]: '返程',
  [DirectionType.LOOP]: '迴圈',
  [DirectionType.SHUTTLE]: '循環',
  [DirectionType.UNKNOWN]: '未知'
}
