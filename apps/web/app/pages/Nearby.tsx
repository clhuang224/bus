import { ActionIcon, Overlay, useMantineTheme } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MapSidebarLayout } from '~/components/common/MapSidebarLayout'
import { NearbySidebarContent } from '~/components/nearby/NearbySidebarContent'
import { useNearbyData } from '~/modules/hooks/nearby/useNearbyData'
import { useScrollSelectedItem } from '~/modules/hooks/shared/useScrollSelectedItem'
import { useNearbySearchParams } from '~/modules/hooks/nearby/useNearbySearchParams'
import { NearbyStopDetail } from '~/components/nearby/NearbyStopDetail'
import { NearbyStopMap } from '~/components/nearby/NearbyStopMap'
import { RiMenuFill } from '@remixicon/react'

const Nearby = () => {
  const { t } = useTranslation()
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const stopItemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const theme = useMantineTheme()
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)
  const [isSidebarOpened, { open: openSidebar, close: closeSidebar }] = useDisclosure(false)
  const {
    selectedStopId,
    selectedRouteStopId,
    selectStop,
    viewStopRoutes,
    backToNearbyStops
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
          hasRoutesError={hasStationRouteBadgesError}
          routes={stationRouteBadgesMap.get(selectedMapStopGroup.StationID) ?? []}
          isRoutesLoading={isStationRouteBadgesLoading}
          isRoutesRateLimited={isStationRouteBadgesRateLimited}
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
      onCloseSidebar={closeSidebar}
      panel={(
        <NearbySidebarContent
          detailState={{
            hasStationRoutesError,
            isStationRoutesLoading,
            isStationRoutesRateLimited,
            onBack: backToNearbyStops,
            stopGroup: selectedStopGroup,
            stationRoutes: selectedStationRoutes
          }}
          listState={{
            hasStationRouteBadgesError,
            isStopsLoading,
            isStationRouteBadgesRateLimited,
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
          extraControls={isSm
            ? (
              <ActionIcon
                onClick={openSidebar}
                aria-label={t('components.mapSidebarLayout.openNearbyStops')}
              >
                <RiMenuFill size={18} />
              </ActionIcon>
              )
            : null}
          markers={markers}
          selectedStop={selectedStopId}
          selectedStopPopupContent={selectedStopPopupContent}
          isSm={isSm}
          onSelectStop={selectStop}
        />
    </MapSidebarLayout>
  )
}

export default Nearby
