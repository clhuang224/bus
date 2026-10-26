import {
  ActionIcon,
  Alert,
  Box,
  Center,
  Group,
  Skeleton,
  Stack,
  Text,
  Timeline,
  UnstyledButton,
} from '@mantine/core'
import { RiHeart2Fill, RiHeart2Line } from '@remixicon/react'
import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getRouteRealtimeMessages } from '~/modules/consts/routeRealtimeMessages'
import { RouteRealtimeInfoState } from '~/modules/enums/RouteRealtimeInfoState'
import { useScrollSelectedItem } from '~/modules/hooks/shared/useScrollSelectedItem'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'
import type { RouteRealtimeBusStatus } from '~/modules/interfaces/RouteRealtimeBusStatus'
import { RealtimeVehicleState } from '@bus/shared'
import { toLatLng } from '~/modules/utils/geo/convertCoordinates'
import { SkeletonList } from '../common/SkeletonList'
import { RouteRealtimeBadge } from './RouteRealtimeBadge'
import { RouteRealtimeGap } from './RouteRealtimeGap'
import { NavigationButton } from '../common/NavigationButton'
import type { LngLat } from '~/modules/types/CoordsType'
import {
  ROUTE_STICKY_TABS_SCROLL_MARGIN,
  ROUTE_STOP_BULLET_SIZE,
} from '~/modules/consts/layout'

