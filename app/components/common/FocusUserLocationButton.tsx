import { ActionIcon } from '@mantine/core'
import { RiFocus3Line } from '@remixicon/react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import type { RootState } from '~/modules/store'

interface PropType {
  map: MapLibreMap | null
}

export const FocusUserLocationButton = ({ map }: PropType) => {
  const { t } = useTranslation()
  const { coords } = useSelector((state: RootState) => state.geolocation)

  const handleClick = useCallback(() => {
    if (!map || !coords) return

    map.flyTo({
      center: [coords[1], coords[0]],
      zoom: 16,
      duration: 800
    })
  }, [coords, map])

  return (
    <ActionIcon
      aria-label={t('components.focusUserLocationButton.ariaLabel')}
      size="md"
      onClick={handleClick}
      disabled={!coords || !map}
    >
      <RiFocus3Line size={18} />
    </ActionIcon>
  )
}
