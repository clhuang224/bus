import { ActionIcon, Alert, Badge, Box, Group, ScrollArea, Stack, Text, Timeline } from '@mantine/core'
import { RiHeart2Fill, RiHeart2Line } from '@remixicon/react'
import { useRef } from 'react'
import { routeRealtimeMessages } from '~/modules/consts/routeRealtimeMessages'
import { useScrollSelectedItem } from '~/modules/hooks/useScrollSelectedItem'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'
import type { RouteRealtimeBusStatus } from '~/modules/interfaces/RouteRealtimeBusStatus'

export interface RouteStopListItem {
  favoriteRouteStop: FavoriteRouteStop
  id: string
  name: string
  realtimeBuses: RouteRealtimeBusStatus[]
  sequence: number
  isFavorite: boolean
}

interface PropType {
  highlightedStopId?: string | null
  hasRealtimeError?: boolean
  realtimeInfoMessage?: string | null
  isRealtimeLoading?: boolean
  listScrollBehavior?: ScrollLogicalPosition
  onSelectStop: (stopId: string) => void
  onToggleFavorite: (routeStop: FavoriteRouteStop) => void
  selectedStopId?: string | null
  stops: RouteStopListItem[]
}

export const RouteStopList = ({
  highlightedStopId = null,
  hasRealtimeError = false,
  realtimeInfoMessage = null,
  isRealtimeLoading = false,
  listScrollBehavior = 'nearest',
  onSelectStop,
  onToggleFavorite,
  selectedStopId = null,
  stops
}: PropType) => {
  const stopItemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())

  useScrollSelectedItem({
    itemElementRefs: stopItemRefs,
    listItems: stops,
    selectedItemId: highlightedStopId,
    verticalAlignment: 'center'
  })

  useScrollSelectedItem({
    itemElementRefs: stopItemRefs,
    listItems: stops,
    selectedItemId: selectedStopId,
    verticalAlignment: listScrollBehavior
  })

  const realtimeMessage = isRealtimeLoading
    ? routeRealtimeMessages.loading
    : hasRealtimeError
      ? routeRealtimeMessages.error
      : realtimeInfoMessage
        ? routeRealtimeMessages.noService
        : null

  return (
    <Stack h="100%" gap="xs">
      {realtimeMessage && (
        <Alert color={realtimeMessage.color} title={realtimeMessage.title}>
          {realtimeMessage.description}
        </Alert>
      )}
      <ScrollArea h="100%">
        <Timeline active={-1} bulletSize={28} lineWidth={2}>
          {stops.map((stop) => {
            const isHighlighted = stop.id === highlightedStopId
            const isSelected = stop.id === selectedStopId
            const hasRealtimeBus = stop.realtimeBuses.length > 0

            return (
              <Timeline.Item
                key={stop.id}
                bullet={(
                  <Box
                    w={28}
                    h={28}
                    style={{
                      borderRadius: '50%',
                      backgroundColor: hasRealtimeBus
                        ? 'var(--mantine-color-orange-5)'
                        : 'var(--mantine-color-gray-4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: hasRealtimeBus ? '11px' : '12px',
                      fontWeight: 700
                    }}
                  >
                    {hasRealtimeBus ? Math.min(stop.realtimeBuses.length, 9) : stop.sequence}
                  </Box>
                )}
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
                      <Stack gap={4}>
                        <Text fw={isHighlighted || isSelected ? 700 : undefined} c={isHighlighted ? 'blue.8' : undefined}>
                          {stop.sequence}. {stop.name}
                        </Text>
                        {stop.realtimeBuses.map((bus) => (
                          <Group key={bus.id} gap="xs" wrap="wrap">
                            <Badge color="orange" variant="light" size="sm">
                              {bus.plateNumb ?? '未提供車牌'}
                            </Badge>
                            <Text size="xs" c="orange.8">
                              {bus.estimateLabel}
                            </Text>
                          </Group>
                        ))}
                      </Stack>
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
      </ScrollArea>
    </Stack>
  )
}
