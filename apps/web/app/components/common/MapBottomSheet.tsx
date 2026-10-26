import { Box, Paper, Stack, VisuallyHidden } from '@mantine/core'
import { useViewportSize } from '@mantine/hooks'
import { useEffect, useState, type ReactNode } from 'react'
import { Drawer } from 'vaul'
import {
  APP_FOOTER_HEIGHT,
  MAP_PANEL_BACKGROUND_VAR,
  MAP_SHEET_HALF_RATIO,
  MAP_SHEET_PEEK_HEIGHT,
  MAP_SHEET_TOP,
  TOP_CORNERS_RADIUS_XL,
} from '~/modules/consts/layout'

type SnapPoint = number | string

const PEEK_SNAP_POINT = `${MAP_SHEET_TOP + MAP_SHEET_PEEK_HEIGHT}px`
const HALF_SNAP_POINT = MAP_SHEET_HALF_RATIO
const FULL_SNAP_POINT = 1
const SNAP_POINTS = [PEEK_SNAP_POINT, HALF_SNAP_POINT, FULL_SNAP_POINT]
const SHEET_Z_INDEX = 99

function getVisibleHeight(snapPoint: SnapPoint | null, viewportHeight: number) {
  if (typeof snapPoint !== 'number') return MAP_SHEET_PEEK_HEIGHT

  return Math.max(
    MAP_SHEET_PEEK_HEIGHT,
    viewportHeight * snapPoint - MAP_SHEET_TOP,
  )
}

interface PropType {
  children: ReactNode
  isExpanded: boolean
  onCollapse: () => void
  onExpand: () => void
  onVisibleHeightChange: (height: number) => void
  title: string
}

export const MapBottomSheet = ({
  children,
  isExpanded,
  onCollapse,
  onExpand,
  onVisibleHeightChange,
  title,
}: PropType) => {
  const [snapPoint, setSnapPoint] = useState<SnapPoint | null>(
    isExpanded ? HALF_SNAP_POINT : PEEK_SNAP_POINT,
  )

  useEffect(() => {
    setSnapPoint((currentSnapPoint) => {
      if (!isExpanded) return PEEK_SNAP_POINT
      return currentSnapPoint === PEEK_SNAP_POINT
        ? HALF_SNAP_POINT
        : currentSnapPoint
    })
  }, [isExpanded])

  const { height: viewportHeight } = useViewportSize()
  const visibleHeight = getVisibleHeight(snapPoint, viewportHeight)
  const offscreenHeight = Math.max(
    0,
    viewportHeight - MAP_SHEET_TOP - visibleHeight,
  )

  useEffect(() => {
    onVisibleHeightChange(visibleHeight)
  }, [onVisibleHeightChange, visibleHeight])

  const handleSnapPointChange = (nextSnapPoint: SnapPoint | null) => {
    setSnapPoint(nextSnapPoint)

    if (nextSnapPoint === PEEK_SNAP_POINT) {
      onCollapse()
      return
    }

    onExpand()
  }

  return (
    <Drawer.Root
      open
      modal={false}
      dismissible={false}
      noBodyStyles
      snapPoints={SNAP_POINTS}
      activeSnapPoint={snapPoint}
      setActiveSnapPoint={handleSnapPointChange}
    >
      <Drawer.Portal>
        <Drawer.Content asChild aria-describedby={undefined}>
          <Paper
            pos="fixed"
            top={MAP_SHEET_TOP}
            right={0}
            bottom={0}
            left={0}
            display="flex"
            pb={`calc(${APP_FOOTER_HEIGHT + offscreenHeight}px + env(safe-area-inset-bottom))`}
            bg="var(--mantine-color-body)"
            shadow="md"
            style={{
              [MAP_PANEL_BACKGROUND_VAR]: 'var(--mantine-color-body)',
              zIndex: SHEET_Z_INDEX,
              flexDirection: 'column',
              borderRadius: TOP_CORNERS_RADIUS_XL,
              outline: 'none',
            }}
          >
            <VisuallyHidden>
              <Drawer.Title>{title}</Drawer.Title>
            </VisuallyHidden>
            <Box py="sm">
              <Drawer.Handle />
            </Box>
            <Stack flex={1} mih={0} gap={0} px="md" pb="md">
              {children}
            </Stack>
          </Paper>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
