import type { BearingType, CityNameType } from '@bus/shared'
import type { LngLat } from '../types/CoordsType'
import type { LocalizedText, TdxLocalizedText } from '@bus/shared'

export interface TdxStopPosition {
  PositionLon: number
  PositionLat: number
  GeoHash: string | null
}

export interface TdxStop {
  StopUID: string
  StopID: string
  AuthorityID: string
  StationID: string | null
  StationGroupID: string
  StopName: TdxLocalizedText
  StopPosition: TdxStopPosition
  StopAddress: string | null
  Bearing: BearingType | null
  StopDescription: string | null
  City: CityNameType | ''
  UpdateTime: string
  VersionID: number
}

export interface Stop {
  StopUID: string
  StopID: string
  AuthorityID: string
  StationID: string | null
  StationGroupID: string
  position: LngLat
  GeoHash: string | null
  StopName: LocalizedText
  StopAddress: string | null
  Bearing: BearingType | null
  StopDescription: string | null
  City: CityNameType | null
  UpdateTime: string
  VersionID: number
}
