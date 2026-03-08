import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BusRoute, TdxBusRoute } from '../interfaces/BusRoute'
import type { CityNameType } from '../enums/CityNameType'
import type { NearStop, TdxNearStop } from '../interfaces/NearStop'
import type { Stop, TdxStop } from '../interfaces/Stop'

export const busApi = createApi({
  reducerPath: 'busApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://tdx.transportdata.tw/api/basic/v2/Bus',
    prepareHeaders: (headers) => {
      const token = import.meta.env.VITE_TDX_TOKEN
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    }
  }),
  keepUnusedDataFor: 60 * 5,
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
    getStopsByCity: build.query<Stop[], CityNameType>({
      query: (cityName) => `/Stop/City/${cityName}?%24format=JSON`,
      transformResponse: (res: TdxStop[]) => res.map((stop) => ({
        StopUID: stop.StopUID,
        StopID: stop.StopID,
        StopName: {
          zh_TW: stop.StopName.Zh_tw,
          en: stop.StopName.En
        },
        position: [stop.StopPosition.PositionLon, stop.StopPosition.PositionLat]
      }))
    }),
    getNearStopsByCity: build.query<NearStop<string>[], CityNameType>({
      async queryFn(cityName, _queryApi, _extraOptions, baseQuery): Promise<{ data: NearStop<string>[] }> {
        const nearStopsRes = await baseQuery({ url: `/NearStop/City/${cityName}?%24format=JSON` })
        const nearStopsData: TdxNearStop[] = Array.isArray(nearStopsRes.data) ? nearStopsRes.data as TdxNearStop[] : []
        const stopsRequest = _queryApi.dispatch(
          busApi.endpoints.getStopsByCity.initiate(cityName)
        )
        const stopsResult = await stopsRequest
        stopsRequest.unsubscribe()

        const stopMap = new Map<string, [number, number]>()
        const stopsData = stopsResult.data ?? []

        for (const stop of stopsData) {
          if (stop.StopUID && stop.position) {
            stopMap.set(stop.StopUID, stop.position)
          }
        }
        const result: NearStop<string>[] = nearStopsData.map((stop) => ({
          ...stop,
          RouteName: {
            zh_TW: stop.RouteName?.Zh_tw ?? '',
            en: stop.RouteName?.En ?? ''
          },
          SubRouteName: {
            zh_TW: stop.SubRouteName?.Zh_tw ?? '',
            en: stop.SubRouteName?.En ?? ''
          },
          StopName: {
            zh_TW: stop.StopName?.Zh_tw ?? '',
            en: stop.StopName?.En ?? ''
          },
          position: stopMap.get(stop.StopUID) ?? undefined
        }))
        return { data: result }
      }
    })
  })
})

export const {
  useGetRoutesByCityQuery,
  useGetNearStopsByCityQuery
} = busApi
