import type { LocalizedText } from './LocalizedText'

export interface BusSubRoute {
  cityName: string,
  id: string,
  name: LocalizedText,
  type: number
}

export interface BusRoute extends BusSubRoute {
  subRoutes: BusSubRoute[],
  departure: LocalizedText,
  destination: LocalizedText
}
