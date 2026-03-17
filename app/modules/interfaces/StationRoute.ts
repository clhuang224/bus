import type { CityNameType } from '../enums/CityNameType'
import type { DirectionType } from '../enums/DirectionType'

export interface StationRoute {
  id: string
  routeUID: string
  city: CityNameType
  name: string
  destination: string
  direction: DirectionType
}
