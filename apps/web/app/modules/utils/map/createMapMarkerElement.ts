import { MAP_MARKER_SIZE } from '../../consts/layout'
import { MAP_COLORS } from '../../consts/mapColors'
import { MAP_Z_INDEX } from '../../consts/mapLayers'

type MapMarkerType = 'stop' | 'vehicle' | 'user'

interface CreateMapMarkerElementOptions {
  ariaLabel?: string
  backgroundColor?: string
  borderColor?: string
  boxShadow?: string
  color?: string
  datasetLabel?: string
  fontSize?: string
  fontWeight?: string
  interactive?: boolean
  textContent?: string
  title?: string
  type: MapMarkerType
}

const markerStyleMap: Record<MapMarkerType, Partial<CSSStyleDeclaration>> = {
  stop: {
    width: `${MAP_MARKER_SIZE.stop}px`,
    height: `${MAP_MARKER_SIZE.stop}px`,
    borderRadius: '50%',
    backgroundColor: MAP_COLORS.markerOutline,
    border: `2px solid ${MAP_COLORS.route}`,
    color: MAP_COLORS.markerInk,
    fontSize: '12px',
    fontWeight: '700',
  },
  vehicle: {
    width: `${MAP_MARKER_SIZE.vehicle}px`,
    height: `${MAP_MARKER_SIZE.vehicle}px`,
    borderRadius: '8px',
    backgroundColor: MAP_COLORS.vehicle,
    border: `2px solid ${MAP_COLORS.markerOutline}`,
    color: MAP_COLORS.markerOutline,
    fontSize: '12px',
    fontWeight: '700',
  },
  user: {
    width: `${MAP_MARKER_SIZE.user}px`,
    height: `${MAP_MARKER_SIZE.user}px`,
    borderRadius: '50%',
    backgroundColor: MAP_COLORS.userLocation,
    border: `3px solid ${MAP_COLORS.markerOutline}`,
    zIndex: String(MAP_Z_INDEX.userMarker),
  },
}

export const createMapMarkerElement = ({
  ariaLabel,
  backgroundColor,
  borderColor,
  boxShadow,
  color,
  datasetLabel,
  fontSize,
  fontWeight,
  interactive = false,
  textContent,
  title,
  type,
}: CreateMapMarkerElementOptions) => {
  const element = document.createElement('div')

  Object.assign(element.style, {
    ...markerStyleMap[type],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: backgroundColor ?? markerStyleMap[type].backgroundColor,
    borderColor: borderColor ?? markerStyleMap[type].borderColor,
    boxShadow,
    color: color ?? markerStyleMap[type].color,
    cursor: interactive ? 'pointer' : 'default',
    fontSize: fontSize ?? markerStyleMap[type].fontSize,
    fontWeight: fontWeight ?? markerStyleMap[type].fontWeight,
  } satisfies Partial<CSSStyleDeclaration>)

  if (datasetLabel) {
    element.dataset.label = datasetLabel
  }

  if (ariaLabel) {
    element.setAttribute('aria-label', ariaLabel)
  }

  if (interactive) {
    element.setAttribute('role', 'button')
    element.tabIndex = 0
  } else if (ariaLabel) {
    element.setAttribute('role', 'img')
  }

  if (textContent) {
    element.textContent = textContent
  }

  if (title) {
    element.title = title
  }

  return element
}
