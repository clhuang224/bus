import { Box, Group } from '@mantine/core'
import type { RouteRealtimeBusStatus } from '~/modules/interfaces/RouteRealtimeBusStatus'
import { RouteRealtimeBadge } from './RouteRealtimeBadge'

interface PropType {
  realtimeBuses: RouteRealtimeBusStatus[]
  onSelectVehicle: (vehicleId: string) => void
  setVehicleBadgeRef?: (vehicleId: string, node: HTMLButtonElement | null) => void
  selectedVehicleId?: string | null
}

export function RouteRealtimeGap({
  realtimeBuses,
  onSelectVehicle,
  setVehicleBadgeRef,
  selectedVehicleId = null
}: PropType) {
  return (
    <Box mih={28} pr="sm">
      <Group wrap="nowrap" justify="space-between" align="flex-start">
        <Box style={{ flex: 1, minWidth: 0 }} />
        <Group
          gap="xs"
          wrap="wrap"
          justify="flex-start"
          pr="xl"
          style={{ flex: '0 1 auto', minHeight: 28, minWidth: 0 }}
        >
          {realtimeBuses.map((bus) => (
            <RouteRealtimeBadge
              key={bus.id}
              buttonRef={(node) => setVehicleBadgeRef?.(bus.id, node)}
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
