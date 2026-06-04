import type { CityNameType, DirectionType } from '@bus/shared'

export interface StationRoute {
  id: string
  routeUID: string
  city: CityNameType
  name: string
  departure: string
  destination: string
  direction: DirectionType
}
