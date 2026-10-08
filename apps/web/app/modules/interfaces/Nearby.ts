import type {
  BearingType,
  CityNameType,
  DirectionType,
  LocalizedText,
} from '@bus/shared'
import type { LngLat } from '../types/CoordsType'

export interface NearbyStation {
  stationId: string
  name: LocalizedText
  city: CityNameType | null
  address: LocalizedText | null
  bearings: BearingType[]
  position: LngLat
}

export interface NearbyStationRoute {
  id: string
  routeUID: string
  city: CityNameType
  name: LocalizedText
  departure: LocalizedText
  destination: LocalizedText
  direction: DirectionType
}

export type NearbyStationRoutesMap = Record<string, NearbyStationRoute[]>

export interface NearbyStationsResult {
  stations: NearbyStation[]
  /**
   * Routes that arrived with the stations, or null when the data source loads
   * station routes separately through `getNearbyStationRoutes`.
   */
  routesByStationId: NearbyStationRoutesMap | null
}
