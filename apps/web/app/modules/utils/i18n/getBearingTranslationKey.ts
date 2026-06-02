import { bearingTranslationKeyMap } from '../../consts/bearing'
import { BearingType } from '@bus/shared'

export function getBearingTranslationKey(bearing: BearingType) {
  return bearingTranslationKeyMap[bearing]
}
