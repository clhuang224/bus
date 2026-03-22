type MapMarkerType = 'stop' | 'vehicle' | 'user'

interface CreateMapMarkerElementOptions {
  ariaLabel?: string
  backgroundColor?: string
  boxShadow?: string
  datasetLabel?: string
  fontSize?: string
  fontWeight?: string
  textContent?: string
  title?: string
  type: MapMarkerType
}

const markerStyleMap: Record<MapMarkerType, Partial<CSSStyleDeclaration>> = {
  stop: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#868e96',
    border: '2px solid #ffffff',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700'
  },
  vehicle: {
    width: '24px',
    height: '24px',
    borderRadius: '8px',
    backgroundColor: '#f08c00',
    border: '2px solid #ffffff',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700'
  },
  user: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#4A90E2',
    border: '3px solid white'
  }
}

export const createMapMarkerElement = ({
  ariaLabel,
  backgroundColor,
  boxShadow,
  datasetLabel,
  fontSize,
  fontWeight,
  textContent,
  title,
  type
}: CreateMapMarkerElementOptions) => {
  const element = document.createElement('div')

  Object.assign(element.style, {
    ...markerStyleMap[type],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: backgroundColor ?? markerStyleMap[type].backgroundColor,
    boxShadow,
    cursor: 'pointer',
    fontSize: fontSize ?? markerStyleMap[type].fontSize,
    fontWeight: fontWeight ?? markerStyleMap[type].fontWeight
  } satisfies Partial<CSSStyleDeclaration>)

  if (datasetLabel) {
    element.dataset.label = datasetLabel
  }

  if (ariaLabel) {
    element.setAttribute('aria-label', ariaLabel)
  }

  if (textContent) {
    element.textContent = textContent
  }

  if (title) {
    element.title = title
  }

  return element
}
