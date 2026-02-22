import type { LocalizedText, TdxLocalizedText } from '../types/LocalizedText'

export interface TdxStop {
  StopUID: string,
  StopID: string,
  StopName: TdxLocalizedText,
  StopPosition: {
    PositionLon: number,
    PositionLat: number
  }
}

export type Stop = {
  StopUID: string,
  StopID: string,
  StopName: LocalizedText,
  position: [number, number]
}
