import type { BearingType, CityNameType } from '../../enums/index.js'
import type { TdxLocalizedText } from './BusRoute.js'
import type { TdxStopPosition } from './Stop.js'

export interface TdxStation {
  StationUID: string
  StationID: string
  StationGroupUID?: string | null
  StationName: TdxLocalizedText
  StationPosition: TdxStopPosition
  StationAddress?: string | null
  Bearing?: BearingType | null
  City?: CityNameType | '' | null
  UpdateTime: string
  VersionID: number
}
