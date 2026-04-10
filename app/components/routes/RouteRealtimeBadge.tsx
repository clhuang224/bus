import { Badge, Box } from '@mantine/core'
import { RiBus2Fill } from '@remixicon/react'
import type { MouseEvent } from 'react'
import { VehicleStateType } from '~/modules/enums/VehicleStateType'

interface PropType {
  isSelected: boolean
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
  plateNumb: string
  vehicleState?: VehicleStateType
}

function getRealtimeBadgeOffset(vehicleState?: VehicleStateType) {
  if (!vehicleState) {
    return undefined
  }

  return vehicleState === VehicleStateType.DEPARTED
    ? 'translateY(46px)'
    : 'translateY(-46px)'
}

export function RouteRealtimeBadge({
  isSelected,
  onClick,
  plateNumb,
  vehicleState
}: PropType) {
  return (
    <Box
      data-vehicle-state={vehicleState}
      style={{
        display: 'inline-flex',
        transform: getRealtimeBadgeOffset(vehicleState)
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
