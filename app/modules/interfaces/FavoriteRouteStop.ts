import type { CityNameType } from '../enums/CityNameType'
import type { DirectionType } from '../enums/DirectionType'
import type { LocalizedText } from '../types/LocalizedText'

export interface FavoriteRouteStop {
  favoriteId: string
  city: CityNameType
  routeUID: string
  routeName: LocalizedText
  subRouteUID: string
  subRouteName: LocalizedText
  direction: DirectionType
  stopUID: string
  stopID: string
  stationID: string | null
  stationKey: string
  stopName: LocalizedText
  stopSequence: number
  departure: LocalizedText
  destination: LocalizedText
}
