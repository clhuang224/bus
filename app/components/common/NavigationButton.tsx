import { ActionIcon, type ActionIconProps } from '@mantine/core'
import { RiDirectionLine } from '@remixicon/react'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '~/modules/store'
import type { LatLng } from '~/modules/types/CoordsType'
import { getGoogleMapsDirectionsUrl } from '~/modules/utils/map/getGoogleMapsDirectionsUrl'

interface PropType extends Omit<ActionIconProps, 'children' | 'aria-label' | 'onClick'> {
  ariaLabel: string
  destination: LatLng | null
}

export const NavigationButton = ({
  ariaLabel,
  destination,
  ...actionIconProps
}: PropType) => {
  const { coords } = useSelector((state: RootState) => state.geolocation)

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!destination) {
      return
    }

    event.stopPropagation()
    window.open(
      getGoogleMapsDirectionsUrl({
        destination,
        origin: coords
      }),
      '_blank',
      'noopener,noreferrer'
    )
  }, [coords, destination])

  return (
    <ActionIcon
      aria-label={ariaLabel}
      disabled={!destination}
      onClick={handleClick}
      variant="light"
      radius="50%"
      size="sm"
      {...actionIconProps}
    >
      <RiDirectionLine />
    </ActionIcon>
  )
}
