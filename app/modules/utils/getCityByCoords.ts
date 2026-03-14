import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point } from '@turf/helpers'
import type { Feature, FeatureCollection, Polygon } from 'geojson'
import { CityNameType } from '../enums/CityNameType'
import type { LatLng } from '../types/CoordsType'

interface CityProperties {
  name: string
  nameTw: string
}

type CityFeature = Feature<Polygon, CityProperties>

export const DEFAULT_CITY = CityNameType.TAIPEI

const priorityCities: CityNameType[] = [
  CityNameType.TAIPEI,
  CityNameType.KEELUNG,
  CityNameType.HSINCHU,
  CityNameType.TAICHUNG,
  CityNameType.CHIAYI,
  CityNameType.TAINAN
]

const cityNameSet = new Set(Object.values(CityNameType))

function getCityFromFeature(feature: CityFeature): CityNameType | null {
  const cityName = feature.properties.name
  if (!cityNameSet.has(cityName as CityNameType)) return null
  return cityName as CityNameType
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

  const priorityFeatures = cityFeatures.filter((feature) => {
    const city = getCityFromFeature(feature)
    return city ? priorityCities.includes(city) : false
  })

  const priorityCity = findCityByPoint(testPoint, priorityFeatures)
  if (priorityCity) return priorityCity

  const city = findCityByPoint(testPoint, cityFeatures)
  if (city) return city

  console.warn(`Unable to determine the city for coordinates [${lat}, ${lng}]. Falling back to Taipei.`)
  return DEFAULT_CITY
}
