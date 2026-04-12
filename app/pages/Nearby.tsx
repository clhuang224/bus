import { Overlay, useMantineTheme } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FocusUserLocationButton } from '~/components/common/FocusUserLocationButton'
import { MapSidebarLayout } from '~/components/common/MapSidebarLayout'
import { NearbySidebarContent } from '~/components/nearby/NearbySidebarContent'
import { useNearbyData } from '~/modules/hooks/useNearbyData'
import { useScrollSelectedItem } from '~/modules/hooks/useScrollSelectedItem'
import { useNearbySearchParams } from '~/modules/hooks/useNearbySearchParams'
import { NearbyStopDetail } from '~/components/nearby/NearbyStopDetail'
import { NearbyStopMap } from '~/components/nearby/NearbyStopMap'

const Nearby = () => {
  const { t } = useTranslation()
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const stopItemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const theme = useMantineTheme()
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)
  const [isSidebarOpened, { open: openSidebar, close: closeSidebar }] = useDisclosure(false)
  const [nearbyMapInstance, setNearbyMapInstance] = useState<MapLibreMap | null>(null)
  const {
    selectedStopId,
    selectedRouteStopId,
    selectStop,
    viewStopRoutes,
    backToNearbyStops
  } = useNearbySearchParams()
  const {
    coords,
    isNearbyDisabled,
    isStationRouteBadgesLoading,
    isStationRoutesLoading,
    isStopsLoading,
    markers,
    message,
    nearbyStopGroups,
    selectedMapStopGroup,
    selectedStationRoutes,
    selectedStopGroup,
    stationRouteBadgesMap
  } = useNearbyData({
    selectedStopId,
    selectedRouteStopId
  })

  useScrollSelectedItem({
    itemElementRefs: stopItemRefs,
    listItems: nearbyStopGroups,
    selectedItemId: selectedStopId
  })

  useEffect(() => {
    if (isSm) {
      openSidebar()
      return
    }
  }, [isSm])

  useEffect(() => {
    if (!isSm || !selectedRouteStopId) return
    openSidebar()
  }, [isSm, selectedRouteStopId, openSidebar])

  const selectedStopPopupContent = selectedMapStopGroup
    ? (
        <NearbyStopDetail
          stopGroup={selectedMapStopGroup}
          routes={stationRouteBadgesMap.get(selectedMapStopGroup.StationID) ?? []}
          isRoutesLoading={isStationRouteBadgesLoading}
          displayMode={isSm ? 'full' : 'title'}
          onViewRoutes={(stationID) => {
            viewStopRoutes(stationID)
          if (isSm) {
            openSidebar()
          }
        }}
      />
    )
    : null

  return (
    <MapSidebarLayout
      isSm={isSm}
      isSidebarOpened={isSidebarOpened}
      mapControls={<FocusUserLocationButton map={nearbyMapInstance} />}
      onCloseSidebar={closeSidebar}
      onOpenSidebar={openSidebar}
      openButtonLabel={t('components.mapSidebarLayout.openNearbyStops')}
      panel={(
        <NearbySidebarContent
          detailState={{
            isStationRoutesLoading,
            onBack: backToNearbyStops,
            stopGroup: selectedStopGroup,
            stationRoutes: selectedStationRoutes
          }}
          listState={{
            isStopsLoading,
            isStationRoutesLoading: isStationRouteBadgesLoading,
            nearbyStopGroups,
            onSelectStop: selectStop,
            onViewRoutes: viewStopRoutes,
            scrollViewportRef,
            selectedStopId,
            stationRouteBadgesMap,
            stopItemRefs
          }}
          message={message}
        />
      )}
    >
        {isNearbyDisabled && (
          <Overlay
            color="#fff"
            backgroundOpacity={0.55}
            zIndex={1}
            style={{ cursor: 'not-allowed' }}
          />
        )}
        <NearbyStopMap
          center={coords}
          markers={markers}
          onMapLoad={setNearbyMapInstance}
          selectedStop={selectedStopId}
          selectedStopPopupContent={selectedStopPopupContent}
          isSm={isSm}
          onSelectStop={selectStop}
        />
    </MapSidebarLayout>
  )
}

export default Nearby
