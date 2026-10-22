import { BRAND_COLORS } from '../../consts/brandColors'

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
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    border: `2px solid ${BRAND_COLORS.primary}`,
    color: BRAND_COLORS.ink,
    fontSize: '12px',
    fontWeight: '700',
  },
  vehicle: {
    width: '24px',
    height: '24px',
    borderRadius: '8px',
    backgroundColor: BRAND_COLORS.sun,
    border: '2px solid #ffffff',
    color: BRAND_COLORS.ink,
    fontSize: '12px',
    fontWeight: '700',
  },
  user: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: BRAND_COLORS.primary,
    border: '3px solid white',
    zIndex: '1',
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
