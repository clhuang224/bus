import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BusRoute, TdxBusRoute } from '../interfaces/BusRoute'
import type { CityNameType } from '../enums/CityNameType'
import type { StopOfRoute, TdxStopOfRoute } from '../interfaces/StopOfRoute'
import type { Stop, TdxStop } from '../interfaces/Stop'
import { getBusErrorModal, tdxSystemErrorModal } from './errors/busError'
import { openGlobalModal } from '../slices/globalModalSlice'

const tdxBaseQuery = fetchBaseQuery({
  baseUrl: 'https://tdx.transportdata.tw/api/basic/v2/Bus',
  prepareHeaders: (headers) => {
    const token = import.meta.env.VITE_TDX_TOKEN
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  }
})

export const busApi = createApi({
  reducerPath: 'busApi',
  baseQuery: async (args, api, extraOptions) => {
    try {
      const result = await tdxBaseQuery(args, api, extraOptions)
      const errorModal = result.error ? getBusErrorModal(result.error.status) : null

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
        SubRoutes: busRoute.SubRoutes.map((busSubRoute) => ({
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
      transformResponse: (res: TdxStopOfRoute[]) => res.map((stopOfRoute) => ({
        ...stopOfRoute,
        RouteName: {
          zh_TW: stopOfRoute.RouteName.Zh_tw,
          en: stopOfRoute.RouteName.En
        },
        SubRouteName: {
          zh_TW: stopOfRoute.SubRouteName.Zh_tw,
          en: stopOfRoute.SubRouteName.En
        },
        DestinationStopName: {
          zh_TW: stopOfRoute.DestinationStopNameZh,
          en: stopOfRoute.DestinationStopNameEn
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
    getStopsByCity: build.query<Stop[], CityNameType>({
      query: (cityName) => `/Stop/City/${cityName}?%24format=JSON`,
      transformResponse: (res: TdxStop[]) => res.map((stop) => ({
        StopUID: stop.StopUID,
        StopID: stop.StopID,
        AuthorityID: stop.AuthorityID,
        StationID: stop.StationID,
        StationGroupID: stop.StationGroupID,
        StopName: {
          zh_TW: stop.StopName.Zh_tw,
          en: stop.StopName.En
        },
        GeoHash: stop.StopPosition.GeoHash,
        StopAddress: stop.StopAddress,
        Bearing: stop.Bearing,
        StopDescription: stop.StopDescription,
        City: stop.City || null,
        UpdateTime: stop.UpdateTime,
        VersionID: stop.VersionID,
        position: [stop.StopPosition.PositionLon, stop.StopPosition.PositionLat]
      }))
    })
  })
})

export const {
  useGetRoutesByCityQuery,
  useGetStopOfRoutesByCityQuery
} = busApi
