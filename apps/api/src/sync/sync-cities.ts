import { CityNameType, getEnumValues } from '@bus/shared'

const SYNC_CITIES_ENV = 'SYNC_CITIES'

export function resolveSyncCities(): CityNameType[] {
  const configuredCities = process.env[SYNC_CITIES_ENV]

  if (!configuredCities) return getEnumValues(CityNameType)

  const cityByName = new Map(
    getEnumValues(CityNameType).map((city) => [city, city]),
  )
  const cities = configuredCities
    .split(',')
    .map((city) => city.trim())
    .filter(Boolean)
    .map((city) => {
      const knownCity = cityByName.get(city as CityNameType)

      if (!knownCity) {
        throw new Error(
          `Invalid ${SYNC_CITIES_ENV} value "${city}". Use TDX city names like Taipei or NewTaipei.`,
        )
      }

      return knownCity
    })

  if (cities.length === 0) {
    throw new Error(`${SYNC_CITIES_ENV} must include at least one city.`)
  }

  return [...new Set(cities)]
}
