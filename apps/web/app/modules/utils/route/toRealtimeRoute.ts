import type { RealtimeRoute } from '@bus/shared'
import type { RouteDetail } from '../../interfaces/RouteDetail'

/** The route structure that realtime calculation matches TDX feeds against. */
export function toRealtimeRoute(route: RouteDetail): RealtimeRoute {
  return {
    uuid: route.routeUID,
    subRoutes: route.subRoutes.map((subRoute) => ({
      uuid: subRoute.id,
      tdxSubRouteUid: subRoute.subRouteUID,
      direction: subRoute.direction,
      stops: subRoute.stops.map((stop) => ({
        uuid: stop.stopUID,
        tdxStopId: stop.stopID,
        sequence: stop.sequence,
      })),
    })),
  }
}
