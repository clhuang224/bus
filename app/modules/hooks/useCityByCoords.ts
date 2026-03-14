import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point } from '@turf/helpers'
import type { Feature, Polygon } from 'geojson'
import { CityNameType } from '../enums/CityNameType'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'

interface CityProperties {
  name: string
  nameTw: string
}
type CityFeature = Feature<Polygon, CityProperties>

const DEFAULT_CITY = CityNameType.TAIPEI

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

export function useCityByCoords(coords: [number, number] | null): CityNameType {
  const geojson = useSelector((state: RootState) => state.cityGeo.geojson)
  if (!coords || !geojson) return DEFAULT_CITY

  const [lat, lng] = coords
  const testPoint = point([lng, lat])

  const cityFeatures = geojson.features as CityFeature[]

  const findCity = (features: CityFeature[]) => {
    for (const feature of features) {
      const city = getCityFromFeature(feature)
      if (!city) continue
      if (booleanPointInPolygon(testPoint, feature)) {
        return city
      }
    }
    return null
  }

  const priorityFeatures = cityFeatures.filter((feature) => {
    const city = getCityFromFeature(feature)
    return city ? priorityCities.includes(city) : false
  })

  const priorityCity = findCity(priorityFeatures)
  if (priorityCity) return priorityCity

  const city = findCity(cityFeatures)
  if (city) return city

  console.warn(`無法判斷座標 [${lat}, ${lng}] 所屬縣市，預設返回台北市`)
  return DEFAULT_CITY
}
