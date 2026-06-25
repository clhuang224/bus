import type { BearingType, CityNameType } from '../../enums/index.js'
import type { TdxLocalizedText } from './BusRoute.js'

export interface TdxStopPosition {
  PositionLon: number
  PositionLat: number
  GeoHash?: string | null
}

export interface TdxStop {
  StopUID: string
  StopID: string
  AuthorityID: string
  StationID: string | null
  StationGroupID: string
  StopName: TdxLocalizedText
  StopPosition: TdxStopPosition
  StopAddress?: string | null
  Bearing?: BearingType | null
  StopDescription?: string | null
  City?: CityNameType | '' | null
  UpdateTime: string
  VersionID: number
}
