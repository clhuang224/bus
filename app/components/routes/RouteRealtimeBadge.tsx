import { Badge, Box } from '@mantine/core'
import { RiBus2Fill } from '@remixicon/react'
import type { MouseEvent } from 'react'
import { A2EventType } from '~/modules/enums/A2EventType'

interface PropType {
  isSelected: boolean
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
  plateNumb: string
  a2EventType?: A2EventType | null
}

function getRealtimeBadgeMovementState(a2EventType?: A2EventType | null) {
  if (a2EventType === A2EventType.DEPARTED) {
    return 'departed'
  }

  if (a2EventType === A2EventType.ARRIVING) {
    return 'arriving'
  }

  return 'neutral'
}

function getRealtimeBadgeOffset(a2EventType?: A2EventType | null) {
  if (a2EventType === A2EventType.DEPARTED) {
    return 'translateY(46px)'
  }

  if (a2EventType === A2EventType.ARRIVING) {
    return 'translateY(-46px)'
  }

  return undefined
}

export function RouteRealtimeBadge({
  isSelected,
  onClick,
  plateNumb,
  a2EventType
}: PropType) {
  return (
    <Box
      data-movement-state={getRealtimeBadgeMovementState(a2EventType)}
      style={{
        display: 'inline-flex',
        transform: getRealtimeBadgeOffset(a2EventType)
      }}
    >
      <Badge
        component="button"
        type="button"
        aria-pressed={isSelected}
        color="orange"
        variant="light"
        size="md"
        radius="sm"
        leftSection={<RiBus2Fill size="1em" />}
        style={{
          boxShadow: isSelected
            ? '0 0 0 1px rgba(245, 124, 0, 0.25), 0 2px 6px rgba(245, 124, 0, 0.18)'
            : undefined,
          cursor: 'pointer',
          fontWeight: isSelected ? 700 : undefined
        }}
        onClick={onClick}
      >
        {plateNumb}
      </Badge>
    </Box>
  )
}
