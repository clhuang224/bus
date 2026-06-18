import type { CityNameType, TdxBusRoute } from '@bus/shared'

export interface RouteSyncRecord {
  city: CityNameType
  tdx_route: TdxBusRoute
}

// TODO(sync): Replace this placeholder with a Prisma-friendly mapper.
// It should flatten TDX route fields into route, subroute, operator,
// route_operator, and route_shape sync records. API response mapping should
// live separately from this database sync mapper.
export function routeMapper({
  city,
  tdxRoutes,
}: {
  city: CityNameType
  tdxRoutes: TdxBusRoute[]
}): RouteSyncRecord[] {
  return tdxRoutes.map((tdxRoute) => ({
    city,
    tdx_route: tdxRoute,
  }))
}
