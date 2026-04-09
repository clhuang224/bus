import { ActionIcon, Alert, Badge, Box, Group, ScrollArea, Skeleton, Stack, Text, Timeline } from '@mantine/core'
import { RiBus2Fill, RiHeart2Fill, RiHeart2Line } from '@remixicon/react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getRouteRealtimeMessages } from '~/modules/consts/routeRealtimeMessages'
import { RouteRealtimeInfoState } from '~/modules/enums/RouteRealtimeInfoState'
import { useScrollSelectedItem } from '~/modules/hooks/useScrollSelectedItem'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'
import type { RouteRealtimeBusStatus } from '~/modules/interfaces/RouteRealtimeBusStatus'
import { SkeletonList } from '../common/SkeletonList'

export interface RouteStopListItem {
  estimatedArrivalLabel: string | null
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
  isLoading?: boolean
  isRealtimeRateLimited?: boolean
  realtimeInfoState?: RouteRealtimeInfoState
  isRealtimeLoading?: boolean
  listScrollBehavior?: ScrollLogicalPosition
  onSelectStop: (stopId: string) => void
  onSelectVehicle: (vehicleId: string) => void
  onToggleFavorite: (routeStop: FavoriteRouteStop) => void
  selectedStopId?: string | null
  selectedVehicleId?: string | null
  stops: RouteStopListItem[]
}

export const RouteStopList = ({
  highlightedStopId = null,
  hasRealtimeError = false,
  isLoading = false,
  isRealtimeRateLimited = false,
  realtimeInfoState = RouteRealtimeInfoState.NORMAL,
  isRealtimeLoading = false,
  listScrollBehavior = 'nearest',
  onSelectStop,
  onSelectVehicle,
  onToggleFavorite,
  selectedStopId = null,
  selectedVehicleId = null,
  stops
}: PropType) => {
  const { t } = useTranslation()
  const stopItemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const routeRealtimeMessages = getRouteRealtimeMessages(t)

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

  const realtimeMessage = (() => {
    if (isLoading) return null
    if (isRealtimeLoading) return routeRealtimeMessages.loading
    if (isRealtimeRateLimited) return routeRealtimeMessages.rateLimited
    if (hasRealtimeError) return routeRealtimeMessages.error
    if (realtimeInfoState !== RouteRealtimeInfoState.NORMAL) {
      return routeRealtimeMessages[realtimeInfoState]
    }
    return null
  })()

  return (
    <Stack h="100%" gap="xs" style={{ minHeight: 0 }}>
      {realtimeMessage && (
        <Alert color={realtimeMessage.color} title={realtimeMessage.title} style={{ flex: '0 0 auto' }}>
          {realtimeMessage.description}
        </Alert>
      )}
      <ScrollArea style={{ flex: 1, minHeight: 0 }}>
        {isLoading
          ? (
            <SkeletonList count={6} gap="sm" testId="route-stop-list-skeleton">
              <Skeleton h={52} radius="md" />
            </SkeletonList>
            )
          : (
            <Timeline active={-1} bulletSize={28} lineWidth={2}>
              {stops.map((stop) => {
                const isHighlighted = stop.id === highlightedStopId
                const isSelected = stop.id === selectedStopId

                return (
                  <Timeline.Item
                    key={stop.id}
                    bullet={(
                      <Box
                        w={28}
                        h={28}
                        style={{
                          flex: '0 0 28px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--mantine-color-gray-4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          lineHeight: 1
                        }}
                      >
                        {stop.sequence}
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
                        style={{ borderRadius: 'var(--mantine-radius-sm)' }}
                      >
                        <Group justify="space-between" align="flex-start" wrap="nowrap">
                          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              component="button"
                              type="button"
                              fw={isHighlighted || isSelected ? 700 : undefined}
                              c={isHighlighted ? 'blue.8' : undefined}
                              style={{
                                minWidth: 0,
                                cursor: 'pointer',
                                background: 'none',
                                border: 0,
                                padding: 0,
                                textAlign: 'left'
                              }}
                              onClick={() => onSelectStop(stop.id)}
                            >
                              {stop.name}
                            </Text>
                            {stop.estimatedArrivalLabel && (
                              <Text size="xs" c="dimmed">
                                {stop.estimatedArrivalLabel}
                              </Text>
                            )}
                          </Stack>
                            <Group pr="sm" gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                            <Group gap="xs" wrap="wrap" justify="flex-end">
                              {stop.realtimeBuses.map((bus) => (
                                <Badge
                                  key={bus.id}
                                  component="button"
                                  type="button"
                                  aria-pressed={bus.id === selectedVehicleId}
                                  color="orange"
                                  variant="light"
                                  size="md"
                                  radius="sm"
                                  leftSection={<RiBus2Fill size="1em" />}
                                  style={{
                                    boxShadow: bus.id === selectedVehicleId
                                      ? '0 0 0 1px rgba(245, 124, 0, 0.25), 0 2px 6px rgba(245, 124, 0, 0.18)'
                                      : undefined,
                                    cursor: 'pointer',
                                    fontWeight: bus.id === selectedVehicleId ? 700 : undefined
                                  }}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    onSelectVehicle(bus.id)
                                  }}
                                >
                                  {bus.plateNumb}
                                </Badge>
                              ))}
                            </Group>
                            <ActionIcon
                              variant="light"
                              color={stop.isFavorite ? 'pink' : 'gray'}
                              radius="50%"
                              aria-label={stop.isFavorite
                                ? t('components.routeStopList.removeFavoriteAriaLabel')
                                : t('components.routeStopList.addFavoriteAriaLabel')}
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
            )}
      </ScrollArea>
    </Stack>
  )
}
