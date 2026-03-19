import type { LngLat } from '../types/CoordsType'

function decodeEncodedPolyline(encodedPolyline: string): LngLat[] {
  const coordinates: LngLat[] = []
  let index = 0
  let latitude = 0
  let longitude = 0

  while (index < encodedPolyline.length) {
    let shift = 0
    let result = 0
    let byte: number

    do {
      byte = encodedPolyline.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const latitudeDelta = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
    latitude += latitudeDelta

    shift = 0
    result = 0

    do {
      byte = encodedPolyline.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const longitudeDelta = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
    longitude += longitudeDelta

    coordinates.push([longitude / 1e5, latitude / 1e5])
  }

  return coordinates
}

function parseGeometryLineString(geometry: string): LngLat[] {
  return Array.from(geometry.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g), (match) => [
    Number(match[1]),
    Number(match[2])
  ] as LngLat)
}

export function parseRouteShapePath({
  encodedPolyline,
  geometry
}: {
  encodedPolyline?: string | null
  geometry?: string | null
}): LngLat[] {
  if (encodedPolyline) {
    return decodeEncodedPolyline(encodedPolyline)
  }

  if (geometry) {
    return parseGeometryLineString(geometry)
  }

  return []
}
