import { Group, Stack, Text } from '@mantine/core'
import { NavigationButton } from '../common/NavigationButton'
import { useTranslation } from 'react-i18next'
import { toLatLng } from '~/modules/utils/geo/convertCoordinates'
import type { LngLat } from '~/modules/types/CoordsType'

export const RoutePopupContent: React.FC<{
  stopName: string
  estimatedArrivalLabel: string | null
  position: LngLat | null
  isSm: boolean
}> = ({ stopName, estimatedArrivalLabel, position, isSm }) => {
  const { t } = useTranslation()
  return (
    <Stack gap={2}>
      <Group align="center" gap="xs" wrap="nowrap">
        <Text size="sm" fw={500} lineClamp={1} style={{ minWidth: 0, maxWidth: '100%' }}>
          {stopName}
        </Text>
        {isSm && (
          <NavigationButton
            ariaLabel={t('components.routeStopList.navigateAriaLabel', {
              stopName
            })}
            destination={toLatLng(position)}
            size="xs"
          />
        )}
      </Group>
      {isSm && estimatedArrivalLabel && (
        <Text size="xs" c="dimmed" lineClamp={1}>
          {estimatedArrivalLabel}
        </Text>
      )}
    </Stack>
  )
}