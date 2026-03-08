import type { LngLat } from '../types/CoordsType'
import type { LocalizedText, TdxLocalizedText } from '../types/LocalizedText'

export interface TdxStop {
  StopUID: string,
  StopID: string,
  StopName: TdxLocalizedText,
  StopPosition: {
    PositionLon: number,
    PositionLat: number
  }
  StopAddress: string
  City: string
}

export type Stop = {
  StopUID: string,
  StopID: string,
  position: LngLat
  StopName: LocalizedText,
  StopAddress: string
  City: string
}