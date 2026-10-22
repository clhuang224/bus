import type { Map, Popup } from 'maplibre-gl'
import { MAP_POPUP_RADIUS } from '../../consts/layout'
import { MAP_Z_INDEX } from '../../consts/mapLayers'

export function showMapPopup(popup: Popup, map: Map): Popup {
  popup.addTo(map)
  const popupElement = popup.getElement()
  popupElement.style.zIndex = String(MAP_Z_INDEX.popup)
  popupElement
    .querySelector<HTMLElement>('.maplibregl-popup-content')
    ?.style.setProperty('border-radius', `${MAP_POPUP_RADIUS}px`)

  return popup
}
