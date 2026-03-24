import type { TFunction } from 'i18next'
import { cityTranslationKeyMap } from '../../consts/city'
import type { CityNameType } from '../../enums/CityNameType'

export function getCityLabel(t: TFunction, city: CityNameType) {
  return t(cityTranslationKeyMap[city])
}
