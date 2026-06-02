import { cityTranslationKeyMap } from '../../consts/city'
import type { CityNameType } from '@bus/shared'

export function getCityTranslationKey(city: CityNameType) {
  return cityTranslationKeyMap[city]
}
