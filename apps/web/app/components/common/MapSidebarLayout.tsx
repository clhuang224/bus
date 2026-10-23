import { Box, Flex } from '@mantine/core'
import { useMemo, useState, type ReactNode } from 'react'
import {
  APP_MOBILE_HEADER_HEIGHT,
  APP_PAGE_PADDING,
  MAP_FRAME_RADIUS,
  MAP_OVERLAY_BOTTOM_INSET_VAR,
  MAP_OVERLAY_TOP_INSET_VAR,
  MAP_SHEET_PEEK_HEIGHT,
  MAP_SIDEBAR_WIDTH,
} from '~/modules/consts/layout'
import { MapOverlayInsetsContext } from './mapOverlayInsetsContext'
import { MapBottomSheet } from './MapBottomSheet'

interface PropType {
  children: ReactNode
  isSm: boolean
  isSidebarOpened: boolean
  onCloseSidebar: () => void
  onOpenSidebar: () => void
  panel: ReactNode
  panelTitle: string
}

export const MapSidebarLayout = ({
  children,
  isSm,
  isSidebarOpened,
  onCloseSidebar,
  onOpenSidebar,
  panel,
  panelTitle,
}: PropType) => {
  const [sheetVisibleHeight, setSheetVisibleHeight] = useState(
    MAP_SHEET_PEEK_HEIGHT,
  )
  const mapOverlayInsets = useMemo(
    () =>
      isSm
        ? { top: APP_MOBILE_HEADER_HEIGHT, bottom: sheetVisibleHeight }
        : { top: 0, bottom: 0 },
    [isSm, sheetVisibleHeight],
  )

  return (
    <Box
      h={{ base: '100%', sm: `calc(100% - ${APP_PAGE_PADDING}px)` }}
      pos="relative"
      mx={{ base: 0, sm: APP_PAGE_PADDING }}
      mb={{ base: 0, sm: APP_PAGE_PADDING }}
      bdrs={{ base: 0, sm: MAP_FRAME_RADIUS }}
      style={{ overflow: 'hidden' }}
    >
      <Flex h="100%" pos="relative">
        {!isSm && (
          <Box
            w={MAP_SIDEBAR_WIDTH}
            h="100%"
            p={APP_PAGE_PADDING}
            bg="white"
            style={{
              flex: `0 0 ${MAP_SIDEBAR_WIDTH}px`,
              boxShadow: 'var(--mantine-shadow-sm)',
            }}
          >
            {panel}
          </Box>
        )}

        <Flex
          pos={isSm ? 'fixed' : 'relative'}
          inset={isSm ? 0 : undefined}
          style={{
            flex: 1,
            minWidth: 0,
            ...(isSm && {
              [MAP_OVERLAY_TOP_INSET_VAR]: `${mapOverlayInsets.top}px`,
              [MAP_OVERLAY_BOTTOM_INSET_VAR]: `${mapOverlayInsets.bottom}px`,
            }),
          }}
        >
          <MapOverlayInsetsContext.Provider value={mapOverlayInsets}>
            {children}
          </MapOverlayInsetsContext.Provider>
        </Flex>

        {isSm && (
          <MapBottomSheet
            isExpanded={isSidebarOpened}
            onCollapse={onCloseSidebar}
            onExpand={onOpenSidebar}
            onVisibleHeightChange={setSheetVisibleHeight}
            title={panelTitle}
          >
            {panel}
          </MapBottomSheet>
        )}
      </Flex>
    </Box>
  )
}
