import type { LatLng, LngLat } from '~/modules/types/CoordsType'

export const toLatLng = (position: LngLat | null): LatLng | null => {
  if (!position) {
    return null
  }

  return [position[1], position[0]]
}

export const toLngLat = (position: LatLng | null): LngLat | null => {
  if (!position) {
    return null
  }

  return [position[1], position[0]]
}