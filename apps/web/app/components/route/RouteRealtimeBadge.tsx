import { alpha, Badge, Box } from '@mantine/core'
import { RiBus2Fill } from '@remixicon/react'
import type { MouseEvent } from 'react'
import { ROUTE_STICKY_TABS_SCROLL_MARGIN } from '~/modules/consts/layout'

interface PropType {
  isSelected: boolean
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
  plateNumb: string
  buttonRef?: (node: HTMLButtonElement | null) => void
}

const SELECTED_BADGE_SHADOW = [
  `0 0 0 1px ${alpha('var(--mantine-color-orange-5)', 0.35)}`,
  `0 2px 6px ${alpha('var(--mantine-color-orange-5)', 0.25)}`,
].join(', ')

export function RouteRealtimeBadge({
  buttonRef,
  isSelected,
  onClick,
  plateNumb,
}: PropType) {
  return (
    <Box display="inline-flex">
      <Badge
        ref={buttonRef}
        component="button"
        type="button"
        aria-pressed={isSelected}
        color="orange"
        variant="light"
        size="md"
        radius="sm"
        leftSection={<RiBus2Fill size="1em" />}
        fw={isSelected ? 700 : undefined}
        style={{
          boxShadow: isSelected ? SELECTED_BADGE_SHADOW : undefined,
          cursor: 'pointer',
          scrollMarginTop: ROUTE_STICKY_TABS_SCROLL_MARGIN,
        }}
        onClick={onClick}
      >
        {plateNumb}
      </Badge>
    </Box>
  )
}
