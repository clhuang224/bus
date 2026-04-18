import { BearingType } from '~/modules/enums/BearingType'
import type { NearbyStopGroup } from '~/modules/interfaces/Nearby'
import { getBearingTranslationKey } from '~/modules/utils/i18n/getBearingTranslationKey'

export function getStopGroupBearingLabel(
  t: (key: string) => string,
  stopGroup: NearbyStopGroup
): string | null {
  const bearings = Array.from(new Set(
    stopGroup.stops
      .map((stop) => stop.Bearing)
      .filter((bearing): bearing is BearingType => bearing != null)
  ))

  if (bearings.length === 0) {
    return null
  }

  return bearings
    .map((bearing) => t(getBearingTranslationKey(bearing)))
    .join(' / ')
}
