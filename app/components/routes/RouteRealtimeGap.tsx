import { Box, Group, Stack } from '@mantine/core'
import type { RouteRealtimeBusStatus } from '~/modules/interfaces/RouteRealtimeBusStatus'
import { RouteRealtimeBadge } from './RouteRealtimeBadge'

interface PropType {
  arrivingBuses: RouteRealtimeBusStatus[]
  departedBuses: RouteRealtimeBusStatus[]
  onSelectVehicle: (vehicleId: string) => void
  selectedVehicleId?: string | null
}

export function RouteRealtimeGap({
  arrivingBuses,
  departedBuses,
  onSelectVehicle,
  selectedVehicleId = null
}: PropType) {
  return (
    <Box data-testid="route-realtime-gap" pr="sm" py={2} mih={44}>
      <Stack gap={2} align="flex-end" justify="center">
        <Group data-gap-slot="departed" gap="xs" wrap="wrap" justify="flex-end" mih={20}>
          {departedBuses.map((bus) => (
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
        <Group data-gap-slot="arriving" gap="xs" wrap="wrap" justify="flex-end" mih={20}>
          {arrivingBuses.map((bus) => (
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
      </Stack>
    </Box>
  )
}
