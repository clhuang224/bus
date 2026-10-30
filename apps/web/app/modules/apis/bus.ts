import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BusRoute, TdxBusRoute } from '../interfaces/BusRoute'
import {
  isTdxEstimatedArrival,
  isTdxRealtimeByFrequency,
  isTdxRealtimeNearStop,
  normalizeTdxRealtimeNearStop,
  type AreaType,
  type CityNameType,
  type TdxEstimatedArrival,
  type TdxRealtimeByFrequency,
  type TdxRealtimeNearStop,
} from '@bus/shared'
import type { RouteShape, TdxRouteShape } from '../interfaces/RouteShape'
import type { StopOfRoute, TdxStopOfRoute } from '../interfaces/StopOfRoute'
import type { Stop, TdxStop } from '../interfaces/Stop'
import { getBusErrorModal } from './errors/busError'
import { openGlobalModal } from '../slices/globalModalSlice'
import { areaMapCity } from '../consts/area'
import type { LatLng } from '../types/CoordsType'
import {
  buildNearbyStopOfRouteQuery,
  buildNearbyStopQuery,
} from '../utils/api/tdxQuery'
import { queryArrayWithSplitFallback } from '../utils/api/queryWithSplitFallback'
import { keepTdxRecords } from '../utils/api/keepTdxRecords'
import {
  transformBusRoute,
  transformRouteShape,
  transformStops,
  transformStopOfRoute,
} from '../utils/route/transformTdxBusData'

const busApiBaseUrl = import.meta.env.VITE_PROXY_API_BASE_URL || '/api/tdx'

if (import.meta.env.PROD && !import.meta.env.VITE_PROXY_API_BASE_URL) {
  throw new Error(
    'VITE_PROXY_API_BASE_URL is required. Follow the proxy setup in README.md.',
  )
}

const baseQuery = fetchBaseQuery({
  baseUrl: busApiBaseUrl,
})

interface RouteRealtimeQuery {
  city: CityNameType
  routeUID: string
}

const DEFAULT_RETENTION_SECONDS = 60 * 5
export const AREA_ROUTES_RETENTION_SECONDS = 60 * 15

