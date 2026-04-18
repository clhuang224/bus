import { bearingTranslationKeyMap } from '../../consts/bearing'
import { BearingType } from '../../enums/BearingType'

export function getBearingTranslationKey(bearing: BearingType) {
  return bearingTranslationKeyMap[bearing]
}
