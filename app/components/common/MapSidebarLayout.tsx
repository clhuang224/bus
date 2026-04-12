import { ActionIcon, Box, Drawer, Flex } from '@mantine/core'
import { RiMenuFill } from '@remixicon/react'
import type { ReactNode } from 'react'
import {
  APP_FLOATING_ACTION_OFFSET,
  APP_HEADER_HEIGHT,
  APP_PAGE_PADDING,
  MAP_SIDEBAR_WIDTH
} from '~/modules/consts/layout'

interface PropType {
  children: ReactNode
  isSm: boolean
  isSidebarOpened: boolean
  mapControls?: ReactNode
  onCloseSidebar: () => void
  onOpenSidebar: () => void
  openButtonLabel: string
  panel: ReactNode
}

export const MapSidebarLayout = ({
  children,
  isSm,
  isSidebarOpened,
  mapControls,
  onCloseSidebar,
  onOpenSidebar,
  openButtonLabel,
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
      {(mapControls || isSm) && (
        <Flex
          pos="absolute"
          right={APP_FLOATING_ACTION_OFFSET}
          bottom="48px"
          direction="column"
          gap="sm"
          style={{ zIndex: 2 }}
        >
          {mapControls}
          {isSm && (
            <ActionIcon
              onClick={onOpenSidebar}
              aria-label={openButtonLabel}
            >
              <RiMenuFill size={18} />
            </ActionIcon>
          )}
        </Flex>
      )}

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
