import { CityNameType } from '@bus/shared'
import { getEnumValues } from './getEnumValues'

const cityNameValues = getEnumValues(CityNameType)

export function isCityName(value: unknown): value is CityNameType {
  return typeof value === 'string' && cityNameValues.includes(value as CityNameType)
}
