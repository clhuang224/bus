import type { CityNameType } from '../enums/CityNameType'
import type { LngLat } from '../types/CoordsType'
import type { LocalizedText } from '../types/LocalizedText'
import type { Stop } from './Stop'

export interface NearbyStopGroup {
  StationID: string
  StopName: LocalizedText
  City: CityNameType | null
  position: LngLat
  stops: Stop[]
}
