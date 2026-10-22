export const APP_HEADER_HEIGHT = 76
export const APP_MOBILE_HEADER_HEIGHT = 68
export const APP_FOOTER_HEIGHT = 84
export const APP_PAGE_PADDING = 16
export const APP_PAGE_MAX_WIDTH = 720
export const APP_FLOATING_ACTION_OFFSET = 16
export const APP_BRAND_MARK_SIZE = 32
export const AREA_SELECT_WIDTH = 124

export const MAP_SIDEBAR_WIDTH = 400
export const MAP_FRAME_RADIUS = 32
export const APP_ACTION_ICON_SIZE = 18
export const MAP_CONTROLS_BOTTOM_OFFSET = 48
export const MAP_POPUP_RADIUS = 16
export const MAP_STOP_POPUP_OFFSET = 25
export const MAP_VEHICLE_POPUP_OFFSET = 20
export const MAP_MARKER_SIZE = {
  stop: 28,
  vehicle: 24,
  user: 20,
} as const

export const ROUTE_STOP_BULLET_SIZE = MAP_MARKER_SIZE.stop

export const MAP_OVERLAY_TOP_INSET_VAR = '--map-overlay-top-inset'
export const MAP_OVERLAY_BOTTOM_INSET_VAR = '--map-overlay-bottom-inset'
export const MOBILE_MAP_OVERLAY_INSETS = {
  [MAP_OVERLAY_TOP_INSET_VAR]: `${APP_MOBILE_HEADER_HEIGHT}px`,
  [MAP_OVERLAY_BOTTOM_INSET_VAR]: `${APP_FOOTER_HEIGHT}px`,
}

const MOBILE_DRAWER_MAP_PEEK_HEIGHT = 64
export const DRAWER_TOP =
  APP_MOBILE_HEADER_HEIGHT + MOBILE_DRAWER_MAP_PEEK_HEIGHT
