import type { LatLng } from '~/modules/types/CoordsType'

interface GoogleMapsDirectionsOptions {
  destination: LatLng
}

export function getGoogleMapsDirectionsUrl({
  destination
}: GoogleMapsDirectionsOptions) {
  const params = new URLSearchParams({
    api: '1',
    destination: `${destination[0]},${destination[1]}`
  })

  return `https://www.google.com/maps/dir/?${params.toString()}`
}
