import { ActionIcon, Box, Drawer, Flex } from '@mantine/core'
import { RiMenuFill } from '@remixicon/react'
import type { ReactNode } from 'react'
import { APP_HEADER_HEIGHT, MAP_SIDEBAR_WIDTH } from '~/modules/consts/layout'

interface PropType {
  children: ReactNode
  isSm: boolean
  isSidebarOpened: boolean
  onCloseSidebar: () => void
  onOpenSidebar: () => void
  openButtonLabel: string
  sidebar: ReactNode
}

export const MapSidebarLayout = ({
  children,
  isSm,
  isSidebarOpened,
  onCloseSidebar,
  onOpenSidebar,
  openButtonLabel,
  sidebar
}: PropType) => (
  <Flex h="100%" pos="relative">
    {!isSm && (
      <Box
        pos="absolute"
        top={0}
        left={0}
        w={MAP_SIDEBAR_WIDTH}
        h="100%"
        p="lg"
        bg="white"
        style={{
          zIndex: 1,
          borderRight: '1px solid var(--mantine-color-gray-3)'
        }}
      >
        {sidebar}
      </Box>
    )}

    <Flex pos="relative" style={{ flex: 1 }}>
      {isSm && (
        <ActionIcon
          pos="absolute"
          right="8px"
          bottom="8px"
          style={{ zIndex: 2 }}
          onClick={onOpenSidebar}
          aria-label={openButtonLabel}
        >
          <RiMenuFill size={18} />
        </ActionIcon>
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
        {sidebar}
      </Drawer>

      {children}
    </Flex>
  </Flex>
)
