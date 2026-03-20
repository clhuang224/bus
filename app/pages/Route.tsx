import { ActionIcon, Flex, Skeleton, Stack, Tabs, Text, useMantineTheme } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { useEffect, useMemo, useState } from 'react'
import { BaseAlert } from '~/components/common/BaseAlert'
import { MapSidebarLayout } from '~/components/common/MapSidebarLayout'
import { SkeletonList } from '~/components/common/SkeletonList'
import { useLocation, useNavigate, useParams } from 'react-router'
import { RouteMap } from '~/components/routes/RouteMap'
import { RouteStopList } from '~/components/routes/RouteStopList'
import { useFavoriteRouteStops } from '~/modules/hooks/useFavoriteRouteStops'
import { busApi } from '~/modules/apis/bus'
import { directionMapName } from '~/modules/consts/direction'
import { routeMessages } from '~/modules/consts/pageMessages'
import type { CityNameType } from '~/modules/enums/CityNameType'
import { DirectionType } from '~/modules/enums/DirectionType'
import { RouteRealtimeInfoState } from '~/modules/enums/RouteRealtimeInfoState'
import { StopStatusType } from '~/modules/enums/StopStatusType'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'
import type { StopOfRouteStop } from '~/modules/interfaces/StopOfRoute'
import { getRouteRealtimeBusStatuses } from '~/modules/utils/getRouteRealtimeBusStatuses'
import { RiArrowLeftSLine } from '@remixicon/react'
import { AppBadge } from '~/components/common/AppBadge'

const REALTIME_POLLING_INTERVAL = 30000

interface RouteTab {
  id: string
  label: string
  subRouteUID: string
  direction: DirectionType
}

interface RouteLocationState {
  favoriteRouteStop?: FavoriteRouteStop
}

