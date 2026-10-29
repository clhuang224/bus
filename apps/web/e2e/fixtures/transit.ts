import { CityNameType, DirectionType, type TdxBusRoute } from '@bus/shared'
import type { TdxStop } from '~/modules/interfaces/Stop'
import type { TdxStopOfRoute } from '~/modules/interfaces/StopOfRoute'

const CITY = CityNameType.TAIPEI
const USER_POSITION = { lat: 25.0599, lon: 121.5397 }

export const ROUTE_UID = 'TPE-E2E-LONG'
export const MANY_TABS_ROUTE_UID = 'TPE-E2E-TABS'
export const ROUTE_GO_STOP_UID_PREFIX = `${ROUTE_UID}-0-${DirectionType.GO}-`
export const ROUTE_STOP_COUNT = 30
export const NEARBY_STATION_COUNT = 12

export function getNearbyStationName(order: number) {
  return `E2E 附近站 ${order}`
}

function localizedName(name: string) {
  return { Zh_tw: name, En: name }
}

function createRoute(
  routeUID: string,
  subRoutes: Array<{ name: string; direction: DirectionType }>,
): TdxBusRoute {
  return {
    RouteUID: routeUID,
    RouteID: routeUID,
    HasSubRoutes: subRoutes.length > 2,
    Operators: [],
    AuthorityID: '004',
    ProviderID: '000',
    BusRouteType: 11,
    RouteName: localizedName('E2E'),
    DepartureStopNameZh: '起點',
    DestinationStopNameZh: '終點',
    City: CITY,
    UpdateTime: '2026-01-01T00:00:00+08:00',
    VersionID: 1,
    SubRoutes: subRoutes.map(({ name, direction }, index) => ({
      SubRouteUID: `${routeUID}-${Math.floor(index / 2)}`,
      SubRouteID: `${routeUID}-${Math.floor(index / 2)}`,
      OperatorIDs: [],
      SubRouteName: localizedName(name),
      Direction: direction,
    })),
  }
}

function createRouteStops(routeUID: string, direction: DirectionType) {
  return Array.from({ length: ROUTE_STOP_COUNT }, (_, index) => {
    const sequence = index + 1
    const id = `${routeUID}-${direction}-${sequence}`

    return {
      StopUID: id,
      StopID: id,
      StopName: localizedName(`E2E 站 ${sequence}`),
      StopSequence: sequence,
      StationID: id,
      StopPosition: {
        PositionLat: 25.04 + index * 0.0012,
        PositionLon: 121.52 + index * 0.0015,
        GeoHash: null,
      },
    }
  })
}

const longRouteSubRoutes = [
  { name: 'E2E', direction: DirectionType.GO },
  { name: 'E2E', direction: DirectionType.RETURN },
]

const manyTabsSubRoutes = Array.from({ length: 10 }, (_, index) => [
  { name: `E2E 區間車 ${index + 1}`, direction: DirectionType.GO },
  { name: `E2E 區間車 ${index + 1}`, direction: DirectionType.RETURN },
]).flat()

const routes = [
  createRoute(ROUTE_UID, longRouteSubRoutes),
  createRoute(MANY_TABS_ROUTE_UID, manyTabsSubRoutes),
]

function getStopOfRoutes(routeUID: string): TdxStopOfRoute[] {
  const route = routes.find((candidate) => candidate.RouteUID === routeUID)
  if (!route) return []

  return (route.SubRoutes ?? []).map((subRoute) => ({
    RouteUID: route.RouteUID,
    RouteID: route.RouteID,
    RouteName: route.RouteName,
    SubRouteUID: subRoute.SubRouteUID,
    SubRouteID: subRoute.SubRouteID,
    SubRouteName: subRoute.SubRouteName,
    Direction: subRoute.Direction,
    Stops: createRouteStops(subRoute.SubRouteUID, subRoute.Direction),
  }))
}

const nearbyStops: TdxStop[] = Array.from(
  { length: NEARBY_STATION_COUNT },
  (_, index) => {
    const id = `TPE-E2E-NEARBY-${index + 1}`
    const angle = (index / NEARBY_STATION_COUNT) * Math.PI * 2
    const distance = 0.0006 + index * 0.0002

    return {
      StopUID: id,
      StopID: id,
      AuthorityID: '004',
      StationID: id,
      StationGroupID: id,
      StopName: localizedName(getNearbyStationName(index + 1)),
      StopPosition: {
        PositionLat: USER_POSITION.lat + Math.sin(angle) * distance,
        PositionLon: USER_POSITION.lon + Math.cos(angle) * distance,
        GeoHash: null,
      },
      StopAddress: null,
      Bearing: null,
      StopDescription: null,
      City: CITY,
      UpdateTime: '2026-01-01T00:00:00+08:00',
      VersionID: 1,
    }
  },
)

function getFilteredRouteUID(url: URL) {
  return url.searchParams.get('$filter')?.match(/RouteUID eq '([^']+)'/)?.[1]
}

export function respondTdx(path: string, url: URL): unknown {
  if (path === `/Route/City/${CITY}`) return routes

  if (path === `/StopOfRoute/City/${CITY}`) {
    const routeUID = getFilteredRouteUID(url)
    return routeUID ? getStopOfRoutes(routeUID) : []
  }

  if (path === `/Stop/City/${CITY}`) return nearbyStops

  return []
}
