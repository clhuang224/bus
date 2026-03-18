import { ActionIcon, Alert, Flex, ScrollArea, Stack, Tabs, Text, Title, useMantineTheme } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { useEffect, useMemo, useState } from 'react'
import { MapSidebarLayout } from '~/components/common/MapSidebarLayout'
import { useNavigate, useParams } from 'react-router'
import { RouteMap } from '~/components/routes/RouteMap'
import { RouteStopsTimeline } from '~/components/routes/RouteStopsTimeline'
import { busApi } from '~/modules/apis/bus'
import { directionMapName } from '~/modules/consts/direction'
import { routeMessages } from '~/modules/consts/pageMessages'
import type { CityNameType } from '~/modules/enums/CityNameType'
import { DirectionType } from '~/modules/enums/DirectionType'
import type { StopOfRouteStop } from '~/modules/interfaces/StopOfRoute'
import { RiArrowLeftSLine } from '@remixicon/react'

interface RouteTab {
  id: string
  label: string
  subRouteUID: string
  direction: DirectionType
}

export default function Route() {
  const { city, id } = useParams()
  const navigate = useNavigate()
  const theme = useMantineTheme()
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)
  const [isSidebarOpened, { open: openSidebar, close: closeSidebar }] = useDisclosure(false)
  const cityName = city as CityNameType
  const { data: routes = [], isLoading: isRoutesLoading, error: routesError } = busApi.useGetRoutesByCityQuery(
    cityName,
    { skip: !city || !id }
  )
  const { data: stopOfRoutes = [], isLoading: isStopOfRoutesLoading, error: stopOfRoutesError } =
    busApi.useGetStopOfRoutesByCityQuery(cityName, { skip: !city || !id })
  const { data: stopsByCity = [], isLoading: isStopsLoading, error: stopsError } =
    busApi.useGetStopsByCityQuery(cityName, { skip: !city || !id })

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

  useEffect(() => {
    if (!routeTabs.length) {
      setActiveTab(null)
      return
    }

    setActiveTab((currentTab) => currentTab && routeTabs.some((tab) => tab.id === currentTab)
      ? currentTab
      : routeTabs[0].id)
  }, [routeTabs])

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

  const stopPositionMap = useMemo(() => {
    return stopsByCity.reduce<Map<string, (typeof stopsByCity)[number]['position']>>((result, stop) => {
      if (stop.position) {
        result.set(stop.StopUID, stop.position)
        result.set(stop.StopID, stop.position)
      }
      return result
    }, new Map())
  }, [stopsByCity])

  const timelineStops = useMemo(() => {
    return (activeStopOfRoute?.Stops ?? []).map((stop) => ({
      id: stop.StopUID,
      name: stop.StopName.zh_TW,
      sequence: stop.StopSequence,
      isFavorite: false
    }))
  }, [activeStopOfRoute])

  const routeMapStops = useMemo(() => {
    return (activeStopOfRoute?.Stops ?? []).map((stop: StopOfRouteStop) => ({
      id: stop.StopUID,
      name: stop.StopName.zh_TW,
      sequence: stop.StopSequence,
      position: stopPositionMap.get(stop.StopUID) ?? stopPositionMap.get(stop.StopID) ?? null
    }))
  }, [activeStopOfRoute, stopPositionMap])

  const isLoading = isRoutesLoading || isStopOfRoutesLoading || isStopsLoading
  const error = routesError || stopOfRoutesError || stopsError
  const message = useMemo(() => {
    if (error) return routeMessages.loadRouteError
    if (isLoading) return routeMessages.loadingRoute
    if (!busRoute || routeTabs.length === 0) return routeMessages.emptyRoute

    return null
  }, [busRoute, error, isLoading, routeTabs.length])

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
      panel={(
        <Stack h="100%" gap="md">
          {message && (
            <Alert color={message.color} title={message.title}>
              {message.description}
            </Alert>
          )}
          {busRoute && routeTabs.length > 0 && (
            <>
              <Stack gap={4}>
                <Flex gap="xs">
                  <ActionIcon onClick={handleBack}>
                    <RiArrowLeftSLine size={18} />
                  </ActionIcon>
                  <Title order={3}>{busRoute.RouteName.zh_TW || '公車路線'}</Title>

                </Flex>
                <Text size="sm" c="dimmed">
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
                {routeTabs.map((tab) => (
                  <Tabs.Panel
                    key={tab.id}
                    value={tab.id}
                    pt="md"
                    style={{ flex: 1, minHeight: 0 }}
                  >
                    <ScrollArea h="100%">
                      <RouteStopsTimeline stops={timelineStops} />
                    </ScrollArea>
                  </Tabs.Panel>
                ))}
              </Tabs>
            </>
          )}
        </Stack>
      )}
    >
      <RouteMap stops={routeMapStops} />
    </MapSidebarLayout>
  )
}
