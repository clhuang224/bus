import type { SerializedError } from '@reduxjs/toolkit'
import {
  createApi,
  fakeBaseQuery,
  type BaseQueryApi,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { ErrorCode, type AreaType, type CityNameType } from '@bus/shared'
import { NEARBY_DISTANCE_KM } from '../consts/nearby'
import type {
  NearbyStationRoutesMap,
  NearbyStationsResult,
} from '../interfaces/Nearby'
import type { RouteDetail } from '../interfaces/RouteDetail'
import type { RouteSummary } from '../interfaces/RouteSummary'
import type { LatLng } from '../types/CoordsType'
import {
  filterTdxStopsWithinDistance,
  toNearbyStationRoutesFromTdx,
  toNearbyStationsFromApi,
  toNearbyStationsFromTdx,
} from '../utils/nearby/toNearbyStations'
import {
  getTdxRouteStopIds,
  toRouteDetailFromApi,
  toRouteDetailFromTdx,
} from '../utils/route/toRouteDetail'
import {
  toRouteSummaryFromApi,
  toRouteSummaryFromTdx,
} from '../utils/routes/toRouteSummary'
import { AREA_ROUTES_RETENTION_SECONDS, busApi } from './bus'
import { databaseApi, isDatabaseApiEnabled } from './database'
import { isDatabaseApiError } from './errors/databaseError'

export type TransitQueryError = FetchBaseQueryError | SerializedError

export interface NearbyStationsQuery {
  area: AreaType
  coords: LatLng
}

export interface NearbyStationRoutesQuery extends NearbyStationsQuery {
  /** Also load departure and destination names, which costs another request. */
  includeTerminals: boolean
}

export interface RouteDetailQuery {
  city: CityNameType
  routeUID: string
}

type SourceDispatch = BaseQueryApi['dispatch']

// Source endpoints keep their own short-lived cache, so nested requests from
// several transit endpoints share one upstream response.
const SOURCE_REQUEST_OPTIONS = { subscribe: false } as const

async function querySource<T>(load: () => Promise<T>) {
  try {
    return { data: await load() }
  } catch (error) {
    // unwrap() rejects with the source endpoint's own error value.
    return { error: error as TransitQueryError }
  }
}

async function loadDatabaseNearbyStations(
  dispatch: SourceDispatch,
  { coords }: NearbyStationsQuery,
) {
  const stations = await dispatch(
    databaseApi.endpoints.getNearbyStations.initiate(
      {
        latitude: coords[0],
        longitude: coords[1],
        radius_meters: NEARBY_DISTANCE_KM * 1_000,
      },
      SOURCE_REQUEST_OPTIONS,
    ),
  ).unwrap()

  return toNearbyStationsFromApi(stations)
}

async function loadTdxNearbyStops(
  dispatch: SourceDispatch,
  { area, coords }: NearbyStationsQuery,
) {
  const stops = await dispatch(
    busApi.endpoints.getStopsByNearbyArea.initiate(
      { area, coords },
      SOURCE_REQUEST_OPTIONS,
    ),
  ).unwrap()

  return filterTdxStopsWithinDistance(stops, coords, NEARBY_DISTANCE_KM)
}

async function loadTdxNearbyStationRoutes(
  dispatch: SourceDispatch,
  { area, coords, includeTerminals }: NearbyStationRoutesQuery,
) {
  const stops = await loadTdxNearbyStops(dispatch, { area, coords })

  if (stops.length === 0) return {}

  const [stopOfRoutes, routes] = await Promise.all([
    dispatch(
      busApi.endpoints.getStopOfRoutesByArea.initiate(
        { area, stopUIDs: stops.map((stop) => stop.StopUID) },
        SOURCE_REQUEST_OPTIONS,
      ),
    ).unwrap(),
    includeTerminals
      ? dispatch(
          busApi.endpoints.getRoutesByArea.initiate(
            area,
            SOURCE_REQUEST_OPTIONS,
          ),
        ).unwrap()
      : null,
  ])

  return toNearbyStationRoutesFromTdx(stopOfRoutes, routes)
}

async function loadDatabaseRouteDetail(
  dispatch: SourceDispatch,
  { city, routeUID }: RouteDetailQuery,
) {
  try {
    const route = await dispatch(
      databaseApi.endpoints.getRouteDetail.initiate(
        routeUID,
        SOURCE_REQUEST_OPTIONS,
      ),
    ).unwrap()

    // Match TDX mode, which only finds a route within the requested city.
    // Realtime requests use that city, so a mismatch would show no realtime data.
    return route.city === city ? toRouteDetailFromApi(route) : null
  } catch (error) {
    if (isDatabaseApiError(error, ErrorCode.ROUTE_NOT_FOUND)) return null

    throw error
  }
}

async function loadTdxRouteShapes(
  dispatch: SourceDispatch,
  query: RouteDetailQuery,
) {
  try {
    return await dispatch(
      busApi.endpoints.getRouteShapesByRoute.initiate(
        query,
        SOURCE_REQUEST_OPTIONS,
      ),
    ).unwrap()
  } catch {
    // The map falls back to connecting stop positions without a shape.
    return []
  }
}

async function loadTdxRouteStops(
  dispatch: SourceDispatch,
  query: RouteDetailQuery,
) {
  const stopOfRoutes = await dispatch(
    busApi.endpoints.getStopOfRoutesByCity.initiate(
      query,
      SOURCE_REQUEST_OPTIONS,
    ),
  ).unwrap()
  const stopIds = getTdxRouteStopIds(query.routeUID, stopOfRoutes)
  const stops =
    stopIds.length > 0
      ? await dispatch(
          busApi.endpoints.getStopsByCityAndIds.initiate(
            { city: query.city, stopIds },
            SOURCE_REQUEST_OPTIONS,
          ),
        ).unwrap()
      : []

  return { stopOfRoutes, stops }
}

async function loadTdxRouteDetail(
  dispatch: SourceDispatch,
  query: RouteDetailQuery,
) {
  const [routes, { stopOfRoutes, stops }, shapes] = await Promise.all([
    dispatch(
      busApi.endpoints.getRoutesByCity.initiate(
        query.city,
        SOURCE_REQUEST_OPTIONS,
      ),
    ).unwrap(),
    loadTdxRouteStops(dispatch, query),
    loadTdxRouteShapes(dispatch, query),
  ])
  const route = routes.find(({ RouteUID }) => RouteUID === query.routeUID)

  if (!route) return null

  return toRouteDetailFromTdx({ route, stopOfRoutes, stops, shapes })
}

/**
 * App-facing data that may come from either the app database API or TDX.
 * Pages and hooks use these endpoints and never choose the source themselves.
 */
export const transitApi = createApi({
  reducerPath: 'transitApi',
  baseQuery: fakeBaseQuery<TransitQueryError>(),
  endpoints: (build) => ({
    getRouteSummaries: build.query<RouteSummary[], AreaType>({
      keepUnusedDataFor: AREA_ROUTES_RETENTION_SECONDS,
      queryFn: (area, { dispatch }) =>
        querySource(async () => {
          if (isDatabaseApiEnabled()) {
            const routes = await dispatch(
              databaseApi.endpoints.getRoutes.initiate(
                area,
                SOURCE_REQUEST_OPTIONS,
              ),
            ).unwrap()

            return routes.map(toRouteSummaryFromApi)
          }

          const routes = await dispatch(
            busApi.endpoints.getRoutesByArea.initiate(
              area,
              SOURCE_REQUEST_OPTIONS,
            ),
          ).unwrap()

          return routes.map(toRouteSummaryFromTdx)
        }),
    }),
    getNearbyStations: build.query<NearbyStationsResult, NearbyStationsQuery>({
      queryFn: (query, { dispatch }) =>
        querySource(async () => {
          if (isDatabaseApiEnabled()) {
            return loadDatabaseNearbyStations(dispatch, query)
          }

          const stops = await loadTdxNearbyStops(dispatch, query)

          // TDX station routes cost extra requests, so they load on demand.
          return {
            stations: toNearbyStationsFromTdx(stops),
            routesByStationId: null,
          }
        }),
    }),
    /** Returns null when the route does not exist. */
    getRouteDetail: build.query<RouteDetail | null, RouteDetailQuery>({
      queryFn: (query, { dispatch }) =>
        querySource(() =>
          isDatabaseApiEnabled()
            ? loadDatabaseRouteDetail(dispatch, query)
            : loadTdxRouteDetail(dispatch, query),
        ),
    }),
    getNearbyStationRoutes: build.query<
      NearbyStationRoutesMap,
      NearbyStationRoutesQuery
    >({
      queryFn: (query, { dispatch }) =>
        querySource(async () => {
          if (isDatabaseApiEnabled()) {
            const { routesByStationId } = await loadDatabaseNearbyStations(
              dispatch,
              query,
            )

            return routesByStationId
          }

          return loadTdxNearbyStationRoutes(dispatch, query)
        }),
    }),
  }),
})
