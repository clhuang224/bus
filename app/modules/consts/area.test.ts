import { describe, expect, it } from 'vitest'
import { areaMapCity, areaTranslationKeyMap, cityMapArea } from './area'
import { AreaType } from '../enums/AreaType'
import { CityNameType } from '../enums/CityNameType'
import { getEnumValues } from '../utils/getEnumValues'

describe('area mappings', () => {
  it('defines a display name and at least one city for every area', () => {
    const areas = getEnumValues(AreaType)

    areas.forEach((area) => {
      expect(areaTranslationKeyMap[area]).toBeTruthy()
      expect(areaMapCity[area]).toBeDefined()
      expect(areaMapCity[area]).not.toHaveLength(0)
    })
  })

  it('assigns every TDX city to exactly one area', () => {
    const mappedCities = Object.values(areaMapCity).flat()
    const uniqueMappedCities = new Set(mappedCities)
    const cities = getEnumValues(CityNameType)

    expect(mappedCities).toHaveLength(cities.length)
    expect(uniqueMappedCities.size).toBe(mappedCities.length)

    cities.forEach((city) => {
      expect(uniqueMappedCities.has(city)).toBe(true)
    })
  })

  it('keeps cityMapArea in sync with areaMapCity', () => {
    Object.entries(areaMapCity).forEach(([area, cities]) => {
      cities.forEach((city) => {
        expect(cityMapArea[city]).toBe(area)
      })
    })
  })
})
