import { ActionIcon, Box, Group, Text, Timeline } from '@mantine/core'
import { RiHeart2Fill, RiHeart2Line } from '@remixicon/react'
import { useEffect, useRef } from 'react'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'

export interface RouteStopListItem {
  favoriteRouteStop: FavoriteRouteStop
  id: string
  name: string
  sequence: number
  isFavorite: boolean
}

interface PropType {
  highlightedStopId?: string | null
  listScrollBehavior?: ScrollLogicalPosition
  onSelectStop: (stopId: string) => void
  onToggleFavorite: (routeStop: FavoriteRouteStop) => void
  selectedStopId?: string | null
  stops: RouteStopListItem[]
}

export const RouteStopList = ({
  highlightedStopId = null,
  listScrollBehavior = 'nearest',
  onSelectStop,
  onToggleFavorite,
  selectedStopId = null,
  stops
}: PropType) => {
  const stopItemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())

  useEffect(() => {
    if (!highlightedStopId) return

    const highlightedStop = stopItemRefs.current.get(highlightedStopId)
    if (!highlightedStop) return

    highlightedStop.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }, [highlightedStopId, stops])

  useEffect(() => {
    if (!selectedStopId) return

    const selectedStop = stopItemRefs.current.get(selectedStopId)
    if (!selectedStop) return

    selectedStop.scrollIntoView({
      behavior: 'smooth',
      block: listScrollBehavior
    })
  }, [listScrollBehavior, selectedStopId, stops])

  return (
    <Timeline active={-1} bulletSize={18} lineWidth={2}>
      {stops.map((stop) => {
        const isHighlighted = stop.id === highlightedStopId
        const isSelected = stop.id === selectedStopId

        return (
          <Timeline.Item
            key={stop.id}
            title={(
              <Box
                ref={(node) => {
                  if (node) {
                    stopItemRefs.current.set(stop.id, node)
                    return
                  }

                  stopItemRefs.current.delete(stop.id)
                }}
                data-highlighted={isHighlighted || undefined}
                data-selected={isSelected || undefined}
                px="xs"
                py={4}
                bg={isHighlighted ? 'blue.0' : undefined}
                style={{ borderRadius: 'var(--mantine-radius-sm)', cursor: 'pointer' }}
                onClick={() => onSelectStop(stop.id)}
              >
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Group gap="none" align="center">
                    {/* TODO: Add real-time bus information */}
                    <Text fw={isHighlighted || isSelected ? 700 : undefined} c={isHighlighted ? 'blue.8' : undefined}>
                      {stop.sequence}. {stop.name}
                    </Text>
                  </Group>
                  <Group pr="sm">
                    <ActionIcon
                      variant="light"
                      color={stop.isFavorite ? 'pink' : 'gray'}
                      radius="50%"
                      aria-label={stop.isFavorite ? '取消收藏站牌路線' : '收藏站牌路線'}
                      onClick={(event) => {
                        event.stopPropagation()
                        onToggleFavorite(stop.favoriteRouteStop)
                      }}
                    >
                      {stop.isFavorite ? <RiHeart2Fill /> : <RiHeart2Line />}
                    </ActionIcon>
                  </Group>
                </Group>
              </Box>
            )}
          >
          </Timeline.Item>
        )
      })}
    </Timeline>
  )
}
