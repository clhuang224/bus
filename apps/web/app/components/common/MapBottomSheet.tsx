import { Box, VisuallyHidden } from '@mantine/core'
import { useEffect, useState, type ReactNode } from 'react'
import { Drawer } from 'vaul'
import {
  APP_FOOTER_HEIGHT,
  MAP_SHEET_HALF_RATIO,
  MAP_SHEET_PEEK_HEIGHT,
  MAP_SHEET_TOP,
} from '~/modules/consts/layout'

type SnapPoint = number | string

const PEEK_SNAP_POINT = `${MAP_SHEET_TOP + MAP_SHEET_PEEK_HEIGHT}px`
const HALF_SNAP_POINT = MAP_SHEET_HALF_RATIO
const FULL_SNAP_POINT = 1
const SNAP_POINTS = [PEEK_SNAP_POINT, HALF_SNAP_POINT, FULL_SNAP_POINT]
const SHEET_Z_INDEX = 99

function getVisibleHeight(snapPoint: SnapPoint | null) {
  if (snapPoint === PEEK_SNAP_POINT || snapPoint === null) {
    return MAP_SHEET_PEEK_HEIGHT
  }

  return window.innerHeight * HALF_SNAP_POINT - MAP_SHEET_TOP
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

  useEffect(() => {
    onVisibleHeightChange(getVisibleHeight(snapPoint))
  }, [onVisibleHeightChange, snapPoint])

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
        <Drawer.Content
          aria-describedby={undefined}
          style={{
            position: 'fixed',
            top: MAP_SHEET_TOP,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: SHEET_Z_INDEX,
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: `calc(${APP_FOOTER_HEIGHT}px + env(safe-area-inset-bottom))`,
            background: 'var(--mantine-color-body)',
            borderRadius:
              'var(--mantine-radius-xl) var(--mantine-radius-xl) 0 0',
            boxShadow: 'var(--mantine-shadow-md)',
            outline: 'none',
          }}
        >
          <VisuallyHidden>
            <Drawer.Title>{title}</Drawer.Title>
          </VisuallyHidden>
          <Box py="sm">
            <Drawer.Handle />
          </Box>
          <Box
            px="md"
            pb="md"
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {children}
          </Box>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