export const busApi = createApi({
  reducerPath: 'busApi',
  baseQuery: async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions)
    const errorModal = result.error ? getBusErrorModal(result.error) : null

    if (errorModal) {
      api.dispatch(openGlobalModal(errorModal))
    }

    return result
  },
  keepUnusedDataFor: DEFAULT_RETENTION_SECONDS,
  endpoints: (build) => ({
    getEstimatedArrivalByRoute: build.query<
      TdxEstimatedArrival[],
      RouteRealtimeQuery
    >({
      query: ({ city, routeUID }) =>
        `/EstimatedTimeOfArrival/City/${city}?%24filter=RouteUID%20eq%20'${routeUID}'&%24format=JSON`,
      transformResponse: (res: unknown) =>
        keepTdxRecords(res, isTdxEstimatedArrival),
    }),
    getRoutesByCity: build.query<BusRoute<string>[], CityNameType>({
      query: (city) => `/Route/City/${city}?%24format=JSON`,
      transformResponse: (res: TdxBusRoute<string>[], _meta, city) =>
        res.map((route) => transformBusRoute(route, city)),
    }),
    getStopOfRoutesByCity: build.query<
      StopOfRoute[],
      { city: CityNameType; routeUID?: string }
    >({
      query: ({ city, routeUID }) =>
        routeUID
          ? `/StopOfRoute/City/${city}?%24filter=RouteUID%20eq%20'${routeUID}'&%24format=JSON`
          : `/StopOfRoute/City/${city}?%24format=JSON`,
      transformResponse: (res: TdxStopOfRoute[], _meta, { city }) =>
        res.map((stopOfRoute) => transformStopOfRoute(stopOfRoute, city)),
    }),
    getStopOfRoutesByArea: build.query<
      StopOfRoute[],
      { area: AreaType; stopUIDs?: string[] }
    >({
      queryFn: async (
        { area, stopUIDs = [] },
        _api,
        _extraOptions,
        baseQuery,
      ) => {
        const cityResults = await Promise.all(
          areaMapCity[area].map(async (city) => ({
            city,
            result: await queryArrayWithSplitFallback({
              items: stopUIDs,
              queryBatch: async (stopUIDBatch) => {
                const batchResult = await baseQuery(
                  buildNearbyStopOfRouteQuery(city, stopUIDBatch),
                )

                return {
                  data: (batchResult.data as TdxStopOfRoute[]) ?? [],
                  error: batchResult.error,
                }
              },
            }),
          })),
        )

        const errorResult = cityResults.find(
          ({ result }) => result.error != null,
        )
        if (errorResult?.result.error != null) {
          return { error: errorResult.result.error }
        }

        const transformedStopOfRoutes = cityResults.flatMap(
          ({ city, result }) =>
            (result.data as TdxStopOfRoute[]).map((stopOfRoute) =>
              transformStopOfRoute(stopOfRoute, city),
            ),
        )

        const seenStopOfRouteKeys = new Set<string>()
        const dedupedStopOfRoutes = transformedStopOfRoutes.filter(
          (stopOfRoute) => {
            const key = `${stopOfRoute.City}:${stopOfRoute.SubRouteUID}:${stopOfRoute.Direction}`
            if (seenStopOfRouteKeys.has(key)) {
              return false
            }

            seenStopOfRouteKeys.add(key)
            return true
          },
        )

        return { data: dedupedStopOfRoutes }
      },
    }),
    getRoutesByArea: build.query<BusRoute<string>[], AreaType>({
      keepUnusedDataFor: AREA_ROUTES_RETENTION_SECONDS,
      queryFn: async (area, _api, _extraOptions, baseQuery) => {
        const cityResults = await Promise.all(
          areaMapCity[area].map(async (city) => ({
            city,
            result: await baseQuery(`/Route/City/${city}?%24format=JSON`),
          })),
        )

        const errorResult = cityResults.find(
          ({ result }) => result.error != null,
        )
        if (errorResult?.result.error != null) {
          return { error: errorResult.result.error }
        }

        return {
          data: cityResults.flatMap(({ city, result }) =>
            (result.data as TdxBusRoute<string>[]).map((route) =>
              transformBusRoute(route, city),
            ),
          ),
        }
      },
    }),
    getStopsByNearbyArea: build.query<
      Stop[],
      { area: AreaType; coords: LatLng }
    >({
      queryFn: async ({ area, coords }, _api, _extraOptions, baseQuery) => {
        const cityResults = await Promise.all(
          areaMapCity[area].map(async (city) => ({
            result: await baseQuery(buildNearbyStopQuery(city, coords)),
          })),
        )

        const errorResult = cityResults.find(
          ({ result }) => result.error != null,
        )
        if (errorResult?.result.error != null) {
          return { error: errorResult.result.error }
        }

        return {
          data: cityResults.flatMap(({ result }) =>
            transformStops(result.data as TdxStop[]),
          ),
        }
      },
    }),
    getRealtimeNearStopsByRoute: build.query<
      TdxRealtimeNearStop[],
      RouteRealtimeQuery
    >({
      query: ({ city, routeUID }) =>
        `/RealTimeNearStop/City/${city}?%24filter=RouteUID%20eq%20'${routeUID}'&%24format=JSON`,
      transformResponse: (res: unknown) =>
        keepTdxRecords(res, isTdxRealtimeNearStop).map(
          normalizeTdxRealtimeNearStop,
        ),
    }),
    getRealtimeByFrequencyByRoute: build.query<
      TdxRealtimeByFrequency[],
      RouteRealtimeQuery
    >({
      query: ({ city, routeUID }) =>
        `/RealTimeByFrequency/City/${city}?%24filter=RouteUID%20eq%20'${routeUID}'&%24format=JSON`,
      transformResponse: (res: unknown) =>
        keepTdxRecords(res, isTdxRealtimeByFrequency),
    }),
    getRouteShapesByRoute: build.query<
      RouteShape[],
      { city: CityNameType; routeUID: string }
    >({
      query: ({ city, routeUID }) =>
        `/Shape/City/${city}?%24filter=RouteUID%20eq%20'${routeUID}'&%24format=JSON`,
      transformResponse: (res: TdxRouteShape[], _meta, { city }) =>
        res.map((routeShape) => transformRouteShape(routeShape, city)),
    }),
  }),
})
