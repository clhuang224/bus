import { ActionIcon, Overlay, useMantineTheme } from '@mantine/core'
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
import { RiMenuFill } from '@remixicon/react'

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
      displayMode={isSm ? 'full' : 'title'}
      onViewStationRoutes={(stationId) => {
        viewStationRoutes(stationId)
        if (isSm) {
          openSidebar()
        }
      }}
    />
  ) : null

  return (
    <MapSidebarLayout
      isSm={isSm}
      isSidebarOpened={isSidebarOpened}
      onCloseSidebar={closeSidebar}
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
        extraControls={
          isSm ? (
            <ActionIcon
              onClick={openSidebar}
              aria-label={t('components.mapSidebarLayout.openNearbyStops')}
            >
              <RiMenuFill size={18} />
            </ActionIcon>
          ) : null
        }
        markers={markers}
        selectedStation={selectedStationId}
        selectedStationPopupContent={selectedStationPopupContent}
        isSm={isSm}
        onSelectStation={selectStation}
      />
    </MapSidebarLayout>
  )
}

export default Nearby
