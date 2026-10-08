import { configureStore } from '@reduxjs/toolkit'
import { AreaType, CityNameType, type ApiRouteSummary } from '@bus/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BusRoute } from '../interfaces/BusRoute'
import type { RouteSummary } from '../interfaces/RouteSummary'
import { transitApi } from './transit'

const {
  mockGetDatabaseRoutes,
  mockGetTdxRoutesByArea,
  mockIsDatabaseApiEnabled,
} = vi.hoisted(() => ({
  mockGetDatabaseRoutes: vi.fn(),
  mockGetTdxRoutesByArea: vi.fn(),
  mockIsDatabaseApiEnabled: vi.fn(),
}))

vi.mock('./database', () => ({
  databaseApi: {
    endpoints: {
      getRoutes: { initiate: mockGetDatabaseRoutes },
    },
  },
  isDatabaseApiEnabled: mockIsDatabaseApiEnabled,
}))

vi.mock('./bus', () => ({
  AREA_ROUTES_RETENTION_SECONDS: 60,
  busApi: {
    endpoints: {
      getRoutesByArea: { initiate: mockGetTdxRoutesByArea },
    },
  },
}))

/** Mimics a source endpoint's initiate() thunk and its unwrap() result. */
function sourceResult(result: { data: unknown } | { error: unknown }) {
  return () => () => ({
    unwrap: () =>
      'data' in result
        ? Promise.resolve(result.data)
        : Promise.reject(result.error),
  })
}

function createStore() {
  return configureStore({
    reducer: { [transitApi.reducerPath]: transitApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(transitApi.middleware),
  })
}

const apiRoute: ApiRouteSummary = {
  uuid: 'TPE10132',
  city: CityNameType.TAIPEI,
  name: { 'zh-TW': '藍1', en: 'Blue 1' },
  departure: { 'zh-TW': '市政府', en: 'City Hall' },
  destination: { 'zh-TW': '昆陽', en: '' },
}

const tdxRoute = {
  RouteUID: 'TPE10132',
  City: CityNameType.TAIPEI,
  RouteName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
  DepartureStopName: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
  DestinationStopName: { 'zh-TW': '昆陽', en: '', ja: '', ko: '' },
} as BusRoute<string>

const expectedRoute: RouteSummary = {
  routeUID: 'TPE10132',
  city: CityNameType.TAIPEI,
  name: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
  departure: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
  destination: { 'zh-TW': '昆陽', en: '', ja: '', ko: '' },
}

describe('transitApi.getRouteSummaries', () => {
  beforeEach(() => {
    mockGetDatabaseRoutes.mockReset()
    mockGetTdxRoutesByArea.mockReset()
    mockIsDatabaseApiEnabled.mockReset()
  })

  it('reads routes from the database API in local API mode', async () => {
    mockIsDatabaseApiEnabled.mockReturnValue(true)
    mockGetDatabaseRoutes.mockImplementation(sourceResult({ data: [apiRoute] }))

    const result = await createStore().dispatch(
      transitApi.endpoints.getRouteSummaries.initiate(AreaType.TAIPEI),
    )

    expect(result.data).toEqual([expectedRoute])
    expect(mockGetDatabaseRoutes).toHaveBeenCalledWith(AreaType.TAIPEI, {
      subscribe: false,
    })
    expect(mockGetTdxRoutesByArea).not.toHaveBeenCalled()
  })

  it('reads routes from TDX when local API mode is off', async () => {
    mockIsDatabaseApiEnabled.mockReturnValue(false)
    mockGetTdxRoutesByArea.mockImplementation(
      sourceResult({ data: [tdxRoute] }),
    )

    const result = await createStore().dispatch(
      transitApi.endpoints.getRouteSummaries.initiate(AreaType.TAIPEI),
    )

    expect(result.data).toEqual([expectedRoute])
    expect(mockGetDatabaseRoutes).not.toHaveBeenCalled()
  })

  it('passes the source error through unchanged', async () => {
    const error = { status: 429, data: 'Too Many Requests' }
    mockIsDatabaseApiEnabled.mockReturnValue(false)
    mockGetTdxRoutesByArea.mockImplementation(sourceResult({ error }))

    const result = await createStore().dispatch(
      transitApi.endpoints.getRouteSummaries.initiate(AreaType.TAIPEI),
    )

    expect(result.error).toEqual(error)
  })
})