export default function Route() {
  const { city, id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useMantineTheme()
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)
  const [isSidebarOpened, { open: openSidebar, close: closeSidebar }] = useDisclosure(false)
  const [listScrollBehavior, setListScrollBehavior] = useState<ScrollLogicalPosition>('nearest')
  const { isFavoriteRouteStop, toggleFavoriteRouteStop } = useFavoriteRouteStops()
  const cityName = city as CityNameType
  const { data: routes = [], isLoading: isRoutesLoading, error: routesError } = busApi.useGetRoutesByCityQuery(
    cityName,
    { skip: !city || !id }
  )
  const { data: stopOfRoutes = [], isLoading: isStopOfRoutesLoading, error: stopOfRoutesError } =
    busApi.useGetStopOfRoutesByCityQuery(cityName, { skip: !city || !id })
  const { data: stopsByCity = [], isLoading: isStopsLoading, error: stopsError } =
    busApi.useGetStopsByCityQuery(cityName, { skip: !city || !id })

  const targetFavoriteRouteStop = useMemo(() => {
    const favoriteRouteStop = (location.state as RouteLocationState | null)?.favoriteRouteStop
    if (!favoriteRouteStop) return null
    if (favoriteRouteStop.city !== cityName || favoriteRouteStop.routeUID !== id) return null

    return favoriteRouteStop
  }, [cityName, id, location.state])

  const busRoute = useMemo(
    () => routes.find((route) => route.RouteUID === id),
    [routes, id]
  )

  const routeTabs = useMemo<RouteTab[]>(() => {
    if (!busRoute) return []

    const routeName = busRoute.RouteName.zh_TW.trim()

    return busRoute.SubRoutes.map((subRoute) => ({
      id: `${subRoute.SubRouteUID}-${subRoute.Direction}`,
      label: [
        subRoute.SubRouteName.zh_TW.trim() === routeName ? null : subRoute.SubRouteName.zh_TW.trim(),
        directionMapName[subRoute.Direction]
      ].filter(Boolean).join(' '),
      subRouteUID: subRoute.SubRouteUID,
      direction: subRoute.Direction
    }))
  }, [busRoute])

  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null)

  useEffect(() => {
    if (isSm) {
      openSidebar()
      return
    }
  }, [isSm, openSidebar])

  useEffect(() => {
    if (!routeTabs.length) {
      setActiveTab(null)
      return
    }

    const targetTabId = targetFavoriteRouteStop
      ? routeTabs.find((tab) =>
        tab.subRouteUID === targetFavoriteRouteStop.subRouteUID &&
        tab.direction === targetFavoriteRouteStop.direction
      )?.id
      : null

    setActiveTab((currentTab) => currentTab && routeTabs.some((tab) => tab.id === currentTab)
      ? currentTab
      : targetTabId ?? routeTabs[0].id)
  }, [routeTabs, targetFavoriteRouteStop])

  const activeStopOfRoute = useMemo(() => {
    if (!activeTab) return null
    const activeRouteTab = routeTabs.find((tab) => tab.id === activeTab)
    if (!activeRouteTab) return null

    return stopOfRoutes.find((stopOfRoute) =>
      stopOfRoute.RouteUID === id &&
      stopOfRoute.SubRouteUID === activeRouteTab.subRouteUID &&
      stopOfRoute.Direction === activeRouteTab.direction
    ) ?? null
  }, [activeTab, id, routeTabs, stopOfRoutes])

  const activeSubRoute = useMemo(() => {
    if (!busRoute || !activeTab) return null

    const activeRouteTab = routeTabs.find((tab) => tab.id === activeTab)
    if (!activeRouteTab) return null

    return busRoute.SubRoutes.find((subRoute) =>
      subRoute.SubRouteUID === activeRouteTab.subRouteUID &&
      subRoute.Direction === activeRouteTab.direction
    ) ?? null
  }, [activeTab, busRoute, routeTabs])

  const shouldSkipRealtimeQueries = !city || !id || !busRoute || !activeSubRoute
  const {
    data: estimatedArrivals = [],
    isError: isEstimatedArrivalsError,
    isLoading: isEstimatedArrivalsLoading
  } =
    busApi.useGetEstimatedArrivalByRouteQuery(
      { city: cityName, routeUID: id! },
      {
        skip: shouldSkipRealtimeQueries,
        pollingInterval: REALTIME_POLLING_INTERVAL,
        skipPollingIfUnfocused: true,
        refetchOnReconnect: true
      }
    )
  const {
    data: realtimeNearStops = [],
    isError: isRealtimeNearStopsError,
    isLoading: isRealtimeNearStopsLoading
  } =
    busApi.useGetRealtimeNearStopsByRouteQuery(
      { city: cityName, routeUID: id! },
      {
        skip: shouldSkipRealtimeQueries,
        pollingInterval: REALTIME_POLLING_INTERVAL,
        skipPollingIfUnfocused: true,
        refetchOnReconnect: true
      }
    )
  const { data: routeShapes = [] } = busApi.useGetRouteShapesByRouteQuery(
    { city: cityName, routeUID: id! },
    { skip: shouldSkipRealtimeQueries }
  )

  const stopPositionMap = useMemo(() => {
    return stopsByCity.reduce<Map<string, (typeof stopsByCity)[number]['position']>>((result, stop) => {
      if (stop.position) {
        result.set(stop.StopUID, stop.position)
        result.set(stop.StopID, stop.position)
      }
      return result
    }, new Map())
  }, [stopsByCity])

  const realtimeBusStatuses = useMemo(() => getRouteRealtimeBusStatuses(
    realtimeNearStops.filter((realtimeNearStop) =>
      realtimeNearStop.SubRouteUID === activeSubRoute?.SubRouteUID &&
      realtimeNearStop.Direction === activeSubRoute?.Direction
    ),
    estimatedArrivals.filter((estimatedArrival) =>
      estimatedArrival.SubRouteUID === activeSubRoute?.SubRouteUID &&
      estimatedArrival.Direction === activeSubRoute?.Direction
    )
  ), [activeSubRoute, estimatedArrivals, realtimeNearStops])

  const activeEstimatedArrivals = useMemo(() => estimatedArrivals.filter((estimatedArrival) =>
    estimatedArrival.SubRouteUID === activeSubRoute?.SubRouteUID &&
    estimatedArrival.Direction === activeSubRoute?.Direction
  ), [activeSubRoute, estimatedArrivals])

  const realtimeBusesByStopSequence = useMemo(() => {
    return realtimeBusStatuses.reduce<Map<number, typeof realtimeBusStatuses>>((result, realtimeBus) => {
      const stopBuses = result.get(realtimeBus.stopSequence) ?? []
      stopBuses.push(realtimeBus)
      result.set(realtimeBus.stopSequence, stopBuses)
      return result
    }, new Map())
  }, [realtimeBusStatuses])

  const hasRealtimeError = useMemo(() => {
    if (isEstimatedArrivalsError && estimatedArrivals.length === 0) {
      return true
    }

    if (isRealtimeNearStopsError && realtimeNearStops.length === 0 && estimatedArrivals.length === 0) {
      return true
    }

    return false
  }, [
    estimatedArrivals.length,
    isEstimatedArrivalsError,
    isRealtimeNearStopsError,
    realtimeNearStops.length
  ])

  const activeRealtimeNearStops = useMemo(() => realtimeNearStops.filter((realtimeNearStop) =>
    realtimeNearStop.SubRouteUID === activeSubRoute?.SubRouteUID &&
    realtimeNearStop.Direction === activeSubRoute?.Direction
  ), [activeSubRoute, realtimeNearStops])

  const realtimeInfoState = useMemo<RouteRealtimeInfoState>(() => {
    if (hasRealtimeError || isEstimatedArrivalsLoading || isRealtimeNearStopsLoading) {
      return RouteRealtimeInfoState.NORMAL
    }

    if (realtimeBusStatuses.length > 0) {
      return RouteRealtimeInfoState.NORMAL
    }

    if (activeEstimatedArrivals.length === 0 && activeRealtimeNearStops.length === 0) {
      return RouteRealtimeInfoState.NO_REALTIME_DATA
    }

    const isOutOfService = activeEstimatedArrivals.every((estimatedArrival) => [
      StopStatusType.NOT_YET_DEPARTED,
      StopStatusType.LAST_BUS_PASSED,
      StopStatusType.NOT_IN_SERVICE_TODAY
    ].includes(estimatedArrival.StopStatus))

    return isOutOfService ? RouteRealtimeInfoState.NO_SERVICE : RouteRealtimeInfoState.NO_REALTIME_DATA
  }, [
    activeEstimatedArrivals,
    activeRealtimeNearStops.length,
    hasRealtimeError,
    isEstimatedArrivalsLoading,
    isRealtimeNearStopsLoading,
    realtimeBusStatuses.length
  ])

  const timelineStops = useMemo(() => {
    if (!activeStopOfRoute || !activeSubRoute || !busRoute) return []

    return activeStopOfRoute.Stops.map((stop) => {
      const stationKey = stop.StationID ?? stop.StopUID
      const favoriteRouteStop: FavoriteRouteStop = {
        favoriteId: `${busRoute.RouteUID}-${activeSubRoute.SubRouteUID}-${activeSubRoute.Direction}-${stationKey}`,
        city: busRoute.City,
        routeUID: busRoute.RouteUID,
        routeName: busRoute.RouteName.zh_TW,
        subRouteUID: activeSubRoute.SubRouteUID,
        subRouteName: activeSubRoute.SubRouteName.zh_TW,
        direction: activeSubRoute.Direction,
        stopUID: stop.StopUID,
        stopID: stop.StopID,
        stationID: stop.StationID ?? null,
        stationKey,
        stopName: stop.StopName.zh_TW,
        stopSequence: stop.StopSequence,
        departure: activeSubRoute.DepartureStopName?.zh_TW || busRoute.DepartureStopName.zh_TW,
        destination: activeSubRoute.DestinationStopName?.zh_TW || busRoute.DestinationStopName.zh_TW
      }

      return {
        id: stop.StopUID,
        favoriteRouteStop,
        name: stop.StopName.zh_TW,
        realtimeBuses: realtimeBusesByStopSequence.get(stop.StopSequence) ?? [],
        sequence: stop.StopSequence,
        isFavorite: isFavoriteRouteStop(favoriteRouteStop.favoriteId)
      }
    })
  }, [activeStopOfRoute, activeSubRoute, busRoute, isFavoriteRouteStop, realtimeBusesByStopSequence])

  const routeMapStops = useMemo(() => {
    return (activeStopOfRoute?.Stops ?? []).map((stop: StopOfRouteStop) => ({
      id: stop.StopUID,
      name: stop.StopName.zh_TW,
      sequence: stop.StopSequence,
      position: stopPositionMap.get(stop.StopUID) ?? stopPositionMap.get(stop.StopID) ?? null
    }))
  }, [activeStopOfRoute, stopPositionMap])

  const activeRoutePath = useMemo(() => {
    if (!activeSubRoute) return []

    return routeShapes.find((routeShape) =>
      routeShape.SubRouteUID === activeSubRoute.SubRouteUID &&
      routeShape.Direction === activeSubRoute.Direction
    )?.path ?? []
  }, [activeSubRoute, routeShapes])

  const highlightedStopId = useMemo(() => {
    if (!targetFavoriteRouteStop || !activeSubRoute || !activeStopOfRoute || !busRoute) return null
    if (
      targetFavoriteRouteStop.routeUID !== busRoute.RouteUID ||
      targetFavoriteRouteStop.subRouteUID !== activeSubRoute.SubRouteUID ||
      targetFavoriteRouteStop.direction !== activeSubRoute.Direction
    ) {
      return null
    }

    const matchedStop = activeStopOfRoute.Stops.find((stop) => {
      const stationKey = stop.StationID ?? stop.StopUID

      return stationKey === targetFavoriteRouteStop.stationKey ||
        stop.StopUID === targetFavoriteRouteStop.stopUID ||
        stop.StopID === targetFavoriteRouteStop.stopID
    })

    return matchedStop?.StopUID ?? null
  }, [activeStopOfRoute, activeSubRoute, busRoute, targetFavoriteRouteStop])

  useEffect(() => {
    if (!selectedStopId) return
    if (timelineStops.some((stop) => stop.id === selectedStopId)) return

    setSelectedStopId(null)
  }, [selectedStopId, timelineStops])

  const handleSelectStopFromList = (stopId: string) => {
    setListScrollBehavior('nearest')
    setSelectedStopId(stopId)

    if (isSm) {
      closeSidebar()
    }
  }

  const handleSelectStopFromMap = (stopId: string | null) => {
    setListScrollBehavior('start')
    setSelectedStopId(stopId)

    if (isSm && stopId) {
      openSidebar()
    }
  }

  const isLoading = isRoutesLoading || isStopOfRoutesLoading || isStopsLoading
  const routePanelSkeleton = (
    <Stack gap="md" h="100%" data-testid="route-panel-skeleton">
      <Stack gap={4}>
        <Flex gap="xs" align="center">
          <Skeleton h={36} w={36} radius="md" />
          <Skeleton h={32} w={88} radius="xl" />
        </Flex>
        <Skeleton h={14} mt="sm" radius="sm" />
      </Stack>
      <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
        <Flex gap="xs">
          <Skeleton h={36} w={96} radius="md" />
          <Skeleton h={36} w={96} radius="md" />
        </Flex>
        <SkeletonList count={6} gap="sm">
          <Skeleton h={52} radius="md" />
        </SkeletonList>
      </Stack>
    </Stack>
  )
  const error = routesError || stopOfRoutesError || stopsError
  const message = useMemo(() => {
    if (error) return routeMessages.loadRouteError
    if (!busRoute || routeTabs.length === 0) return routeMessages.emptyRoute

    return null
  }, [busRoute, error, routeTabs.length])

  const handleBack = () => {
    if ((window.history.state?.idx ?? 0) > 0) {
      navigate(-1)
      return
    }

    navigate('/routes')
  }

  return (
    <MapSidebarLayout
      isSm={isSm}
      isSidebarOpened={isSidebarOpened}
      onCloseSidebar={closeSidebar}
      onOpenSidebar={openSidebar}
      openButtonLabel="開啟路線列表"
      panel={isLoading ? routePanelSkeleton : (
        <Stack h="100%" gap="md">
          {busRoute && routeTabs.length > 0 && (
            <>
              <Stack gap={4}>
                <Flex gap="xs" align="center">
                  <ActionIcon onClick={handleBack}>
                    <RiArrowLeftSLine size={18} />
                  </ActionIcon>
                  <AppBadge type="route" size="xl">{busRoute.RouteName.zh_TW}</AppBadge>
                </Flex>
                <Text size="sm" c="dimmed" mt="sm">
                  {busRoute.DepartureStopName.zh_TW} - {busRoute.DestinationStopName.zh_TW}
                </Text>
              </Stack>
              <Tabs
                value={activeTab}
                onChange={setActiveTab}
                keepMounted={false}
                style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
              >
                <Tabs.List
                  style={{
                    flexWrap: 'nowrap',
                    overflowX: 'auto',
                    overflowY: 'hidden'
                  }}
                >
                  {routeTabs.map((tab) => (
                    <Tabs.Tab
                      key={tab.id}
                      value={tab.id}
                      style={{ flex: '0 0 auto' }}
                    >
                      {tab.label}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
                {message && <BaseAlert {...message} mt="sm" />}
                {routeTabs.map((tab) => (
                <Tabs.Panel
                  key={tab.id}
                  value={tab.id}
                  pt="md"
                  style={{ flex: 1, minHeight: 0 }}
                >
                  <RouteStopList
                    highlightedStopId={highlightedStopId}
                    hasRealtimeError={hasRealtimeError}
                    isRealtimeLoading={isEstimatedArrivalsLoading || isRealtimeNearStopsLoading}
                    listScrollBehavior={listScrollBehavior}
                    onSelectStop={handleSelectStopFromList}
                    realtimeInfoState={realtimeInfoState}
                    stops={timelineStops}
                    onToggleFavorite={toggleFavoriteRouteStop}
                    selectedStopId={selectedStopId}
                  />
                </Tabs.Panel>
              ))}
              </Tabs>
            </>
          )}
        </Stack>
      )}
    >
      <RouteMap
        highlightedStopId={highlightedStopId}
        selectedStop={selectedStopId}
        onSelectStop={handleSelectStopFromMap}
        routePath={activeRoutePath}
        stops={routeMapStops}
        vehicles={realtimeBusStatuses.map((bus) => ({
          id: bus.id,
          estimateLabel: bus.estimateLabel,
          plateNumb: bus.plateNumb,
          position: bus.position,
          stopName: bus.stopName
        }))}
      />
    </MapSidebarLayout>
  )
}
