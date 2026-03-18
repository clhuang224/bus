import type { CityNameType } from '../enums/CityNameType'
import type { DirectionType } from '../enums/DirectionType'

export interface FavoriteRouteStop {
  favoriteId: string
  city: CityNameType
  routeUID: string
  routeName: string
  subRouteUID: string
  subRouteName: string
  direction: DirectionType
  stopUID: string
  stopID: string
  stationID: string | null
  stationKey: string
  stopName: string
  stopSequence: number
  departure: string
  destination: string
}
