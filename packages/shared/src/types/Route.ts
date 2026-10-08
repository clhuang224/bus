import type { CityNameType } from '../enums/CityNameType.js'
import type { ApiLocalizedText } from './Station.js'

export interface ApiRouteSummary {
  uuid: string
  city: CityNameType
  name: ApiLocalizedText
  departure: ApiLocalizedText
  destination: ApiLocalizedText
}

export interface RoutesResponse {
  routes: ApiRouteSummary[]
}
