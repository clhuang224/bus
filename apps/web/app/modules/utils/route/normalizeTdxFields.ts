import type { LngLat } from '../../types/CoordsType'
import type { LocalizedText, TdxLocalizedText } from '../../types/LocalizedText'

export function toLocalizedText(
  text?: TdxLocalizedText | null,
  defaultText?: TdxLocalizedText | null
): LocalizedText {
  return {
    'zh-TW': text?.Zh_tw ?? defaultText?.Zh_tw ?? '',
    en: text?.En ?? defaultText?.En ?? ''
  }
}

export function toLngLat(position?: {
  PositionLon?: number | null
  PositionLat?: number | null
} | null): LngLat | null {
  const longitude = position?.PositionLon
  const latitude = position?.PositionLat

  if (typeof longitude !== 'number' || typeof latitude !== 'number') {
    return null
  }

  return [longitude, latitude]
}
