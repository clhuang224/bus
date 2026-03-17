import type { DirectionType } from '../enums/DirectionType'

export interface StationRoute {
  id: string
  routeUID: string
  name: string
  destination: string
  direction: DirectionType
}
