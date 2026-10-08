import type { SerializedError } from '@reduxjs/toolkit'
import {
  createApi,
  fakeBaseQuery,
  type BaseQueryApi,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import type { AreaType } from '@bus/shared'
import { NEARBY_DISTANCE_KM } from '../consts/nearby'
import type {
  NearbyStationRoutesMap,
  NearbyStationsResult,
} from '../interfaces/Nearby'
import type { RouteSummary } from '../interfaces/RouteSummary'
import type { LatLng } from '../types/CoordsType'
import {
  filterTdxStopsWithinDistance,
  toNearbyStationRoutesFromTdx,
  toNearbyStationsFromApi,
  toNearbyStationsFromTdx,
} from '../utils/nearby/toNearbyStations'
import {
  toRouteSummaryFromApi,
  toRouteSummaryFromTdx,
} from '../utils/routes/toRouteSummary'
import { AREA_ROUTES_RETENTION_SECONDS, busApi } from './bus'
import { databaseApi, isDatabaseApiEnabled } from './database'

export type TransitQueryError = FetchBaseQueryError | SerializedError

export interface NearbyStationsQuery {
  area: AreaType
  coords: LatLng
}

export interface NearbyStationRoutesQuery extends NearbyStationsQuery {
  /** Also load departure and destination names, which costs another request. */
  includeTerminals: boolean
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
