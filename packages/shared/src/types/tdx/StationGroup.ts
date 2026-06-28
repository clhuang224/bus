import type { CityNameType } from '../../enums/index.js'
import type { TdxLocalizedText } from './BusRoute.js'
import type { TdxStopPosition } from './Stop.js'

export interface TdxStationGroup {
  StationGroupUID: string
  StationGroupID: string
  StationGroupName: TdxLocalizedText
  StationGroupPosition: TdxStopPosition
  City?: CityNameType | '' | null
  UpdateTime: string
  VersionID: number
}
