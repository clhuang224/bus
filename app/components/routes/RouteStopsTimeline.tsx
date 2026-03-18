import { ActionIcon, Badge, Group, Timeline } from '@mantine/core'
import { RiHeart2Fill, RiHeart2Line } from '@remixicon/react'

export interface RouteTimelineStop {
  id: string
  name: string
  sequence: number
  isFavorite: boolean
}

interface PropType {
  stops: RouteTimelineStop[]
}

export const RouteStopsTimeline = ({ stops }: PropType) => (
  <Timeline active={-1} bulletSize={18} lineWidth={2}>
    {stops.map((stop) => (
      <Timeline.Item
        key={stop.id}
        title={(
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap="none" align="center">
              {/* TODO: Add real-time bus information */}
              <Badge size="lg" variant="light" color="blue" radius="sm">
                {stop.sequence} {stop.name}
              </Badge>
            </Group>
            <Group pr="sm">
              {/* TODO: Add favorite functionality */}
              <ActionIcon variant="light" color="pink" radius="50%">
                {stop.isFavorite ? <RiHeart2Fill /> : <RiHeart2Line />}
              </ActionIcon>
            </Group>
          </Group>
        )}
      >
      </Timeline.Item>
    ))}
  </Timeline>
)
