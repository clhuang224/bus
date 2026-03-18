import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BusRoute, TdxBusRoute } from '../interfaces/BusRoute'
import type { AreaType } from '../enums/AreaType'
import type { CityNameType } from '../enums/CityNameType'
import type { StopOfRoute, TdxStopOfRoute } from '../interfaces/StopOfRoute'
import type { Stop, TdxStop } from '../interfaces/Stop'
import { getBusErrorModal, tdxSystemErrorModal } from './errors/busError'
import { openGlobalModal } from '../slices/globalModalSlice'
import { areaMapCity } from '../consts/area'

const TDX_BASE_URL = 'https://tdx.transportdata.tw/api/basic/v2/Bus'
const apiBaseUrl = import.meta.env.VITE_PROXY_API_BASE_URL || TDX_BASE_URL

const tdxBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  prepareHeaders: (headers) => {
    if (!import.meta.env.VITE_PROXY_API_BASE_URL && import.meta.env.VITE_TDX_TOKEN) {
      headers.set('authorization', `Bearer ${import.meta.env.VITE_TDX_TOKEN}`)
    }
    return headers
  }
})

export const busApi = createApi({
  reducerPath: 'busApi',
  baseQuery: async (args, api, extraOptions) => {
    try {
      const result = await tdxBaseQuery(args, api, extraOptions)
      const errorModal = result.error ? getBusErrorModal(result.error) : null

      if (errorModal) {
        api.dispatch(openGlobalModal(errorModal))
      }

      return result
    } catch (error) {
      console.error('busApi baseQuery error:', error)
      api.dispatch(openGlobalModal(tdxSystemErrorModal))
      throw error
    }
  },
  keepUnusedDataFor: 60 * 5,
  endpoints: (build) => ({
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
    })
  })
})

export const {
  useGetRoutesByCityQuery,
  useGetStopOfRoutesByCityQuery,
  useGetStopsByCityQuery,
  useGetRoutesByAreaQuery,
  useGetStopOfRoutesByAreaQuery,
  useGetStopsByAreaQuery
} = busApi
