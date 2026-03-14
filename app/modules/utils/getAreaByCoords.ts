import type { FeatureCollection } from 'geojson'
import { cityMapArea } from '../consts/area'
import { AreaType } from '../enums/AreaType'
import type { LatLng } from '../types/CoordsType'
import { getCityByCoords } from './getCityByCoords'

export function getAreaByCoords(coords: LatLng | null, geojson: FeatureCollection | null): AreaType {
  const city = getCityByCoords(coords, geojson)
  return cityMapArea[city] ?? AreaType.TAIPEI
}
