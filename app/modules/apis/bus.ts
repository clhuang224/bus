import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BusRoute, TdxBusRoute } from '../interfaces/BusRoute'
import type { AreaType } from '../enums/AreaType'
import type { CityNameType } from '../enums/CityNameType'
import type { EstimatedArrival, TdxEstimatedArrival } from '../interfaces/EstimatedArrival'
import type { RealtimeByFrequency, TdxRealtimeByFrequency } from '../interfaces/RealtimeByFrequency'
import type { RealtimeNearStop, TdxRealtimeNearStop } from '../interfaces/RealtimeNearStop'
import type { RouteShape, TdxRouteShape } from '../interfaces/RouteShape'
import type { StopOfRoute, TdxStopOfRoute } from '../interfaces/StopOfRoute'
import type { Stop, TdxStop } from '../interfaces/Stop'
import { getBusErrorModal } from './errors/busError'
import { openGlobalModal } from '../slices/globalModalSlice'
import { areaMapCity } from '../consts/area'
import type { LatLng } from '../types/CoordsType'
import { buildNearbyStopOfRouteQuery, buildNearbyStopQuery } from '../utils/geo/buildNearbyStopQuery'
import {
  transformBusRoute,
  transformEstimatedArrival,
  transformRealtimeByFrequency,
  transformRealtimeNearStop,
  transformRouteShape,
  transformStops,
  transformStopOfRoute
} from '../utils/route/transformTdxBusData'

if (!import.meta.env.VITE_PROXY_API_BASE_URL) {
  throw new Error('VITE_PROXY_API_BASE_URL is required. Follow the proxy setup in README.md.')
}

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_PROXY_API_BASE_URL
})

