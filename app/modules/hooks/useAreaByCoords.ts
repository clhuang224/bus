import { cityMapArea } from '../consts/area'
import { AreaType } from '../enums/AreaType'
import { useCityByCoords } from './useCityByCoords'

export function useAreaByCoords(coords: [number, number] | null): AreaType {
  const city = useCityByCoords(coords)
  return cityMapArea[city] ?? AreaType.TAIPEI
}
