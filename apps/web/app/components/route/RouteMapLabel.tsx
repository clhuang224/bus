import { Button } from '@mantine/core'
import { RiRouteFill } from '@remixicon/react'
import {
  APP_FLOATING_ACTION_OFFSET,
  MAP_OVERLAY_TOP_INSET_VAR,
} from '~/modules/consts/layout'
import { MAP_Z_INDEX } from '~/modules/consts/mapLayers'

interface PropType {
  routeName: string
  directionLabel: string | null
  onClick: () => void
}

export const RouteMapLabel = ({
  routeName,
  directionLabel,
  onClick,
}: PropType) => (
  <Button
    pos="absolute"
    top={`calc(var(${MAP_OVERLAY_TOP_INSET_VAR}, 0px) + ${APP_FLOATING_ACTION_OFFSET}px)`}
    left={APP_FLOATING_ACTION_OFFSET}
    variant="white"
    radius="xl"
    leftSection={<RiRouteFill size="1em" />}
    onClick={onClick}
    style={{
      zIndex: MAP_Z_INDEX.controls,
      boxShadow: 'var(--mantine-shadow-sm)',
    }}
  >
    {[routeName, directionLabel].filter(Boolean).join(' · ')}
  </Button>
)
