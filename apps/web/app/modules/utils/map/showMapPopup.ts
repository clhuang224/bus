import type { Map, Popup } from 'maplibre-gl'
import { MAP_Z_INDEX } from '../../consts/mapLayers'

export function showMapPopup(popup: Popup, map: Map): Popup {
  popup.addTo(map)
  popup.getElement().style.zIndex = String(MAP_Z_INDEX.popup)

  return popup
}
