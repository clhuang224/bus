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

export function useCityByCoords(coords: [number, number] | null): CityNameType {
  const geojson = useSelector((state: RootState) => state.cityGeo.geojson)
  if (!coords || !geojson) return CityNameType.TAIPEI

  const [lat, lng] = coords
  const testPoint = point([lng, lat])

  const priorityCities: CityNameType[] = [
    CityNameType.TAIPEI,
    CityNameType.KEELUNG,
    CityNameType.HSINCHU,
    CityNameType.TAICHUNG,
    CityNameType.CHIAYI,
    CityNameType.TAINAN
  ]

  for (const feature of geojson.features as CityFeature[]) {
    const cityEnum = Object.values(CityNameType).find(
      v => v === feature.properties.name
    ) as CityNameType | undefined
    if (cityEnum && priorityCities.includes(cityEnum)) {
      if (booleanPointInPolygon(testPoint, feature)) {
        return cityEnum
      }
    }
  }
  for (const feature of geojson.features as CityFeature[]) {
    const cityEnum = Object.values(CityNameType).find(
      v => v === feature.properties.name
    ) as CityNameType | undefined
    if (cityEnum && booleanPointInPolygon(testPoint, feature)) {
      return cityEnum
    }
  }
  console.warn(`無法判斷座標 [${lat}, ${lng}] 所屬縣市，預設返回台北市`)
  return CityNameType.TAIPEI
}
