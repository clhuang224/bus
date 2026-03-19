import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BusRoute, TdxBusRoute } from '../interfaces/BusRoute'
import type { AreaType } from '../enums/AreaType'
import type { CityNameType } from '../enums/CityNameType'
import type { EstimatedArrival, TdxEstimatedArrival } from '../interfaces/EstimatedArrival'
import type { RealtimeNearStop, TdxRealtimeNearStop } from '../interfaces/RealtimeNearStop'
import type { StopOfRoute, TdxStopOfRoute } from '../interfaces/StopOfRoute'
import type { Stop, TdxStop } from '../interfaces/Stop'
import { getBusErrorModal } from './errors/busError'
import { openGlobalModal } from '../slices/globalModalSlice'
import { areaMapCity } from '../consts/area'

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
      transformResponse: (res: TdxEstimatedArrival[], _meta, { city }) => res.map((estimatedArrival) => ({
        ...estimatedArrival,
        City: city,
        RouteName: {
          zh_TW: estimatedArrival.RouteName.Zh_tw,
          en: estimatedArrival.RouteName.En
        },
        StopName: {
          zh_TW: estimatedArrival.StopName.Zh_tw,
          en: estimatedArrival.StopName.En
        },
        SubRouteName: {
          zh_TW: estimatedArrival.SubRouteName.Zh_tw,
          en: estimatedArrival.SubRouteName.En
        }
      }))
    }),
    getRoutesByCity: build.query<BusRoute<string>[], CityNameType>({
      query: (city) => `/Route/City/${city}?%24format=JSON`,
      transformResponse: (res: TdxBusRoute<string>[]) => res.map((busRoute) => ({
        ...busRoute,
        Operators: busRoute.Operators.map((operator) => ({
          ...operator,
          OperatorName: {
            zh_TW: operator.OperatorName.Zh_tw,
            en: operator.OperatorName.En
          }
        })),
        RouteName: {
          zh_TW: busRoute.RouteName.Zh_tw,
          en: busRoute.RouteName.En
        },
        DepartureStopName: {
          zh_TW: busRoute.DepartureStopNameZh,
          en: busRoute.DepartureStopNameEn
        },
        DestinationStopName: {
          zh_TW: busRoute.DestinationStopNameZh,
          en: busRoute.DestinationStopNameEn
        },
        TicketPriceDescription: {
          zh_TW: busRoute.TicketPriceDescriptionZh,
          en: busRoute.TicketPriceDescriptionEn
        },
        FareBufferZoneDescription: {
          zh_TW: busRoute.FareBufferZoneDescriptionZh,
          en: busRoute.FareBufferZoneDescriptionEn
        },
        SubRoutes: (busRoute.SubRoutes ?? []).map((busSubRoute) => ({
          ...busSubRoute,
          DepartureStopName: {
            zh_TW: busSubRoute.DepartureStopNameZh,
            en: busSubRoute.DepartureStopNameEn
          },
          DestinationStopName: {
            zh_TW: busSubRoute.DestinationStopNameZh,
            en: busSubRoute.DestinationStopNameEn
          },
          SubRouteName: {
            zh_TW: busSubRoute.SubRouteName.Zh_tw,
            en: busSubRoute.SubRouteName.En
          }
        }))
      }))
    }),
    getStopOfRoutesByCity: build.query<StopOfRoute[], CityNameType>({
      query: (cityName) => `/StopOfRoute/City/${cityName}?%24format=JSON`,
      transformResponse: (res: TdxStopOfRoute[], _meta, cityName) => res.map((stopOfRoute) => ({
        ...stopOfRoute,
        City: cityName,
        RouteName: {
          zh_TW: stopOfRoute.RouteName.Zh_tw,
          en: stopOfRoute.RouteName.En
        },
        SubRouteName: {
          zh_TW: stopOfRoute.SubRouteName.Zh_tw,
          en: stopOfRoute.SubRouteName.En
        },
        Stops: stopOfRoute.Stops.map((stop) => ({
          ...stop,
          StopName: {
            zh_TW: stop.StopName.Zh_tw,
            en: stop.StopName.En
          }
        }))
      }))
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
            (result.data as TdxStopOfRoute[]).map((stopOfRoute) => ({
              ...stopOfRoute,
              City: city,
              RouteName: {
                zh_TW: stopOfRoute.RouteName.Zh_tw,
                en: stopOfRoute.RouteName.En
              },
              SubRouteName: {
                zh_TW: stopOfRoute.SubRouteName.Zh_tw,
                en: stopOfRoute.SubRouteName.En
              },
              Stops: stopOfRoute.Stops.map((stop) => ({
                ...stop,
                StopName: {
                  zh_TW: stop.StopName.Zh_tw,
                  en: stop.StopName.En
                }
              }))
            }))
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
            (result.data as TdxBusRoute<string>[]).map((busRoute) => ({
              ...busRoute,
              Operators: busRoute.Operators.map((operator) => ({
                ...operator,
                OperatorName: {
                  zh_TW: operator.OperatorName.Zh_tw,
                  en: operator.OperatorName.En
                }
              })),
              RouteName: {
                zh_TW: busRoute.RouteName.Zh_tw,
                en: busRoute.RouteName.En
              },
              DepartureStopName: {
                zh_TW: busRoute.DepartureStopNameZh,
                en: busRoute.DepartureStopNameEn
              },
              DestinationStopName: {
                zh_TW: busRoute.DestinationStopNameZh,
                en: busRoute.DestinationStopNameEn
              },
              TicketPriceDescription: {
                zh_TW: busRoute.TicketPriceDescriptionZh,
                en: busRoute.TicketPriceDescriptionEn
              },
              FareBufferZoneDescription: {
                zh_TW: busRoute.FareBufferZoneDescriptionZh,
                en: busRoute.FareBufferZoneDescriptionEn
              },
              SubRoutes: (busRoute.SubRoutes ?? []).map((busSubRoute) => ({
                ...busSubRoute,
                DepartureStopName: {
                  zh_TW: busSubRoute.DepartureStopNameZh,
                  en: busSubRoute.DepartureStopNameEn
                },
                DestinationStopName: {
                  zh_TW: busSubRoute.DestinationStopNameZh,
                  en: busSubRoute.DestinationStopNameEn
                },
                SubRouteName: {
                  zh_TW: busSubRoute.SubRouteName.Zh_tw,
                  en: busSubRoute.SubRouteName.En
                }
              }))
            }))
          )
        }
      }
    }),
    getStopsByCity: build.query<Stop[], CityNameType>({
      query: (cityName) => `/Stop/City/${cityName}?%24format=JSON`,
      transformResponse: (res: TdxStop[]) => res.map((stop) => ({
        ...stop,
        StopName: {
          zh_TW: stop.StopName.Zh_tw,
          en: stop.StopName.En
        },
        GeoHash: stop.StopPosition.GeoHash,
        City: stop.City || null,
        position: [stop.StopPosition.PositionLon, stop.StopPosition.PositionLat] as Stop['position']
      }))
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
            (result.data as TdxStop[]).map((stop) => ({
              ...stop,
              StopName: {
                zh_TW: stop.StopName.Zh_tw,
                en: stop.StopName.En
              },
              GeoHash: stop.StopPosition.GeoHash,
              City: stop.City || null,
              position: [stop.StopPosition.PositionLon, stop.StopPosition.PositionLat] as Stop['position']
            }))
          )
        }
      }
    }),
    getRealtimeNearStopsByRoute: build.query<RealtimeNearStop[], { city: CityNameType, routeUID: string }>({
      query: ({ city, routeUID }) => `/RealTimeNearStop/City/${city}?%24filter=RouteUID%20eq%20'${routeUID}'&%24format=JSON`,
      transformResponse: (res: TdxRealtimeNearStop[], _meta, { city }) => res.map((realtimeNearStop) => ({
        ...realtimeNearStop,
        City: city,
        RouteName: {
          zh_TW: realtimeNearStop.RouteName.Zh_tw,
          en: realtimeNearStop.RouteName.En
        },
        StopName: {
          zh_TW: realtimeNearStop.StopName.Zh_tw,
          en: realtimeNearStop.StopName.En
        },
        SubRouteName: {
          zh_TW: realtimeNearStop.SubRouteName.Zh_tw,
          en: realtimeNearStop.SubRouteName.En
        },
        position: [realtimeNearStop.BusPosition.PositionLon, realtimeNearStop.BusPosition.PositionLat] as RealtimeNearStop['position']
      }))
    })
  })
})

export const {
  useGetEstimatedArrivalByRouteQuery,
  useGetRealtimeNearStopsByRouteQuery,
  useGetRoutesByCityQuery,
  useGetStopOfRoutesByCityQuery,
  useGetStopsByCityQuery,
  useGetRoutesByAreaQuery,
  useGetStopOfRoutesByAreaQuery,
  useGetStopsByAreaQuery
} = busApi
