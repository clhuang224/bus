import { Flex, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import type { NearbyStation } from '~/modules/interfaces/Nearby'
import { selectLocale } from '~/modules/slices/localeSlice'
import { getLocalizedText } from '~/modules/utils/i18n/getLocalizedText'
import { getStationBearingLabel } from '~/modules/utils/nearby/getStationBearingLabel'

interface PropType {
  station: NearbyStation
}

export const NearbyStationTitle = ({ station }: PropType) => {
  const { t } = useTranslation()
  const locale = useSelector(selectLocale)
  const bearingLabel = getStationBearingLabel(t, station)

  return (
    <Flex align="center" gap="xs" w="100%" wrap="nowrap">
      <Text flex={1} miw={0} lineClamp={1}>
        {getLocalizedText(station.name, locale)}
      </Text>
      {bearingLabel && (
        <Text size="sm" c="dimmed" mr="xs">
          {bearingLabel}
        </Text>
      )}
    </Flex>
  )
}
