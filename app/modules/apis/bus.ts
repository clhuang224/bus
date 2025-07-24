import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BusRoute } from '~/modules/interfaces/BusRoute'
import type { TdxBusRoute } from '~/modules/interfaces/TdxBusRoute'
import type { CityNameType } from '~/modules/types/geolocation'

export const busApi = createApi({
  reducerPath: 'busApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://tdx.transportdata.tw/api/basic/v2/Bus'}),
  endpoints: (build) => ({
    getRoutesByCity: build.query<BusRoute[], CityNameType>({
      query: (city) => `/Route/City/${city}?%24format=JSON`,
      transformResponse: (res: TdxBusRoute[]): BusRoute[] => res.map((busRoute) => ({
        cityName: busRoute.City,
        id: busRoute.RouteUID,
        name: {
          'zh_TW': busRoute.RouteName.Zh_tw,
          'en': busRoute.RouteName.En
        },
        type: busRoute.BusRouteType,
        destination: {
          zh_TW: busRoute.DestinationStopNameZh,
          en: busRoute.DestinationStopNameEn
        },
        departure: {
          zh_TW: busRoute.DepartureStopNameZh,
          en: busRoute.DepartureStopNameEn
        },
        subRoutes: busRoute.SubRoutes.map((subRoute) => ({
          cityName: busRoute.City,
          id: subRoute.SubRouteUID,
          name: {
            'zh_TW': subRoute.SubRouteName.Zh_tw,
            'en': subRoute.SubRouteName.En
          },
          type: subRoute.Direction
        }))
      }))
    })
  })
})

export const {
  useGetRoutesByCityQuery
} = busApi
