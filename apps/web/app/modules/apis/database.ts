import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  type ApiRouteSummary,
  type ApiSuccessResponse,
  type ApiStation,
  type AppLocaleType,
  type AreaType,
  type RoutesResponse,
  type StationsResponse,
} from '@bus/shared'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

interface LocaleState {
  locale: {
    value: AppLocaleType
  }
}

interface NearbyStationsQuery {
  latitude: number
  longitude: number
  radius_meters: number
}

export function isDatabaseApiEnabled(): boolean {
  return Boolean(apiBaseUrl)
}

export const databaseApi = createApi({
  reducerPath: 'databaseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl ?? '',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as LocaleState
      headers.set('Accept-Language', state.locale.value)
      return headers
    },
  }),
  endpoints: (build) => ({
    getRoutes: build.query<ApiRouteSummary[], AreaType>({
      query: (area) => ({
        url: 'routes',
        params: { area },
      }),
      transformResponse: (response: ApiSuccessResponse<RoutesResponse>) =>
        response.data.routes,
    }),
    getNearbyStations: build.query<ApiStation[], NearbyStationsQuery>({
      query: (params) => ({
        url: 'stations',
        params,
      }),
      transformResponse: (response: ApiSuccessResponse<StationsResponse>) =>
        response.data.stations,
    }),
  }),
})
