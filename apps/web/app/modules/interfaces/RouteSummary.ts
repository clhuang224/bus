import type { CityNameType, LocalizedText } from '@bus/shared'

export interface RouteSummary {
  routeUID: string
  city: CityNameType
  name: LocalizedText
  departure: LocalizedText
  destination: LocalizedText
}
