import { BearingType } from '../enums/BearingType'

type ZhTWLocale = typeof import('../i18n/locales/zh-TW').zhTW
type BearingTranslationKey = `common.bearing.${keyof ZhTWLocale['translation']['common']['bearing']}`

export const bearingTranslationKeyMap: Record<BearingType, BearingTranslationKey> = {
  [BearingType.EAST]: 'common.bearing.east',
  [BearingType.WEST]: 'common.bearing.west',
  [BearingType.SOUTH]: 'common.bearing.south',
  [BearingType.NORTH]: 'common.bearing.north',
  [BearingType.SOUTHEAST]: 'common.bearing.southeast',
  [BearingType.NORTHEAST]: 'common.bearing.northeast',
  [BearingType.SOUTHWEST]: 'common.bearing.southwest',
  [BearingType.NORTHWEST]: 'common.bearing.northwest'
}
