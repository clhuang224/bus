import type { TFunction } from 'i18next'
import { areaTranslationKeyMap } from '../consts/area'
import type { AreaType } from '../enums/AreaType'

export function getAreaLabel(t: TFunction, area: AreaType) {
  return t(areaTranslationKeyMap[area])
}
