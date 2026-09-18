import { BearingType } from '@bus/shared'
import type { NearbyStation } from '~/modules/interfaces/Nearby'
import { getBearingTranslationKey } from '~/modules/utils/i18n/getBearingTranslationKey'
import { getEnumValues } from '~/modules/utils/shared/getEnumValues'

const bearingSortOrder = getEnumValues(BearingType).reduce<
  Record<BearingType, number>
>(
  (result, bearing, index) => {
    result[bearing] = index
    return result
  },
  {} as Record<BearingType, number>,
)

export function getStationBearingLabel(
  t: (key: string) => string,
  station: NearbyStation,
): string | null {
  const bearings = [...station.bearings].sort(
    (left, right) => bearingSortOrder[left] - bearingSortOrder[right],
  )

  if (bearings.length === 0) {
    return null
  }

  return bearings
    .map((bearing) => t(getBearingTranslationKey(bearing)))
    .join(' / ')
}
