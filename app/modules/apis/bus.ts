import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BusRoute, TdxBusRoute } from '../interfaces/BusRoute'
import type { AreaType } from '../enums/AreaType'
import type { CityNameType } from '../enums/CityNameType'
import type { EstimatedArrival, TdxEstimatedArrival } from '../interfaces/EstimatedArrival'
import type { RealtimeNearStop, TdxRealtimeNearStop } from '../interfaces/RealtimeNearStop'
import type { RouteShape, TdxRouteShape } from '../interfaces/RouteShape'
import type { StopOfRoute, TdxStopOfRoute } from '../interfaces/StopOfRoute'
import type { Stop, TdxStop } from '../interfaces/Stop'
import { getBusErrorModal } from './errors/busError'
import { openGlobalModal } from '../slices/globalModalSlice'
import { areaMapCity } from '../consts/area'
import {
  transformBusRoute,
  transformEstimatedArrival,
  transformRealtimeNearStop,
  transformRouteShape,
  transformStop,
  transformStopOfRoute
} from '../utils/transformTdxBusData'

if (!import.meta.env.VITE_PROXY_API_BASE_URL) {
  throw new Error('VITE_PROXY_API_BASE_URL is required. Follow the proxy setup in README.md.')
}

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_PROXY_API_BASE_URL
})

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
  keepUnusedDataFor: 60 * 5,
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
    getStopOfRoutesByCity: build.query<StopOfRoute[], CityNameType>({
      query: (cityName) => `/StopOfRoute/City/${cityName}?%24format=JSON`,
      transformResponse: (res: TdxStopOfRoute[], _meta, cityName) =>
        res.map((stopOfRoute) => transformStopOfRoute(stopOfRoute, cityName))
    }),
    getStopOfRoutesByArea: build.query<StopOfRoute[], AreaType>({
      queryFn: async (area, _api, _extraOptions, baseQuery) => {
        const cityResults = await Promise.all(
          areaMapCity[area].map(async (city) => ({
            city,
            result: await baseQuery(`/StopOfRoute/City/${city}?%24format=JSON`)
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
      transformResponse: (res: TdxStop[]) => res.flatMap((stop) => {
        const transformedStop = transformStop(stop)
        return transformedStop ? [transformedStop] : []
      })
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
          data: cityResults.flatMap(({ result }) =>
            (result.data as TdxStop[]).flatMap((stop) => {
              const transformedStop = transformStop(stop)
              return transformedStop ? [transformedStop] : []
            })
          )
        }
      }
    }),
    getRealtimeNearStopsByRoute: build.query<RealtimeNearStop[], { city: CityNameType, routeUID: string }>({
      query: ({ city, routeUID }) => `/RealTimeNearStop/City/${city}?%24filter=RouteUID%20eq%20'${routeUID}'&%24format=JSON`,
      transformResponse: (res: TdxRealtimeNearStop[], _meta, { city }) => res.flatMap((realtimeNearStop) => {
        const transformedRealtimeNearStop = transformRealtimeNearStop(realtimeNearStop, city)
        return transformedRealtimeNearStop ? [transformedRealtimeNearStop] : []
      })
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
  useGetRealtimeNearStopsByRouteQuery,
  useGetRouteShapesByRouteQuery,
  useGetRoutesByCityQuery,
  useGetStopOfRoutesByCityQuery,
  useGetStopsByCityQuery,
  useGetRoutesByAreaQuery,
  useGetStopOfRoutesByAreaQuery,
  useGetStopsByAreaQuery
} = busApi
