import { Box, Group } from '@mantine/core'
import type { RouteRealtimeBusStatus } from '~/modules/interfaces/RouteRealtimeBusStatus'
import { RouteRealtimeBadge } from './RouteRealtimeBadge'

const ROUTE_STOP_FAVORITE_ACTION_WIDTH = 36
const ROUTE_STOP_FAVORITE_ACTION_OFFSET = `calc(${ROUTE_STOP_FAVORITE_ACTION_WIDTH / 16}rem * var(--mantine-scale) + var(--mantine-spacing-xs))`

interface PropType {
  realtimeBuses: RouteRealtimeBusStatus[]
  onSelectVehicle: (vehicleId: string) => void
  selectedVehicleId?: string | null
}

export function RouteRealtimeGap({
  realtimeBuses,
  onSelectVehicle,
  selectedVehicleId = null
}: PropType) {
  return (
    <Box data-testid="route-realtime-gap" mih={28} pr="sm">
      <Group wrap="nowrap" justify="flex-end" align="center">
        <Group
          data-testid="route-realtime-gap-badges"
          gap="xs"
          wrap="wrap"
          justify="flex-end"
          pr={ROUTE_STOP_FAVORITE_ACTION_OFFSET}
          style={{ flex: 1, minHeight: 28 }}
        >
          {realtimeBuses.map((bus) => (
            <RouteRealtimeBadge
              key={bus.id}
              isSelected={bus.id === selectedVehicleId}
              plateNumb={bus.plateNumb}
              onClick={(event) => {
                event.stopPropagation()
                onSelectVehicle(bus.id)
              }}
            />
          ))}
        </Group>
      </Group>
    </Box>
  )
}
