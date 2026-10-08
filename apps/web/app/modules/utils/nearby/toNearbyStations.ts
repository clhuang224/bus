import distance from '@turf/distance'
import { point } from '@turf/helpers'
import type { ApiStation, BearingType, LocalizedText } from '@bus/shared'
import { AppLocaleType } from '@bus/shared'
import type { BusRoute, BusSubRoute } from '../../interfaces/BusRoute'
import type {
  NearbyStation,
  NearbyStationRoute,
  NearbyStationRoutesMap,
  NearbyStationsResult,
} from '../../interfaces/Nearby'
import type { Stop } from '../../interfaces/Stop'
import type { StopOfRoute } from '../../interfaces/StopOfRoute'
import type { LatLng } from '../../types/CoordsType'
import { toLngLat } from '../geo/convertCoordinates'
import { toLocalizedText } from '../i18n/toLocalizedText'
import {
  EMPTY_LOCALIZED_TEXT,
  withLocalizedFallback,
} from '../i18n/withLocalizedFallback'

export function toNearbyStationsFromApi(
  stations: ApiStation[],
): NearbyStationsResult & { routesByStationId: NearbyStationRoutesMap } {
  return {
    stations: stations.map((station) => ({
      stationId: station.uuid,
      name: toLocalizedText(station.name),
      city: station.city,
      address: station.address ? toLocalizedText(station.address) : null,
      bearings: station.bearing ? [station.bearing] : [],
      position: [station.position.longitude, station.position.latitude],
    })),
    routesByStationId: Object.fromEntries(
      stations.map((station) => [
        station.uuid,
        station.route_directions.flatMap(({ direction, routes }) =>
          routes.map((route) => ({
            id: `${route.uuid}-${direction}`,
            routeUID: route.uuid,
            city: route.city,
            name: toLocalizedText(route.name),
            departure: toLocalizedText(route.departure),
            destination: toLocalizedText(route.destination),
            direction,
          })),
        ),
      ]),
    ),
  }
}

export function filterTdxStopsWithinDistance(
  stops: Stop[],
  coords: LatLng,
  distanceKm: number,
): Stop[] {
  const currentPoint = point(toLngLat(coords)!)

  return stops.filter((stop) => {
    if (!stop.position) return false

    return (
      distance(currentPoint, point(stop.position), { units: 'kilometers' }) <=
      distanceKm
    )
  })
}

function getTdxStationId(stop: { StationID?: string | null; StopUID: string }) {
  return stop.StationID ?? stop.StopUID
}

function toTdxAddress(addresses: string[]): LocalizedText | null {
  if (addresses.length === 0) return null

  return {
    ...EMPTY_LOCALIZED_TEXT,
    [AppLocaleType.ZH_TW]: addresses.join('、'),
  }
}

export function toNearbyStationsFromTdx(stops: Stop[]): NearbyStation[] {
  const stopsByStationId = new Map<string, Stop[]>()

  for (const stop of stops) {
    const stationId = getTdxStationId(stop)
    const stationStops = stopsByStationId.get(stationId) ?? []

    stationStops.push(stop)
    stopsByStationId.set(stationId, stationStops)
  }

  return [...stopsByStationId].map(([stationId, stationStops]) => {
    const representativeStop = stationStops[0]!
    const addresses = [
      ...new Set(
        stationStops
          .map((stop) => stop.StopAddress)
          .filter((address): address is string => Boolean(address)),
      ),
    ]
    const bearings = [
      ...new Set(
        stationStops
          .map((stop) => stop.Bearing)
          .filter((bearing): bearing is BearingType => bearing != null),
      ),
    ]

    return {
      stationId,
      name: representativeStop.StopName,
      city: representativeStop.City,
      address: toTdxAddress(addresses),
      bearings,
      position: representativeStop.position,
    }
  })
}

function getSubRouteKey(
  subRoute: Pick<BusSubRoute, 'SubRouteUID' | 'Direction'>,
) {
  return `${subRoute.SubRouteUID}-${subRoute.Direction}`
}

/**
 * Groups route directions by the station they stop at. Terminal names come
 * from `routes`; pass null when only route names are needed.
 */
export function toNearbyStationRoutesFromTdx(
  stopOfRoutes: StopOfRoute[],
  routes: BusRoute<string>[] | null,
): NearbyStationRoutesMap {
  const routesByUID = new Map(routes?.map((route) => [route.RouteUID, route]))
  const subRoutesByKey = new Map(
    routes?.flatMap((route) =>
      route.SubRoutes.map((subRoute) => [getSubRouteKey(subRoute), subRoute]),
    ),
  )
  const routesByStationId: NearbyStationRoutesMap = {}

  for (const stopOfRoute of stopOfRoutes) {
    const routeKey = getSubRouteKey(stopOfRoute)
    const subRoute = subRoutesByKey.get(routeKey)
    const route = routesByUID.get(stopOfRoute.RouteUID)
    const stationRoute: NearbyStationRoute = {
      id: routeKey,
      routeUID: stopOfRoute.RouteUID,
      city: stopOfRoute.City,
      name: withLocalizedFallback(
        stopOfRoute.SubRouteName,
        stopOfRoute.RouteName,
      ),
      departure:
        subRoute?.DepartureStopName ??
        (route
          ? withLocalizedFallback(route.DepartureStopName, route.RouteName)
          : EMPTY_LOCALIZED_TEXT),
      destination:
        subRoute?.DestinationStopName ??
        (route
          ? withLocalizedFallback(route.DestinationStopName, route.RouteName)
          : EMPTY_LOCALIZED_TEXT),
      direction: stopOfRoute.Direction,
    }

    for (const stop of stopOfRoute.Stops) {
      const stationId = getTdxStationId(stop)
      const stationRoutes = (routesByStationId[stationId] ??= [])

      if (!stationRoutes.some(({ id }) => id === stationRoute.id)) {
        stationRoutes.push(stationRoute)
      }
    }
  }

  return routesByStationId
}
