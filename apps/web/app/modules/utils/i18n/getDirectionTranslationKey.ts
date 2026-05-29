import { directionTranslationKeyMap } from '../../consts/direction'
import { DirectionType } from '../../enums/DirectionType'

export function getDirectionTranslationKey(direction: DirectionType) {
  return directionTranslationKeyMap[direction] ?? directionTranslationKeyMap[DirectionType.UNKNOWN]
}
