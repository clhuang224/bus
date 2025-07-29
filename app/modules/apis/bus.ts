import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BusRoute, TdxBusRoute } from '../interfaces/BusRoute'
import type { CityNameType } from '../enums/CityNameType'
import type { NearStop, TdxNearStop } from '../interfaces/NearStop'

export const busApi = createApi({
  reducerPath: 'busApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://tdx.transportdata.tw/api/basic/v2/Bus'}),
  endpoints: (build) => ({
    getRoutesByCity: build.query<BusRoute[], CityNameType>({
      query: (city) => `/Route/City/${city}?%24format=JSON`,
      transformResponse: (res: TdxBusRoute[]) => res.map((busRoute) => ({
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
        UpdateTime: new Date(busRoute.UpdateTime),
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
          },
          FirstBusTime: new Date(busSubRoute.FirstBusTime),
          LastBusTime: new Date(busSubRoute.LastBusTime),
          HolidayFirstBusTime: new Date(busSubRoute.HolidayFirstBusTime),
          HolidayLastBusTime: new Date(busSubRoute.HolidayLastBusTime)
        }))
      }))
    }),
    getNearStopsByCity: build.query<NearStop[], CityNameType>({
      query: (cityName) => `/RealTimeNearStop/City/${cityName}?&%24format=JSON`,
      transformResponse: (res: TdxNearStop[]) => res.map((stop) => ({
        ...stop,
        RouteName: {
          zh_TW: stop.RouteName.Zh_tw,
          en: stop.RouteName.En
        },
        SubRouteName: {
          zh_TW: stop.SubRouteName.Zh_tw,
          en: stop.SubRouteName.En
        },
        StopName: {
          zh_TW: stop.StopName.Zh_tw,
          en: stop.StopName.En
        },
        GPSTime: new Date(stop.GPSTime),
        TripStartTime: new Date(stop.TripStartTime),
        TransTime: new Date(stop.TransTime),
        SrcRecTime: new Date(stop.SrcRecTime),
        SrcTransTime: new Date(stop.SrcTransTime),
        SrcUpdateTime: new Date(stop.SrcUpdateTime),
        UpdateTime: new Date(stop.UpdateTime)
      }))
    })
  })
})

export const {
  useGetRoutesByCityQuery
} = busApi