const DEFAULT_RETENTION_SECONDS = 60 * 5
const AREA_ROUTES_RETENTION_SECONDS = 60 * 15

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
    getEstimatedArrivalByRoute: build.query<EstimatedArrival[], { city: CityNameType, routeUID: string }>({
      query: ({ city, routeUID }) => `/EstimatedTimeOfArrival/City/${city}?%24filter=RouteUID%20eq%20'${routeUID}'&%24format=JSON`,
      transformResponse: (res: TdxEstimatedArrival[], _meta, { city }) =>
        res.map((estimatedArrival) => transformEstimatedArrival(estimatedArrival, city))
    }),
    getRoutesByCity: build.query<BusRoute<string>[], CityNameType>({
      query: (city) => `/Route/City/${city}?%24format=JSON`,
      transformResponse: (res: TdxBusRoute<string>[]) => res.map(transformBusRoute)
    }),
    getStopOfRoutesByCity: build.query<StopOfRoute[], { city: CityNameType, routeUID?: string }>({
      query: ({ city, routeUID }) => routeUID
        ? `/StopOfRoute/City/${city}?%24filter=RouteUID%20eq%20'${routeUID}'&%24format=JSON`
        : `/StopOfRoute/City/${city}?%24format=JSON`,
      transformResponse: (res: TdxStopOfRoute[], _meta, { city }) =>
        res.map((stopOfRoute) => transformStopOfRoute(stopOfRoute, city))
    }),
    getStopOfRoutesByArea: build.query<StopOfRoute[], { area: AreaType, stopUIDs?: string[] }>({
      queryFn: async ({ area, stopUIDs = [] }, _api, _extraOptions, baseQuery) => {
        const cityResults = await Promise.all(
          areaMapCity[area].map(async (city) => ({
            city,
            result: await baseQuery(buildNearbyStopOfRouteQuery(city, stopUIDs))
          }))
        )

        const errorResult = cityResults.find(({ result }) => result.error != null)
        if (errorResult?.result.error != null) {
          return { error: errorResult.result.error }
        }

        return {
          data: cityResults.flatMap(({ city, result }) =>
            (result.data as TdxStopOfRoute[]).map((stopOfRoute) => transformStopOfRoute(stopOfRoute, city))
          )
        }
      }
    }),
    getRoutesByArea: build.query<BusRoute<string>[], AreaType>({
      keepUnusedDataFor: AREA_ROUTES_RETENTION_SECONDS,
      queryFn: async (area, _api, _extraOptions, baseQuery) => {
        const cityResults = await Promise.all(
          areaMapCity[area].map(async (city) => ({
            city,
            result: await baseQuery(`/Route/City/${city}?%24format=JSON`)
          }))
        )

        const errorResult = cityResults.find(({ result }) => result.error != null)
        if (errorResult?.result.error != null) {
          return { error: errorResult.result.error }
        }

        return {
          data: cityResults.flatMap(({ result }) =>
            (result.data as TdxBusRoute<string>[]).map(transformBusRoute)
          )
        }
      }
    }),
    getStopsByCity: build.query<Stop[], CityNameType>({
      query: (cityName) => `/Stop/City/${cityName}?%24format=JSON`,
      transformResponse: (res: TdxStop[]) => transformStops(res)
    }),
    getStopsByArea: build.query<Stop[], AreaType>({
      queryFn: async (area, _api, _extraOptions, baseQuery) => {
        const cityResults = await Promise.all(
          areaMapCity[area].map(async (city) => ({
            city,
            result: await baseQuery(`/Stop/City/${city}?%24format=JSON`)
          }))
        )

        const errorResult = cityResults.find(({ result }) => result.error != null)
        if (errorResult?.result.error != null) {
          return { error: errorResult.result.error }
        }

        return {
          data: cityResults.flatMap(({ result }) => transformStops(result.data as TdxStop[]))
        }
      }
    }),
    getStopsByNearbyArea: build.query<Stop[], { area: AreaType, coords: LatLng }>({
      queryFn: async ({ area, coords }, _api, _extraOptions, baseQuery) => {
        const cityResults = await Promise.all(
          areaMapCity[area].map(async (city) => ({
            result: await baseQuery(buildNearbyStopQuery(city, coords))
          }))
        )

        const errorResult = cityResults.find(({ result }) => result.error != null)
        if (errorResult?.result.error != null) {
          return { error: errorResult.result.error }
        }

        return {
          data: cityResults.flatMap(({ result }) => transformStops(result.data as TdxStop[]))
        }
      }
    }),
    getRealtimeNearStopsByRoute: build.query<RealtimeNearStop[], { city: CityNameType, routeUID: string }>({
      query: ({ city, routeUID }) => `/RealTimeNearStop/City/${city}?%24filter=RouteUID%20eq%20'${routeUID}'&%24format=JSON`,
      transformResponse: (res: TdxRealtimeNearStop[], _meta, { city }) =>
        res.map((realtimeNearStop) => transformRealtimeNearStop(realtimeNearStop, city))
    }),
    getRealtimeByFrequencyByRoute: build.query<RealtimeByFrequency[], { city: CityNameType, routeUID: string }>({
      query: ({ city, routeUID }) =>
        `/RealTimeByFrequency/City/${city}?%24filter=RouteUID%20eq%20'${routeUID}'&%24format=JSON`,
      transformResponse: (res: TdxRealtimeByFrequency[], _meta, { city }) =>
        res.map((realtimeByFrequency) => transformRealtimeByFrequency(realtimeByFrequency, city))
    }),
    getRouteShapesByRoute: build.query<RouteShape[], { city: CityNameType, routeUID: string }>({
      query: ({ city, routeUID }) => `/Shape/City/${city}?%24filter=RouteUID%20eq%20'${routeUID}'&%24format=JSON`,
      transformResponse: (res: TdxRouteShape[], _meta, { city }) =>
        res.map((routeShape) => transformRouteShape(routeShape, city))
    })
  })
})

export const {
  useGetEstimatedArrivalByRouteQuery,
  useGetRealtimeByFrequencyByRouteQuery,
  useGetRealtimeNearStopsByRouteQuery,
  useGetRouteShapesByRouteQuery,
  useGetRoutesByCityQuery,
  useGetStopOfRoutesByCityQuery,
  useGetStopsByCityQuery,
  useGetRoutesByAreaQuery,
  useGetStopOfRoutesByAreaQuery,
  useGetStopsByAreaQuery,
  useGetStopsByNearbyAreaQuery
} = busApi
