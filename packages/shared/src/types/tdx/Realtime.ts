import type { DirectionType } from '../../enums/DirectionType.js'
import type { TdxA2EventType } from '../../enums/TdxA2EventType.js'
import type { TdxStopStatus } from '../../enums/TdxStopStatus.js'
import type { TdxLocalizedText } from './BusRoute.js'

export interface TdxEstimatedArrival {
  PlateNumb?: string | null
  StopUID?: string | null
  StopID?: string | null
  RouteUID?: string | null
  SubRouteUID?: string | null
  Direction: DirectionType
  StopSequence?: number | null
  EstimateTime?: number | null
  StopStatus?: TdxStopStatus | null
}

export interface TdxRealtimeNearStop {
  PlateNumb: string
  SubRouteUID?: string | null
  Direction: DirectionType
  StopUID?: string | null
  StopID?: string | null
  StopName?: TdxLocalizedText | null
  StopSequence: number
  A2EventType?: TdxA2EventType | null
}

export interface TdxRealtimeByFrequency {
  PlateNumb: string
  SubRouteUID?: string | null
  Direction?: DirectionType | null
  BusPosition?: {
    PositionLon?: number | null
    PositionLat?: number | null
  } | null
}
