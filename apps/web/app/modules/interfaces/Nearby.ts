import type { CityNameType } from '@bus/shared'
import type { LngLat } from '../types/CoordsType'
import type { LocalizedText } from '@bus/shared'
import type { Stop } from './Stop'

export interface NearbyStopGroup {
  StationID: string
  StopName: LocalizedText
  City: CityNameType | null
  position: LngLat
  stops: Stop[]
}
