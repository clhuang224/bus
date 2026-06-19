import type { LngLat } from '../../types/CoordsType'
import type { LocalizedText, TdxLocalizedText } from '@bus/shared'

export function toLocalizedText(
  text?: TdxLocalizedText | null,
  defaultText?: TdxLocalizedText | null,
): LocalizedText {
  return {
    'zh-TW': text?.Zh_tw ?? defaultText?.Zh_tw ?? '',
    en: text?.En ?? defaultText?.En ?? '',
    ja: text?.Ja ?? defaultText?.Ja ?? '',
    ko: text?.Ko ?? defaultText?.Ko ?? '',
  }
}

export function toLngLat(
  position?: {
    PositionLon?: number | null
    PositionLat?: number | null
  } | null,
): LngLat | null {
  const longitude = position?.PositionLon
  const latitude = position?.PositionLat

  if (typeof longitude !== 'number' || typeof latitude !== 'number') {
    return null
  }

  return [longitude, latitude]
}
