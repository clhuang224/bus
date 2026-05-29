import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point } from '@turf/helpers'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { cityMapNameToCity, countyIdMapCity } from '../../consts/city'
import { CityNameType } from '../../enums/CityNameType'
import { CountyIdType } from '../../enums/CountyIdType'
import type { LatLng } from '../../types/CoordsType'

interface CityProperties {
  name?: string
  nameTw?: string
  COUNTYID?: string
  COUNTYENG?: string
  COUNTYNAME?: string
}

type CityFeature = Feature<Polygon | MultiPolygon, CityProperties>

export const DEFAULT_CITY = CityNameType.TAIPEI

const cityNameSet = new Set(Object.values(CityNameType))

function getCityByCountyId(feature: CityFeature): CityNameType | null {
  const countyId = feature.properties.COUNTYID
  if (countyId && countyId in countyIdMapCity) {
    return countyIdMapCity[countyId as CountyIdType]
  }

  return null
}

function getCityByEnglishName(feature: CityFeature): CityNameType | null {
  const englishName = feature.properties.name ?? feature.properties.COUNTYENG
  if (englishName && cityNameSet.has(englishName as CityNameType)) {
    return englishName as CityNameType
  }

  return null
}

function getCityByChineseName(feature: CityFeature): CityNameType | null {
  const chineseName = feature.properties.nameTw ?? feature.properties.COUNTYNAME
  if (chineseName) {
    return cityMapNameToCity[chineseName] ?? null
  }

  return null
}

function getCityFromFeature(feature: CityFeature): CityNameType | null {
  const cityByCountyId = getCityByCountyId(feature)
  if (cityByCountyId) return cityByCountyId

  const cityByEnglishName = getCityByEnglishName(feature)
  if (cityByEnglishName) return cityByEnglishName

  const cityByChineseName = getCityByChineseName(feature)
  if (cityByChineseName) return cityByChineseName

  return null
}

function findCityByPoint(testPoint: ReturnType<typeof point>, features: CityFeature[]): CityNameType | null {
  for (const feature of features) {
    const city = getCityFromFeature(feature)
    if (!city) continue
    if (booleanPointInPolygon(testPoint, feature)) {
      return city
    }
  }
  return null
}

export function getCityByCoords(coords: LatLng | null, geojson: FeatureCollection | null): CityNameType {
  if (!coords || !geojson) return DEFAULT_CITY

  const [lat, lng] = coords
  const testPoint = point([lng, lat])
  const cityFeatures = geojson.features as CityFeature[]

  const city = findCityByPoint(testPoint, cityFeatures)
  if (city) return city

  console.warn(`Unable to determine the city for coordinates [${lat}, ${lng}]. Falling back to Taipei.`)
  return DEFAULT_CITY
}
