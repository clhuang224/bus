import { directionTranslationKeyMap } from '../../consts/direction'
import { DirectionType } from '@bus/shared'

export function getDirectionTranslationKey(direction: DirectionType) {
  return (
    directionTranslationKeyMap[direction] ??
    directionTranslationKeyMap[DirectionType.UNKNOWN]
  )
}
