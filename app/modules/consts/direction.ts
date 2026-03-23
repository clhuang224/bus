import { DirectionType } from '../enums/DirectionType'
import type { zhTW } from '../i18n/locales/zh-TW'

type DirectionTranslationKey = `common.direction.${keyof typeof zhTW.translation.common.direction}`

export const directionTranslationKeyMap: Record<DirectionType, DirectionTranslationKey> = {
  [DirectionType.GO]: 'common.direction.go',
  [DirectionType.RETURN]: 'common.direction.return',
  [DirectionType.LOOP]: 'common.direction.loop',
  [DirectionType.SHUTTLE]: 'common.direction.shuttle',
  [DirectionType.UNKNOWN]: 'common.direction.unknown'
}
