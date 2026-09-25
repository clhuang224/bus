import type { AppLocaleType } from '../enums/AppLocaleType.js'
import type { BearingType } from '../enums/BearingType.js'
import type { CityNameType } from '../enums/CityNameType.js'
import type { DirectionType } from '../enums/DirectionType.js'
import type { LocalizedText } from './LocalizedText.js'

export type ApiLocalizedText = LocalizedText<
  AppLocaleType.ZH_TW | AppLocaleType.EN
>

export interface ApiPosition {
  latitude: number
  longitude: number
}

export interface ApiStationRoute {
  uuid: string
  city: CityNameType
  name: ApiLocalizedText
  departure: ApiLocalizedText
  destination: ApiLocalizedText
}

export interface ApiStationRouteDirection {
  direction: DirectionType
  routes: ApiStationRoute[]
}

export interface ApiStation {
  uuid: string
  city: CityNameType
  name: ApiLocalizedText
  address: ApiLocalizedText | null
  bearing: BearingType | null
  position: ApiPosition
  distance_meters: number
  route_directions: ApiStationRouteDirection[]
}

export interface StationsResponse {
  stations: ApiStation[]
}
