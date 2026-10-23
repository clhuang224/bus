import { Overlay, useMantineTheme } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MapSidebarLayout } from '~/components/common/MapSidebarLayout'
import { NearbySidebarContent } from '~/components/nearby/NearbySidebarContent'
import { useNearbyData } from '~/modules/hooks/nearby/useNearbyData'
import { useScrollSelectedItem } from '~/modules/hooks/shared/useScrollSelectedItem'
import { useNearbySearchParams } from '~/modules/hooks/nearby/useNearbySearchParams'
import { NearbyStationDetail } from '~/components/nearby/NearbyStationDetail'
import { NearbyStationMap } from '~/components/nearby/NearbyStationMap'

const Nearby = () => {
  const { t } = useTranslation()
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const stationItemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const theme = useMantineTheme()
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)
  const [isSidebarOpened, { open: openSidebar, close: closeSidebar }] =
    useDisclosure(false)
  const {
    selectedStationId,
    selectedStationRoutesId,
    selectStation,
    viewStationRoutes,
    backToNearbyStations,
  } = useNearbySearchParams()
  const {
    coords,
    hasStationRouteBadgesError,
    hasStationRoutesError,
    isNearbyDisabled,
    isStationRouteBadgesLoading,
    isStationRouteBadgesRateLimited,
    isStationRoutesLoading,
    isStationRoutesRateLimited,
    isStationsLoading,
    markers,
    message,
    nearbyStations,
    selectedMapStation,
    selectedStationRoutes,
    selectedRouteStation,
    stationRouteBadgesMap,
  } = useNearbyData({
    selectedStationId,
    selectedStationRoutesId,
  })

  useScrollSelectedItem({
    itemElementRefs: stationItemRefs,
    listItems: nearbyStations,
    selectedItemId: selectedStationId,
  })

  useEffect(() => {
    if (isSm) {
      openSidebar()
      return
    }
  }, [isSm])

  useEffect(() => {
    if (!isSm || !selectedStationRoutesId) return
    openSidebar()
  }, [isSm, selectedStationRoutesId, openSidebar])

  const selectedStationPopupContent = selectedMapStation ? (
    <NearbyStationDetail
      station={selectedMapStation}
      hasRoutesError={hasStationRouteBadgesError}
      routes={stationRouteBadgesMap.get(selectedMapStation.stationId) ?? []}
      isRoutesLoading={isStationRouteBadgesLoading}
      isRoutesRateLimited={isStationRouteBadgesRateLimited}
      displayMode="title"
      onViewStationRoutes={viewStationRoutes}
    />
  ) : null

  const selectStationFromMap = (stationId: string | null) => {
    selectStation(stationId)

    if (isSm && stationId) {
      openSidebar()
    }
  }

  return (
    <MapSidebarLayout
      isSm={isSm}
      isSidebarOpened={isSidebarOpened}
      onCloseSidebar={closeSidebar}
      onOpenSidebar={openSidebar}
      panelTitle={t('layout.nav.nearby')}
      panel={
        <NearbySidebarContent
          detailState={{
            hasStationRoutesError,
            isStationRoutesLoading,
            isStationRoutesRateLimited,
            onBack: backToNearbyStations,
            station: selectedRouteStation,
            stationRoutes: selectedStationRoutes,
          }}
          listState={{
            hasStationRouteBadgesError,
            isStationsLoading,
            isStationRouteBadgesRateLimited,
            isStationRoutesLoading: isStationRouteBadgesLoading,
            nearbyStations,
            onSelectStation: selectStation,
            onViewStationRoutes: viewStationRoutes,
            scrollViewportRef,
            selectedStationId,
            stationRouteBadgesMap,
            stationItemRefs,
          }}
          message={message}
        />
      }
    >
      {isNearbyDisabled && (
        <Overlay
          color="#fff"
          backgroundOpacity={0.55}
          zIndex={1}
          style={{ cursor: 'not-allowed' }}
        />
      )}
      <NearbyStationMap
        center={coords}
        markers={markers}
        selectedStation={selectedStationId}
        selectedStationPopupContent={selectedStationPopupContent}
        onSelectStation={selectStationFromMap}
      />
    </MapSidebarLayout>
  )
}

export default Nearby
