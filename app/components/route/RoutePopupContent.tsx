import { Group, Stack, Text } from '@mantine/core'
import { NavigationButton } from '../common/NavigationButton'
import { useTranslation } from 'react-i18next'
import { getLatLng } from '~/modules/utils/geo/position'
import type { LngLat } from '~/modules/types/CoordsType'

export const RoutePopupContent: React.FC<{
    stopName: string
    estimatedArrivalLabel: string | null
    position: LngLat | null
    isSm: boolean
}> = ({ stopName, estimatedArrivalLabel, position, isSm }) => {
  const { t } = useTranslation()
  return (
    <Group align="center" gap="xs" wrap="nowrap" style={{ minWidth: 0, maxWidth: '100%' }}>
      <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
        <Text size="sm" fw={500} lineClamp={1}>
          {stopName}
        </Text>
        <NavigationButton
          ariaLabel={t('components.routeStopList.navigateAriaLabel', {
            stopName
          })}
          destination={getLatLng(position)}
        />
      </Stack>
      {isSm && estimatedArrivalLabel && (
        <Text size="xs" c="dimmed">
            {estimatedArrivalLabel}
        </Text>
      )}
    </Group>
  )
}