export interface RouteStopListItem {
  estimatedArrivalLabel: string | null
  favoriteRouteStop: FavoriteRouteStop
  id: string
  name: string
  position?: LngLat | null
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
  stops,
}: PropType) => {
  const { t } = useTranslation()
  const stopItemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const vehicleBadgeRefs = useRef<Map<string, HTMLButtonElement | null>>(
    new Map(),
  )
  const routeRealtimeMessages = getRouteRealtimeMessages(t)
  const stopIdsKey = useMemo(
    () => stops.map((stop) => stop.id).join('|'),
    [stops],
  )
  const vehicleIdsKey = useMemo(
    () =>
      stops
        .flatMap((stop) => stop.realtimeBuses.map((bus) => bus.id))
        .join('|'),
    [stops],
  )

  useScrollSelectedItem({
    itemElementRefs: stopItemRefs,
    listItems: stopIdsKey,
    selectedItemId: highlightedStopId,
    verticalAlignment: 'center',
  })

  useScrollSelectedItem({
    itemElementRefs: stopItemRefs,
    listItems: stopIdsKey,
    selectedItemId: selectedStopId,
    verticalAlignment: listScrollBehavior,
  })

  useScrollSelectedItem({
    itemElementRefs: vehicleBadgeRefs,
    listItems: vehicleIdsKey,
    selectedItemId: selectedVehicleId,
    verticalAlignment: listScrollBehavior,
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

  const setVehicleBadgeRef = (
    vehicleId: string,
    node: HTMLButtonElement | null,
  ) => {
    if (node) {
      vehicleBadgeRefs.current.set(vehicleId, node)
      return
    }

    vehicleBadgeRefs.current.delete(vehicleId)
  }

  return (
    <Stack gap="xs">
      {realtimeMessage === routeRealtimeMessages.noService ? (
        <Text size="sm" c="dimmed" flex="0 0 auto">
          {realtimeMessage.description}
        </Text>
      ) : (
        realtimeMessage && (
          <Alert
            color={realtimeMessage.color}
            title={realtimeMessage.title}
            flex="0 0 auto"
          >
            {realtimeMessage.description}
          </Alert>
        )
      )}
      {isLoading ? (
        <SkeletonList count={6} gap="sm" testId="route-stop-list-skeleton">
          <Skeleton h={52} radius="md" />
        </SkeletonList>
      ) : (
        <Timeline active={-1} bulletSize={ROUTE_STOP_BULLET_SIZE} lineWidth={2}>
          {stops.map((stop, stopIndex) => {
            const isHighlighted = stop.id === highlightedStopId
            const isSelected = stop.id === selectedStopId
            const isFirstStop = stopIndex === 0
            const nextStop = stops[stopIndex + 1]
            const isLastStop = nextStop == null
            const stopLevelRealtimeBuses = stop.realtimeBuses.filter(
              (bus) =>
                bus.vehicleState === RealtimeVehicleState.AT_STOP ||
                (isFirstStop &&
                  bus.vehicleState === RealtimeVehicleState.ARRIVING) ||
                (isLastStop &&
                  bus.vehicleState === RealtimeVehicleState.DEPARTED),
            )
            const departedBuses = isLastStop
              ? []
              : stop.realtimeBuses.filter(
                  (bus) => bus.vehicleState === RealtimeVehicleState.DEPARTED,
                )
            const arrivingBuses =
              nextStop?.realtimeBuses.filter(
                (bus) => bus.vehicleState === RealtimeVehicleState.ARRIVING,
              ) ?? []
            const gapRealtimeBuses = [...departedBuses, ...arrivingBuses]

            return (
              <Timeline.Item
                key={stop.id}
                data-testid={`route-stop-${stop.id}`}
                styles={{
                  item: {
                    marginTop: 0,
                  },
                  itemBody: {
                    marginTop: 0,
                  },
                }}
                bullet={
                  <Center
                    w={ROUTE_STOP_BULLET_SIZE}
                    h={ROUTE_STOP_BULLET_SIZE}
                    flex={`0 0 ${ROUTE_STOP_BULLET_SIZE}px`}
                    bdrs="50%"
                    bg="white"
                    bd="2px solid blue.5"
                    c="gray.9"
                    fz="xs"
                    fw={700}
                    lh={1}
                  >
                    {stop.sequence}
                  </Center>
                }
                title={
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
                    pl="xs"
                    pt={4}
                    pb="xs"
                    bg={isHighlighted ? 'blue.0' : undefined}
                    bdrs="sm"
                    style={{ scrollMarginTop: ROUTE_STICKY_TABS_SCROLL_MARGIN }}
                  >
                    <Stack gap={4} pr="sm">
                      <Group
                        justify="space-between"
                        align="center"
                        wrap="nowrap"
                      >
                        <Group align="center" gap="xs">
                          <UnstyledButton
                            flex={1}
                            miw={0}
                            onClick={() => onSelectStop(stop.id)}
                          >
                            <Text
                              lineClamp={1}
                              fw={isHighlighted || isSelected ? 700 : undefined}
                              c={isHighlighted ? 'blue.8' : undefined}
                            >
                              {stop.name}
                            </Text>
                          </UnstyledButton>
                          <NavigationButton
                            ariaLabel={t(
                              'components.routeStopList.navigateAriaLabel',
                              {
                                stopName: stop.name,
                              },
                            )}
                            destination={toLatLng(stop.position ?? null)}
                          />
                        </Group>
                        <ActionIcon
                          variant={stop.isFavorite ? 'light' : 'subtle'}
                          color={stop.isFavorite ? 'pink' : 'gray'}
                          radius="50%"
                          size="xl"
                          aria-label={
                            stop.isFavorite
                              ? t(
                                  'components.routeStopList.removeFavoriteAriaLabel',
                                )
                              : t(
                                  'components.routeStopList.addFavoriteAriaLabel',
                                )
                          }
                          onClick={(event) => {
                            event.stopPropagation()
                            onToggleFavorite(stop.favoriteRouteStop)
                          }}
                        >
                          {stop.isFavorite ? (
                            <RiHeart2Fill />
                          ) : (
                            <RiHeart2Line />
                          )}
                        </ActionIcon>
                      </Group>
                      {(stop.estimatedArrivalLabel ||
                        stopLevelRealtimeBuses.length > 0) && (
                        <Group
                          justify="space-between"
                          align="center"
                          wrap="nowrap"
                        >
                          <Box flex={1} miw={0}>
                            {stop.estimatedArrivalLabel && (
                              <Text size="xs" c="dimmed">
                                {stop.estimatedArrivalLabel}
                              </Text>
                            )}
                          </Box>
                          <Group
                            gap="xs"
                            wrap="wrap"
                            justify="flex-end"
                            pr="xl"
                            miw={0}
                            maw="100%"
                          >
                            {stopLevelRealtimeBuses.map((bus) => (
                              <RouteRealtimeBadge
                                key={bus.id}
                                buttonRef={(node) =>
                                  setVehicleBadgeRef(bus.id, node)
                                }
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
                      )}
                    </Stack>
                  </Box>
                }
              >
                {nextStop && (
                  <RouteRealtimeGap
                    realtimeBuses={gapRealtimeBuses}
                    onSelectVehicle={onSelectVehicle}
                    setVehicleBadgeRef={setVehicleBadgeRef}
                    selectedVehicleId={selectedVehicleId}
                  />
                )}
              </Timeline.Item>
            )
          })}
        </Timeline>
      )}
    </Stack>
  )
}
