import { Box, Drawer, Flex } from '@mantine/core'
import type { ReactNode } from 'react'
import {
  APP_HEADER_HEIGHT,
  APP_PAGE_PADDING,
  MAP_SIDEBAR_WIDTH
} from '~/modules/consts/layout'

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
  panel
}: PropType) => (
  <Flex h="100%" pos="relative">
    {!isSm && (
      <Box
        w={MAP_SIDEBAR_WIDTH}
        h="100%"
        p={APP_PAGE_PADDING}
        bg="white"
        style={{
          flex: `0 0 ${MAP_SIDEBAR_WIDTH}px`,
          borderRight: '1px solid var(--mantine-color-gray-3)'
        }}
      >
        {panel}
      </Box>
    )}

    <Flex pos="relative" style={{ flex: 1, minWidth: 0 }}>
      <Drawer
        opened={isSm && isSidebarOpened}
        onClose={onCloseSidebar}
        position="bottom"
        size="100%"
        hiddenFrom="sm"
        styles={{
          content: {
            top: APP_HEADER_HEIGHT,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          },
          body: {
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {panel}
      </Drawer>

      {children}
    </Flex>
  </Flex>
)
