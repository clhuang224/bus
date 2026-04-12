import type { LatLng } from '~/modules/types/CoordsType'

interface GoogleMapsDirectionsOptions {
  destination: LatLng
  origin?: LatLng | null
}

export function getGoogleMapsDirectionsUrl({
  destination,
  origin = null
}: GoogleMapsDirectionsOptions) {
  const params = new URLSearchParams({
    api: '1',
    destination: `${destination[0]},${destination[1]}`
  })

  if (origin) {
    params.set('origin', `${origin[0]},${origin[1]}`)
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`
}
