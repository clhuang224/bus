import type { TFunction } from 'i18next'
import { directionTranslationKeyMap } from '../../consts/direction'
import { DirectionType } from '../../enums/DirectionType'

export function getDirectionLabel(t: TFunction, direction: DirectionType) {
  return t(directionTranslationKeyMap[direction] ?? directionTranslationKeyMap[DirectionType.UNKNOWN])
}
