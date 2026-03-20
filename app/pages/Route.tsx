import { ActionIcon, Flex, Stack, Tabs, Text, useMantineTheme } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { useEffect, useMemo, useState } from 'react'
import { BaseAlert } from '~/components/common/BaseAlert'
import { MapSidebarLayout } from '~/components/common/MapSidebarLayout'
import { useLocation, useNavigate, useParams } from 'react-router'
import { RouteMap } from '~/components/routes/RouteMap'
import { RouteStopList } from '~/components/routes/RouteStopList'
import { useFavoriteRouteStops } from '~/modules/hooks/useFavoriteRouteStops'
import { useRouteBaseData } from '~/modules/hooks/useRouteBaseData'
import { useRouteRealtimeData } from '~/modules/hooks/useRouteRealtimeData'
import { RiArrowLeftSLine } from '@remixicon/react'
import { AppBadge } from '~/components/common/AppBadge'

export default function Route() {
  const { city, id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useMantineTheme()
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)
  const [isSidebarOpened, { open: openSidebar, close: closeSidebar }] = useDisclosure(false)
  const [listScrollBehavior, setListScrollBehavior] = useState<ScrollLogicalPosition>('nearest')
  const { isFavoriteRouteStop, toggleFavoriteRouteStop } = useFavoriteRouteStops()
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null)
  const {
    activeSubRoute,
    baseTimelineStops,
    busRoute,
    highlightedStopId,
    isLoading,
    isStopListLoading,
    message,
    defaultActiveTabId,
    routeMapStops,
    routeTabs
  } = useRouteBaseData({
    activeTab,
    city,
    id,
    isFavoriteRouteStop,
    locationState: location.state
  })
  const {
    activeRoutePath,
    estimatedArrivalLabelsByStopSequence,
    hasRealtimeError,
    isRealtimeLoading,
    realtimeBusesByStopSequence,
    realtimeBusStatuses,
    realtimeInfoState
  } = useRouteRealtimeData({
    activeSubRoute,
    busRoute,
    city,
    id
  })
  const timelineStops = useMemo(() => baseTimelineStops.map((stop) => ({
    ...stop,
    estimatedArrivalLabel: estimatedArrivalLabelsByStopSequence.get(stop.sequence) ?? null,
    realtimeBuses: realtimeBusesByStopSequence.get(stop.sequence) ?? []
  })), [baseTimelineStops, estimatedArrivalLabelsByStopSequence, realtimeBusesByStopSequence])

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

    setActiveTab((currentTab) => {
      if (currentTab && routeTabs.some((tab) => tab.id === currentTab)) {
        return currentTab
      }
      return defaultActiveTabId
    })
  }, [defaultActiveTabId, routeTabs])

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
  }

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
          <Stack gap={4}>
            <Flex gap="xs" align="center">
              <ActionIcon aria-label="返回路線列表" onClick={handleBack}>
                <RiArrowLeftSLine size={18} />
              </ActionIcon>
              {busRoute && (
                <AppBadge type="route" size="xl">{busRoute.RouteName.zh_TW}</AppBadge>
              )}
            </Flex>
            {busRoute && (
              <Text size="sm" c="dimmed" mt="sm">
                {busRoute.DepartureStopName.zh_TW} - {busRoute.DestinationStopName.zh_TW}
              </Text>
            )}
          </Stack>
          {routeTabs.length > 0
            ? (
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
              {!isLoading && message && <BaseAlert {...message} mt="sm" />}
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
                    isLoading={isStopListLoading}
                    isRealtimeLoading={isRealtimeLoading}
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
              )
            : (
                !isLoading && message
                  ? <BaseAlert {...message} />
                  : null
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
