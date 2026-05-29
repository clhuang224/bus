import type { BearingType } from '../enums/BearingType'
import type { CityNameType } from '../enums/CityNameType'
import type { LngLat } from '../types/CoordsType'
import type { LocalizedText, TdxLocalizedText } from '../types/LocalizedText'

export interface TdxStop {
  StopUID: string,
  StopID: string,
  AuthorityID: string,
  StationID: string | null,
  StationGroupID: string,
  StopName: TdxLocalizedText,
  StopPosition: {
    PositionLon: number,
    PositionLat: number
    GeoHash: string | null
  }
  StopAddress: string | null
  Bearing: BearingType | null
  StopDescription: string | null
  City: CityNameType | ''
  UpdateTime: string
  VersionID: number
}

export interface Stop {
  StopUID: string,
  StopID: string,
  AuthorityID: string,
  StationID: string | null,
  StationGroupID: string,
  position: LngLat
  GeoHash: string | null
  StopName: LocalizedText,
  StopAddress: string | null
  Bearing: BearingType | null
  StopDescription: string | null
  City: CityNameType | null
  UpdateTime: string
  VersionID: number
}
