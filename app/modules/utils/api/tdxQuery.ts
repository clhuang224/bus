import { NEARBY_DISTANCE_KM } from '../../consts/nearby'
import type { CityNameType } from '../../enums/CityNameType'
import type { LatLng } from '../../types/CoordsType'
import { getLatitudeKilometersPerDegree, getLongitudeKilometersPerDegree } from '../geo/getGeoKilometersPerDegree'

const STOP_SELECT_FIELDS = [
  'StopUID',
  'StopID',
  'AuthorityID',
  'StationID',
  'StationGroupID',
  'StopName',
  'StopPosition',
  'StopAddress',
  'Bearing',
  'StopDescription',
  'City',
  'UpdateTime',
  'VersionID'
].join(',')

interface NearbyStopBounds {
  latitudeMin: number
  latitudeMax: number
  longitudeMin: number
  longitudeMax: number
}

function quoteODataString(value: string): string {
  return value.replace(/'/g, "''")
}

export function getNearbyStopBounds(
  coords: LatLng,
  distanceKm = NEARBY_DISTANCE_KM
): NearbyStopBounds {
  const [latitude, longitude] = coords
  const latitudeDelta = distanceKm / getLatitudeKilometersPerDegree()
  const longitudeDelta = distanceKm / getLongitudeKilometersPerDegree(latitude)

  return {
    latitudeMin: latitude - latitudeDelta,
    latitudeMax: latitude + latitudeDelta,
    longitudeMin: longitude - longitudeDelta,
    longitudeMax: longitude + longitudeDelta
  }
}

export function buildNearbyStopQuery(city: CityNameType, coords: LatLng): string {
  const bounds = getNearbyStopBounds(coords)

  const searchParams = new URLSearchParams({
    $select: STOP_SELECT_FIELDS,
    $filter: [
      `StopPosition/PositionLat ge ${bounds.latitudeMin.toFixed(6)}`,
      `StopPosition/PositionLat le ${bounds.latitudeMax.toFixed(6)}`,
      `StopPosition/PositionLon ge ${bounds.longitudeMin.toFixed(6)}`,
      `StopPosition/PositionLon le ${bounds.longitudeMax.toFixed(6)}`
    ].join(' and '),
    $format: 'JSON'
  })

  return `/Stop/City/${city}?${searchParams.toString()}`
}

export function buildNearbyStopOfRouteQuery(city: CityNameType, stopUIDs: string[]): string {
  const searchParams = new URLSearchParams({
    $format: 'JSON'
  })

  if (stopUIDs.length > 0) {
    searchParams.set(
      '$filter',
      `Stops/any(d:(${stopUIDs.map((stopUID) => `d/StopUID eq '${quoteODataString(stopUID)}'`).join(' or ')}))`
    )
  }

  return `/StopOfRoute/City/${city}?${searchParams.toString()}`
}

export function buildStopsByCityAndIdsQuery(city: CityNameType, stopIds: string[]): string {
  const filter = stopIds
    .map((stopId) => {
      const quotedStopId = quoteODataString(stopId)
      return `(StopUID eq '${quotedStopId}' or StopID eq '${quotedStopId}')`
    })
    .join(' or ')

  return `/Stop/City/${city}?%24filter=${encodeURIComponent(filter)}&%24format=JSON`
}
