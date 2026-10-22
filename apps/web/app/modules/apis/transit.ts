import type { SerializedError } from '@reduxjs/toolkit'
import {
  createApi,
  fakeBaseQuery,
  type BaseQueryApi,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import {
  calculateRouteRealtime,
  ErrorCode,
  RealtimeSourceFailure,
  type ApiRouteRealtime,
  type AreaType,
  type CityNameType,
  type RealtimeSourceResult,
} from '@bus/shared'
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
import { toRealtimeRoute } from '../utils/route/toRealtimeRoute'
import {
  toRouteSummaryFromApi,
  toRouteSummaryFromTdx,
} from '../utils/routes/toRouteSummary'
import { AREA_ROUTES_RETENTION_SECONDS, busApi } from './bus'
import { databaseApi, isDatabaseApiEnabled } from './database'
import { isTdxRateLimitError } from './errors/busError'
import { isDatabaseApiError } from './errors/databaseError'

export type TransitQueryError = FetchBaseQueryError | SerializedError

export interface NearbyStationsQuery {
  area: AreaType
  coords: LatLng
}

export interface NearbyStationRoutesQuery extends NearbyStationsQuery {
  includeTerminals: boolean
}

export interface RouteDetailQuery {
  city: CityNameType
  routeUID: string
}

type SourceDispatch = BaseQueryApi['dispatch']

const SOURCE_REQUEST_OPTIONS = { subscribe: false } as const
const UNCACHED_SOURCE_REQUEST_OPTIONS = {
  subscribe: false,
  forceRefetch: true,
} as const

async function querySource<T>(load: () => Promise<T>) {
  try {
    return { data: await load() }
  } catch (error) {
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

function loadRealtimeRouteDetail(
  dispatch: SourceDispatch,
  query: RouteDetailQuery,
): Promise<RouteDetail | null> {
  return dispatch(
    transitApi.endpoints.getRouteDetail.initiate(query, SOURCE_REQUEST_OPTIONS),
  ).unwrap()
}

async function loadDatabaseRouteRealtime(
  dispatch: SourceDispatch,
  { routeUID }: RouteDetailQuery,
) {
  try {
    return await dispatch(
      databaseApi.endpoints.getRouteRealtime.initiate(
        routeUID,
        UNCACHED_SOURCE_REQUEST_OPTIONS,
      ),
    ).unwrap()
  } catch (error) {
    if (isDatabaseApiError(error, ErrorCode.ROUTE_NOT_FOUND)) return null

    throw error
  }
}

const TDX_REALTIME_TIMEOUT_MS = 10_000

interface RealtimeSourceRequest<T> {
  abort: () => void
  unwrap: () => Promise<T[]>
}

async function loadTdxRealtimeSource<T>(
  start: () => RealtimeSourceRequest<T>,
): Promise<RealtimeSourceResult<T>> {
  const request = start()
  const timeoutId = setTimeout(() => {
    request.abort()
  }, TDX_REALTIME_TIMEOUT_MS)

  try {
    return { ok: true, data: await request.unwrap() }
  } catch (error) {
    return {
      ok: false,
      failure: isTdxRateLimitError(error as TransitQueryError)
        ? RealtimeSourceFailure.RATE_LIMITED
        : RealtimeSourceFailure.UNAVAILABLE,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

async function loadTdxRouteRealtime(
  dispatch: SourceDispatch,
  query: RouteDetailQuery,
  route: RouteDetail,
): Promise<ApiRouteRealtime> {
  const [estimatedArrivals, nearStops, positions] = await Promise.all([
    loadTdxRealtimeSource(() =>
      dispatch(
        busApi.endpoints.getEstimatedArrivalByRoute.initiate(
          query,
          UNCACHED_SOURCE_REQUEST_OPTIONS,
        ),
      ),
    ),
    loadTdxRealtimeSource(() =>
      dispatch(
        busApi.endpoints.getRealtimeNearStopsByRoute.initiate(
          query,
          UNCACHED_SOURCE_REQUEST_OPTIONS,
        ),
      ),
    ),
    loadTdxRealtimeSource(() =>
      dispatch(
        busApi.endpoints.getRealtimeByFrequencyByRoute.initiate(
          query,
          UNCACHED_SOURCE_REQUEST_OPTIONS,
        ),
      ),
    ),
  ])

  return calculateRouteRealtime(
    toRealtimeRoute(route),
    { estimatedArrivals, nearStops, positions },
    new Date(),
  )
}

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

          return {
            stations: toNearbyStationsFromTdx(stops),
            routesByStationId: null,
          }
        }),
    }),
    getRouteDetail: build.query<RouteDetail | null, RouteDetailQuery>({
      queryFn: (query, { dispatch }) =>
        querySource(() =>
          isDatabaseApiEnabled()
            ? loadDatabaseRouteDetail(dispatch, query)
            : loadTdxRouteDetail(dispatch, query),
        ),
    }),
    getRouteRealtime: build.query<ApiRouteRealtime | null, RouteDetailQuery>({
      queryFn: (query, { dispatch }) =>
        querySource(async () => {
          const route = await loadRealtimeRouteDetail(dispatch, query)

          if (!route) return null

          return isDatabaseApiEnabled()
            ? loadDatabaseRouteRealtime(dispatch, query)
            : loadTdxRouteRealtime(dispatch, query, route)
        }),
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
