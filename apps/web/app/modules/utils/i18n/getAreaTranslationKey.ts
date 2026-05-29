import { areaTranslationKeyMap } from '../../consts/area'
import type { AreaType } from '../../enums/AreaType'

export function getAreaTranslationKey(area: AreaType) {
  return areaTranslationKeyMap[area]
}
