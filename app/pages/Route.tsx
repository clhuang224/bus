import { ActionIcon, Flex, Stack, Tabs, Text, useMantineTheme } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { BaseAlert } from '~/components/common/BaseAlert'
import { FocusUserLocationButton } from '~/components/common/FocusUserLocationButton'
import { MapSidebarLayout } from '~/components/common/MapSidebarLayout'
import { useLocation, useNavigate, useParams } from 'react-router'
import { RouteMap } from '~/components/routes/RouteMap'
import { RouteStopList } from '~/components/routes/RouteStopList'
import { useFavoriteRouteStops } from '~/modules/hooks/useFavoriteRouteStops'
import { useRouteBaseData } from '~/modules/hooks/useRouteBaseData'
import { useRouteRealtimeData } from '~/modules/hooks/useRouteRealtimeData'
import { RiArrowLeftSLine } from '@remixicon/react'
import { AppBadge } from '~/components/common/AppBadge'
import { selectLocale } from '~/modules/slices/localeSlice'
import { getTerminalDisplay } from '~/modules/utils/i18n/getTerminalDisplay'
import { getLocalizedText } from '~/modules/utils/i18n/getLocalizedText'
import { saveRouteSearchRecent } from '~/modules/utils/routes/routeSearchRecentStorage'
import { isCityName } from '~/modules/utils/shared/isCityName'
import type { Map as MapLibreMap } from 'maplibre-gl'

export default function Route() {
  const { t } = useTranslation()
  const locale = useSelector(selectLocale)
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
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [routeMapInstance, setRouteMapInstance] = useState<MapLibreMap | null>(null)
  const routeBaseOptions = city && isCityName(city) && id
    ? {
        activeTab,
        city,
        id,
        isFavoriteRouteStop,
        locationState: location.state
      }
    : null
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
  } = useRouteBaseData(routeBaseOptions)
  const routeRealtimeOptions = city && isCityName(city) && id && busRoute && activeSubRoute
    ? {
        activeSubRoute,
        busRoute,
        city,
        id
      }
    : null
  const {
    activeRoutePath,
    estimatedArrivalLabelsByStopKey,
    hasRealtimeError,
    isRealtimeLoading,
    isRealtimeRateLimited,
    realtimeMapVehicles,
    realtimeBusesByStopSequence,
    realtimeInfoState
  } = useRouteRealtimeData(routeRealtimeOptions)
  const timelineStops = useMemo(() => baseTimelineStops.map((stop) => ({
    ...stop,
    estimatedArrivalLabel: estimatedArrivalLabelsByStopKey.get(stop.id) ??
      estimatedArrivalLabelsByStopKey.get(stop.stopID) ??
      null,
    realtimeBuses: realtimeBusesByStopSequence.get(stop.sequence) ?? []
  })), [baseTimelineStops, estimatedArrivalLabelsByStopKey, realtimeBusesByStopSequence])
  const routeName = busRoute ? getLocalizedText(busRoute.RouteName, locale) : null
  const routeDeparture = busRoute ? getLocalizedText(busRoute.DepartureStopName, locale) : null
  const routeDestination = busRoute ? getLocalizedText(busRoute.DestinationStopName, locale) : null
  const routeTerminalDisplay = getTerminalDisplay(routeDeparture, routeDestination, ' - ')

  useEffect(() => {
    if (isSm) {
      openSidebar()
      return
    }
  }, [isSm, openSidebar])

  useEffect(() => {
    if (!city || !isCityName(city) || !id) {
      return
    }

    saveRouteSearchRecent(id)
  }, [city, id])

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

  useEffect(() => {
    if (!selectedVehicleId) return
    if (timelineStops.some((stop) => stop.realtimeBuses.some((bus) => bus.id === selectedVehicleId))) return

    setSelectedVehicleId(null)
  }, [selectedVehicleId, timelineStops])

  const handleSelectStopFromList = useCallback((stopId: string) => {
    setListScrollBehavior('nearest')
    setSelectedStopId(stopId)
    setSelectedVehicleId(null)

    if (isSm) {
      closeSidebar()
    }
  }, [closeSidebar, isSm])

  const handleSelectVehicleFromList = useCallback((vehicleId: string) => {
    setSelectedVehicleId(vehicleId)
    setSelectedStopId(null)

    if (isSm) {
      closeSidebar()
    }
  }, [closeSidebar, isSm])

  const handleSelectVehicleFromMap = useCallback((vehicleId: string) => {
    setListScrollBehavior('start')
    setSelectedVehicleId(vehicleId)
    setSelectedStopId(null)
  }, [])

  const handleSelectStopFromMap = useCallback((stopId: string | null) => {
    setListScrollBehavior('start')
    setSelectedStopId(stopId)
    setSelectedVehicleId(null)
  }, [])

  const handleBack = useCallback(() => {
    if ((window.history.state?.idx ?? 0) > 0) {
      navigate(-1)
      return
    }

    navigate('/routes')
  }, [navigate])

  return (
    <MapSidebarLayout
      isSm={isSm}
      isSidebarOpened={isSidebarOpened}
      mapControls={<FocusUserLocationButton map={routeMapInstance} />}
      onCloseSidebar={closeSidebar}
      onOpenSidebar={openSidebar}
      openButtonLabel={t('components.mapSidebarLayout.openRouteList')}
      panel={(
        <Stack h="100%" gap="md">
          <Stack gap={4}>
            <Flex gap="xs" align="center">
              <ActionIcon aria-label={t('routePage.backToRoutes')} onClick={handleBack}>
                <RiArrowLeftSLine size={18} />
              </ActionIcon>
              {routeName && (
                <AppBadge type="route" size="xl">{routeName}</AppBadge>
              )}
            </Flex>
            {routeTerminalDisplay && (
              <Text size="sm" c="dimmed" mt="sm">
                {routeTerminalDisplay.text}
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
                    isRealtimeRateLimited={isRealtimeRateLimited}
                    listScrollBehavior={listScrollBehavior}
                    onSelectStop={handleSelectStopFromList}
                    onSelectVehicle={handleSelectVehicleFromList}
                    realtimeInfoState={realtimeInfoState}
                    stops={timelineStops}
                    onToggleFavorite={toggleFavoriteRouteStop}
                    selectedStopId={selectedStopId}
                    selectedVehicleId={selectedVehicleId}
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
        onMapLoad={setRouteMapInstance}
        selectedStop={selectedStopId}
        selectedVehicleId={selectedVehicleId}
        onSelectStop={handleSelectStopFromMap}
        onSelectVehicle={handleSelectVehicleFromMap}
        routePath={activeRoutePath}
        stops={routeMapStops}
        vehicles={realtimeMapVehicles}
      />
    </MapSidebarLayout>
  )
}
