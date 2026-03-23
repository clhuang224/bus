import { DirectionType } from '../enums/DirectionType'

type ZhTWLocale = typeof import('../i18n/locales/zh-TW').zhTW
type DirectionTranslationKey = `common.direction.${keyof ZhTWLocale['translation']['common']['direction']}`

export const directionTranslationKeyMap: Record<DirectionType, DirectionTranslationKey> = {
  [DirectionType.GO]: 'common.direction.go',
  [DirectionType.RETURN]: 'common.direction.return',
  [DirectionType.LOOP]: 'common.direction.loop',
  [DirectionType.SHUTTLE]: 'common.direction.shuttle',
  [DirectionType.UNKNOWN]: 'common.direction.unknown'
}
