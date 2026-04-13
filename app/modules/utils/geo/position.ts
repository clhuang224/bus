import type { LatLng, LngLat } from '~/modules/types/CoordsType'

export const getLatLng = (position: LngLat | null): LatLng | null => {
  if (!position) {
    return null
  }

  return [position[1], position[0]]
}

export const getLngLat = (position: LatLng | null): LngLat | null => {
  if (!position) {
    return null
  }

  return [position[1], position[0]]
}
