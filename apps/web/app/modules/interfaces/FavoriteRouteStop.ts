import type { CityNameType, DirectionType } from '@bus/shared'
import type { LocalizedText } from '@bus/shared'

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
