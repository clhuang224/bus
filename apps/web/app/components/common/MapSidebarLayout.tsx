import { Box, Drawer, Flex } from '@mantine/core'
import type { ReactNode } from 'react'
import {
  APP_FOOTER_HEIGHT,
  APP_MOBILE_HEADER_HEIGHT,
  APP_PAGE_PADDING,
  DRAWER_TOP,
  MAP_FRAME_RADIUS,
  MAP_OVERLAY_BOTTOM_INSET_VAR,
  MAP_OVERLAY_TOP_INSET_VAR,
  MAP_SIDEBAR_WIDTH,
} from '~/modules/consts/layout'

const fullScreenMapUnderBars = {
  [MAP_OVERLAY_TOP_INSET_VAR]: `${APP_MOBILE_HEADER_HEIGHT}px`,
  [MAP_OVERLAY_BOTTOM_INSET_VAR]: `${APP_FOOTER_HEIGHT}px`,
}

interface PropType {
  children: ReactNode
  isSm: boolean
  isSidebarOpened: boolean
  onCloseSidebar: () => void
  panel: ReactNode
}

export const MapSidebarLayout = ({
  children,
  isSm,
  isSidebarOpened,
  onCloseSidebar,
  panel,
}: PropType) => (
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
            borderRight: '1px solid var(--mantine-color-gray-3)',
          }}
        >
          {panel}
        </Box>
      )}

      <Flex
        pos={isSm ? 'fixed' : 'relative'}
        inset={isSm ? 0 : undefined}
        style={{ flex: 1, minWidth: 0, ...(isSm && fullScreenMapUnderBars) }}
      >
        <Drawer
          opened={isSm && isSidebarOpened}
          onClose={onCloseSidebar}
          position="bottom"
          size="100%"
          hiddenFrom="sm"
          styles={{
            content: {
              top: DRAWER_TOP,
              height: `calc(100dvh - ${DRAWER_TOP}px)`,
              position: 'absolute',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 'env(safe-area-inset-bottom)',
              borderRadius: `var(--mantine-radius-lg) var(--mantine-radius-lg) 0 0`,
            },
            body: {
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          {panel}
        </Drawer>

        {children}
      </Flex>
    </Flex>
  </Box>
)
