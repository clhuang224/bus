import { ActionIcon, Group, Text, Timeline } from '@mantine/core'
import { RiHeart2Fill, RiHeart2Line } from '@remixicon/react'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'

export interface RouteStopListItem {
  favoriteRouteStop: FavoriteRouteStop
  id: string
  name: string
  sequence: number
  isFavorite: boolean
}

interface PropType {
  onToggleFavorite: (routeStop: FavoriteRouteStop) => void
  stops: RouteStopListItem[]
}

export const RouteStopList = ({ onToggleFavorite, stops }: PropType) => (
  <Timeline active={-1} bulletSize={18} lineWidth={2}>
    {stops.map((stop) => (
      <Timeline.Item
        key={stop.id}
        title={(
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap="none" align="center">
              {/* TODO: Add real-time bus information */}
              <Text>
                {stop.sequence}. {stop.name}
              </Text>
            </Group>
            <Group pr="sm">
              <ActionIcon
                variant="light"
                color={stop.isFavorite ? 'pink' : 'gray'}
                radius="50%"
                aria-label={stop.isFavorite ? '取消收藏站牌路線' : '收藏站牌路線'}
                onClick={() => onToggleFavorite(stop.favoriteRouteStop)}
              >
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
