import type { BearingType, CityNameType, LocalizedText } from '@bus/shared'
import type { LngLat } from '../types/CoordsType'
import type { StationRoute } from './StationRoute'

export interface NearbyStation {
  stationId: string
  name: LocalizedText
  city: CityNameType | null
  address: LocalizedText | null
  bearings: BearingType[]
  position: LngLat
  routes: StationRoute[]
}
