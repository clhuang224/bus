import { cityTranslationKeyMap } from '../../consts/city'
import type { CityNameType } from '../../enums/CityNameType'

export function getCityTranslationKey(city: CityNameType) {
  return cityTranslationKeyMap[city]
}
