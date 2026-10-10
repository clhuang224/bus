import type { ApiRouteDetail, DirectionType } from '@bus/shared'
import type { BusRoute } from '../../interfaces/BusRoute'
import type {
  RouteDetail,
  RouteDetailSubRoute,
} from '../../interfaces/RouteDetail'
import type { RouteShape } from '../../interfaces/RouteShape'
import type { Stop } from '../../interfaces/Stop'
import type { StopOfRoute } from '../../interfaces/StopOfRoute'
import type { LngLat } from '../../types/CoordsType'
import { toLocalizedText } from '../i18n/toLocalizedText'

function getSubRouteId(subRouteUID: string, direction: DirectionType) {
  return `${subRouteUID}-${direction}`
}

/** Indexes items by sub-route ID, keeping the first item for each ID. */
function indexBySubRouteId<
  T extends { SubRouteUID: string | null; Direction: DirectionType },
>(items: T[]) {
  const result = new Map<string, T>()

  for (const item of items) {
    if (!item.SubRouteUID) continue

    const id = getSubRouteId(item.SubRouteUID, item.Direction)
    if (!result.has(id)) result.set(id, item)
  }

  return result
}

/** Stop IDs to request positions for, in a stable order for caching. */
export function getTdxRouteStopIds(
  routeUID: string,
  stopOfRoutes: StopOfRoute[],
): string[] {
  const stopIds = stopOfRoutes
    .filter((stopOfRoute) => stopOfRoute.RouteUID === routeUID)
    .flatMap((stopOfRoute) =>
      stopOfRoute.Stops.flatMap((stop) => [stop.StopUID, stop.StopID]),
    )

  return Array.from(new Set(stopIds)).sort()
}

export function toRouteDetailFromTdx({
  route,
  stopOfRoutes,
  stops,
  shapes,
}: {
  route: BusRoute<string>
  stopOfRoutes: StopOfRoute[]
  stops: Pick<Stop, 'StopUID' | 'StopID' | 'position'>[]
  shapes: RouteShape[]
}): RouteDetail {
  const stopOfRoutesById = indexBySubRouteId(
    stopOfRoutes.filter(
      (stopOfRoute) => stopOfRoute.RouteUID === route.RouteUID,
    ),
  )
  const shapesById = indexBySubRouteId(shapes)
  const positionsByStopId = new Map<string, LngLat>()

  for (const stop of stops) {
    if (!stop.position) continue

    positionsByStopId.set(stop.StopUID, stop.position)
    positionsByStopId.set(stop.StopID, stop.position)
  }

  return {
    routeUID: route.RouteUID,
    city: route.City,
    name: route.RouteName,
    departure: route.DepartureStopName,
    destination: route.DestinationStopName,
    subRoutes: route.SubRoutes.map((subRoute): RouteDetailSubRoute => {
      const id = getSubRouteId(subRoute.SubRouteUID, subRoute.Direction)

      return {
        id,
        subRouteUID: subRoute.SubRouteUID,
        direction: subRoute.Direction,
        name: subRoute.SubRouteName,
        departure: subRoute.DepartureStopName,
        destination: subRoute.DestinationStopName,
        stops: (stopOfRoutesById.get(id)?.Stops ?? []).map((stop) => ({
          stopUID: stop.StopUID,
          stopID: stop.StopID,
          stationID: stop.StationID ?? null,
          name: stop.StopName,
          sequence: stop.StopSequence,
          position:
            positionsByStopId.get(stop.StopUID) ??
            positionsByStopId.get(stop.StopID) ??
            null,
        })),
        path: shapesById.get(id)?.path ?? [],
      }
    }),
  }
}

export function toRouteDetailFromApi(route: ApiRouteDetail): RouteDetail {
  return {
    routeUID: route.uuid,
    city: route.city,
    name: toLocalizedText(route.name),
    departure: toLocalizedText(route.departure),
    destination: toLocalizedText(route.destination),
    subRoutes: route.sub_routes.map((subRoute) => ({
      id: getSubRouteId(subRoute.tdx.sub_route_uid, subRoute.direction),
      subRouteUID: subRoute.tdx.sub_route_uid,
      direction: subRoute.direction,
      name: toLocalizedText(subRoute.name),
      departure: toLocalizedText(subRoute.departure),
      destination: toLocalizedText(subRoute.destination),
      stops: subRoute.stops.map((stop) => ({
        stopUID: stop.uuid,
        stopID: stop.tdx.stop_id,
        stationID: stop.tdx.station_id,
        name: toLocalizedText(stop.name),
        sequence: stop.sequence,
        position: [stop.position.longitude, stop.position.latitude],
      })),
      path: subRoute.shape.path,
    })),
  }
}
