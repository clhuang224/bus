import type { SerializedError } from '@reduxjs/toolkit'
import {
  createApi,
  fakeBaseQuery,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import type { AreaType } from '@bus/shared'
import type { RouteSummary } from '../interfaces/RouteSummary'
import {
  toRouteSummaryFromApi,
  toRouteSummaryFromTdx,
} from '../utils/routes/toRouteSummary'
import { AREA_ROUTES_RETENTION_SECONDS, busApi } from './bus'
import { databaseApi, isDatabaseApiEnabled } from './database'

export type TransitQueryError = FetchBaseQueryError | SerializedError

// Source endpoints keep their own short-lived cache, so nested requests from
// several transit endpoints share one upstream response.
const SOURCE_REQUEST_OPTIONS = { subscribe: false } as const

async function querySource<T>(load: () => Promise<T>) {
  try {
    return { data: await load() }
  } catch (error) {
    // unwrap() rejects with the source endpoint's own error value.
    return { error: error as TransitQueryError }
  }
}

/**
 * App-facing data that may come from either the app database API or TDX.
 * Pages and hooks use these endpoints and never choose the source themselves.
 */
export const transitApi = createApi({
  reducerPath: 'transitApi',
  baseQuery: fakeBaseQuery<TransitQueryError>(),
  endpoints: (build) => ({
    getRouteSummaries: build.query<RouteSummary[], AreaType>({
      keepUnusedDataFor: AREA_ROUTES_RETENTION_SECONDS,
      queryFn: (area, { dispatch }) =>
        querySource(async () => {
          if (isDatabaseApiEnabled()) {
            const routes = await dispatch(
              databaseApi.endpoints.getRoutes.initiate(
                area,
                SOURCE_REQUEST_OPTIONS,
              ),
            ).unwrap()

            return routes.map(toRouteSummaryFromApi)
          }

          const routes = await dispatch(
            busApi.endpoints.getRoutesByArea.initiate(
              area,
              SOURCE_REQUEST_OPTIONS,
            ),
          ).unwrap()

          return routes.map(toRouteSummaryFromTdx)
        }),
    }),
  }),
})
