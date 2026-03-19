import type { CityNameType } from '../enums/CityNameType'
import type { DirectionType } from '../enums/DirectionType'
import type { LocalizedText, TdxLocalizedText } from '../types/LocalizedText'
import type { LngLat } from '../types/CoordsType'

export interface TdxRouteShape {
  RouteUID: string
  RouteID: string
  RouteName: TdxLocalizedText
  SubRouteUID: string | null
  SubRouteID: string | null
  SubRouteName: TdxLocalizedText | null
  Direction: DirectionType
  Geometry?: string | null
  EncodedPolyline?: string | null
  UpdateTime: string
  VersionID: number
}

export interface RouteShape extends Omit<TdxRouteShape, 'RouteName' | 'SubRouteName' | 'Geometry' | 'EncodedPolyline'> {
  City: CityNameType
  RouteName: LocalizedText
  SubRouteName: LocalizedText | null
  path: LngLat[]
}
