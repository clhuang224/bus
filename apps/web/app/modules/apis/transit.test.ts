import { configureStore } from '@reduxjs/toolkit'
import {
  AreaType,
  BearingType,
  CityNameType,
  DirectionType,
  ErrorCode,
  type ApiRouteDetail,
  type ApiRouteSummary,
  type ApiStation,
} from '@bus/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BusRoute, BusSubRoute } from '../interfaces/BusRoute'
import type { RouteSummary } from '../interfaces/RouteSummary'
import type { Stop } from '../interfaces/Stop'
import type { StopOfRoute } from '../interfaces/StopOfRoute'
import { transitApi } from './transit'

const {
  mockGetDatabaseNearbyStations,
  mockGetDatabaseRouteDetail,
  mockGetDatabaseRoutes,
  mockGetTdxRouteShapesByRoute,
  mockGetTdxRoutesByArea,
  mockGetTdxRoutesByCity,
  mockGetTdxStopOfRoutesByArea,
  mockGetTdxStopOfRoutesByCity,
  mockGetTdxStopsByCityAndIds,
  mockGetTdxStopsByNearbyArea,
  mockIsDatabaseApiEnabled,
} = vi.hoisted(() => ({
  mockGetDatabaseNearbyStations: vi.fn(),
  mockGetDatabaseRouteDetail: vi.fn(),
  mockGetDatabaseRoutes: vi.fn(),
  mockGetTdxRouteShapesByRoute: vi.fn(),
  mockGetTdxRoutesByArea: vi.fn(),
  mockGetTdxRoutesByCity: vi.fn(),
  mockGetTdxStopOfRoutesByArea: vi.fn(),
  mockGetTdxStopOfRoutesByCity: vi.fn(),
  mockGetTdxStopsByCityAndIds: vi.fn(),
  mockGetTdxStopsByNearbyArea: vi.fn(),
  mockIsDatabaseApiEnabled: vi.fn(),
}))

vi.mock('./database', () => ({
  databaseApi: {
    endpoints: {
      getNearbyStations: { initiate: mockGetDatabaseNearbyStations },
      getRouteDetail: { initiate: mockGetDatabaseRouteDetail },
      getRoutes: { initiate: mockGetDatabaseRoutes },
    },
  },
  isDatabaseApiEnabled: mockIsDatabaseApiEnabled,
}))

vi.mock('./bus', () => ({
  AREA_ROUTES_RETENTION_SECONDS: 60,
  busApi: {
    endpoints: {
      getRouteShapesByRoute: { initiate: mockGetTdxRouteShapesByRoute },
      getRoutesByArea: { initiate: mockGetTdxRoutesByArea },
      getRoutesByCity: { initiate: mockGetTdxRoutesByCity },
      getStopOfRoutesByArea: { initiate: mockGetTdxStopOfRoutesByArea },
      getStopOfRoutesByCity: { initiate: mockGetTdxStopOfRoutesByCity },
      getStopsByCityAndIds: { initiate: mockGetTdxStopsByCityAndIds },
      getStopsByNearbyArea: { initiate: mockGetTdxStopsByNearbyArea },
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
  SubRoutes: [] as BusSubRoute<string>[],
} as BusRoute<string>

const expectedRoute: RouteSummary = {
  routeUID: 'TPE10132',
  city: CityNameType.TAIPEI,
  name: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
  departure: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
  destination: { 'zh-TW': '昆陽', en: '', ja: '', ko: '' },
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('transitApi.getRouteSummaries', () => {
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

const nearbyQuery = {
  area: AreaType.TAIPEI,
  coords: [25.033, 121.5654] as [number, number],
}

const apiStation: ApiStation = {
  uuid: 'TPE1001',
  city: CityNameType.TAIPEI,
  name: { 'zh-TW': '市政府', en: 'City Hall' },
  address: null,
  bearing: BearingType.NORTH,
  position: { latitude: 25.033, longitude: 121.5654 },
  distance_meters: 12,
  route_directions: [
    {
      direction: DirectionType.GO,
      routes: [
        {
          uuid: 'TPE10132',
          city: CityNameType.TAIPEI,
          name: apiRoute.name,
          departure: apiRoute.departure,
          destination: apiRoute.destination,
        },
      ],
    },
  ],
}

const nearStop = {
  StopUID: 'TPE1',
  StationID: 'station-1',
  StopName: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
  City: CityNameType.TAIPEI,
  StopAddress: null,
  Bearing: null,
  position: [121.5654, 25.033],
} as Stop

const farStop = {
  ...nearStop,
  StopUID: 'TPE2',
  StationID: 'station-2',
  position: [121.6, 25.1],
} as Stop

const stopOfRoute = {
  RouteUID: 'TPE10132',
  RouteName: tdxRoute.RouteName,
  SubRouteUID: 'TPE101320',
  SubRouteName: tdxRoute.RouteName,
  Direction: DirectionType.GO,
  City: CityNameType.TAIPEI,
  Stops: [{ StopUID: 'TPE1', StationID: 'station-1' }],
} as StopOfRoute

describe('transitApi.getNearbyStations', () => {
  it('returns database stations together with their routes', async () => {
    mockIsDatabaseApiEnabled.mockReturnValue(true)
    mockGetDatabaseNearbyStations.mockImplementation(
      sourceResult({ data: [apiStation] }),
    )

    const result = await createStore().dispatch(
      transitApi.endpoints.getNearbyStations.initiate(nearbyQuery),
    )

    expect(mockGetDatabaseNearbyStations).toHaveBeenCalledWith(
      { latitude: 25.033, longitude: 121.5654, radius_meters: 500 },
      { subscribe: false },
    )
    expect(result.data?.stations.map(({ stationId }) => stationId)).toEqual([
      'TPE1001',
    ])
    expect(result.data?.routesByStationId).toEqual({
      TPE1001: [
        {
          id: 'TPE10132-0',
          routeUID: 'TPE10132',
          city: CityNameType.TAIPEI,
          name: expectedRoute.name,
          departure: expectedRoute.departure,
          destination: expectedRoute.destination,
          direction: DirectionType.GO,
        },
      ],
    })
  })

  it('returns TDX stops within walking distance without loading routes', async () => {
    mockIsDatabaseApiEnabled.mockReturnValue(false)
    mockGetTdxStopsByNearbyArea.mockImplementation(
      sourceResult({ data: [nearStop, farStop] }),
    )

    const result = await createStore().dispatch(
      transitApi.endpoints.getNearbyStations.initiate(nearbyQuery),
    )

    expect(result.data?.stations.map(({ stationId }) => stationId)).toEqual([
      'station-1',
    ])
    expect(result.data?.routesByStationId).toBeNull()
    expect(mockGetTdxStopOfRoutesByArea).not.toHaveBeenCalled()
    expect(mockGetTdxRoutesByArea).not.toHaveBeenCalled()
  })
})

describe('transitApi.getNearbyStationRoutes', () => {
  beforeEach(() => {
    mockIsDatabaseApiEnabled.mockReturnValue(false)
    mockGetTdxStopsByNearbyArea.mockImplementation(
      sourceResult({ data: [nearStop, farStop] }),
    )
    mockGetTdxStopOfRoutesByArea.mockImplementation(
      sourceResult({ data: [stopOfRoute] }),
    )
    mockGetTdxRoutesByArea.mockImplementation(
      sourceResult({ data: [tdxRoute] }),
    )
  })

  it('loads TDX route names for nearby stops only', async () => {
    const result = await createStore().dispatch(
      transitApi.endpoints.getNearbyStationRoutes.initiate({
        ...nearbyQuery,
        includeTerminals: false,
      }),
    )

    expect(mockGetTdxStopOfRoutesByArea).toHaveBeenCalledWith(
      { area: AreaType.TAIPEI, stopUIDs: ['TPE1'] },
      { subscribe: false },
    )
    expect(mockGetTdxRoutesByArea).not.toHaveBeenCalled()
    expect(result.data?.['station-1']).toMatchObject([
      {
        routeUID: 'TPE10132',
        name: { 'zh-TW': '藍1', en: 'Blue 1' },
        departure: { 'zh-TW': '', en: '' },
      },
    ])
  })

  it('adds TDX terminal names when requested', async () => {
    const result = await createStore().dispatch(
      transitApi.endpoints.getNearbyStationRoutes.initiate({
        ...nearbyQuery,
        includeTerminals: true,
      }),
    )

    expect(mockGetTdxRoutesByArea).toHaveBeenCalledWith(AreaType.TAIPEI, {
      subscribe: false,
    })
    expect(result.data?.['station-1']).toMatchObject([
      {
        departure: { 'zh-TW': '市政府', en: 'City Hall' },
        destination: { 'zh-TW': '昆陽', en: '昆陽' },
      },
    ])
  })
})

const routeDetailQuery = { city: CityNameType.TAIPEI, routeUID: 'TPE10132' }

const apiRouteDetail: ApiRouteDetail = {
  ...apiRoute,
  sub_routes: [
    {
      uuid: 'TPE101320-0',
      name: apiRoute.name,
      direction: DirectionType.GO,
      departure: apiRoute.departure,
      destination: apiRoute.destination,
      first_bus_time: null,
      last_bus_time: null,
      stops: [
        {
          uuid: 'TPE1',
          sequence: 1,
          name: { 'zh-TW': '市政府', en: 'City Hall' },
          position: { latitude: 25.033, longitude: 121.5654 },
          tdx: { stop_id: '1', station_id: 'station-1' },
        },
      ],
      shape: {
        path: [
          [121.5654, 25.033],
          [121.57, 25.04],
        ],
        updated_at: '2026-10-01T00:00:00.000Z',
      },
      tdx: { sub_route_uid: 'TPE101320' },
    },
  ],
}

const tdxRouteWithSubRoute = {
  ...tdxRoute,
  SubRoutes: [
    {
      SubRouteUID: 'TPE101320',
      Direction: DirectionType.GO,
      SubRouteName: tdxRoute.RouteName,
      DepartureStopName: tdxRoute.DepartureStopName,
      DestinationStopName: tdxRoute.DestinationStopName,
    } as BusSubRoute<string>,
  ],
} as BusRoute<string>

const tdxStopOfRoute = {
  ...stopOfRoute,
  Stops: [
    {
      StopUID: 'TPE1',
      StopID: '1',
      StationID: 'station-1',
      StopName: nearStop.StopName,
      StopSequence: 1,
    },
  ],
} as StopOfRoute

const expectedSubRoute = {
  id: 'TPE101320-0',
  subRouteUID: 'TPE101320',
  direction: DirectionType.GO,
  stops: [
    {
      stopUID: 'TPE1',
      stopID: '1',
      stationID: 'station-1',
      name: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
      sequence: 1,
      position: [121.5654, 25.033],
    },
  ],
}

describe('transitApi.getRouteDetail', () => {
  describe('in local API mode', () => {
    beforeEach(() => {
      mockIsDatabaseApiEnabled.mockReturnValue(true)
    })

    it('reads the route detail from the database API', async () => {
      mockGetDatabaseRouteDetail.mockImplementation(
        sourceResult({ data: apiRouteDetail }),
      )

      const result = await createStore().dispatch(
        transitApi.endpoints.getRouteDetail.initiate(routeDetailQuery),
      )

      expect(mockGetDatabaseRouteDetail).toHaveBeenCalledWith('TPE10132', {
        subscribe: false,
      })
      expect(result.data).toMatchObject({
        routeUID: 'TPE10132',
        subRoutes: [
          {
            ...expectedSubRoute,
            path: [
              [121.5654, 25.033],
              [121.57, 25.04],
            ],
          },
        ],
      })
    })

    it('returns null when the route does not exist', async () => {
      mockGetDatabaseRouteDetail.mockImplementation(
        sourceResult({
          error: {
            status: 404,
            data: {
              status: 404,
              error: { code: ErrorCode.ROUTE_NOT_FOUND, message: 'missing' },
            },
          },
        }),
      )

      const result = await createStore().dispatch(
        transitApi.endpoints.getRouteDetail.initiate(routeDetailQuery),
      )

      expect(result.isSuccess).toBe(true)
      expect(result.data).toBeNull()
    })

    it('passes other errors through', async () => {
      const error = { status: 500, data: null }
      mockGetDatabaseRouteDetail.mockImplementation(sourceResult({ error }))

      const result = await createStore().dispatch(
        transitApi.endpoints.getRouteDetail.initiate(routeDetailQuery),
      )

      expect(result.error).toEqual(error)
    })
  })

  describe('in TDX mode', () => {
    beforeEach(() => {
      mockIsDatabaseApiEnabled.mockReturnValue(false)
      mockGetTdxRoutesByCity.mockImplementation(
        sourceResult({ data: [tdxRouteWithSubRoute] }),
      )
      mockGetTdxStopOfRoutesByCity.mockImplementation(
        sourceResult({ data: [tdxStopOfRoute] }),
      )
      mockGetTdxStopsByCityAndIds.mockImplementation(
        sourceResult({ data: [nearStop] }),
      )
      mockGetTdxRouteShapesByRoute.mockImplementation(
        sourceResult({ data: [] }),
      )
    })

    it('combines the TDX route, stops, positions, and shapes', async () => {
      const result = await createStore().dispatch(
        transitApi.endpoints.getRouteDetail.initiate(routeDetailQuery),
      )

      expect(mockGetTdxStopsByCityAndIds).toHaveBeenCalledWith(
        { city: CityNameType.TAIPEI, stopIds: ['1', 'TPE1'] },
        { subscribe: false },
      )
      expect(result.data).toMatchObject({
        routeUID: 'TPE10132',
        subRoutes: [{ ...expectedSubRoute, path: [] }],
      })
    })

    it('keeps the route when the shape request fails', async () => {
      mockGetTdxRouteShapesByRoute.mockImplementation(
        sourceResult({ error: { status: 429, data: null } }),
      )

      const result = await createStore().dispatch(
        transitApi.endpoints.getRouteDetail.initiate(routeDetailQuery),
      )

      expect(result.data?.subRoutes[0]?.path).toEqual([])
    })

    it('returns null when the city has no such route', async () => {
      mockGetTdxRoutesByCity.mockImplementation(sourceResult({ data: [] }))

      const result = await createStore().dispatch(
        transitApi.endpoints.getRouteDetail.initiate(routeDetailQuery),
      )

      expect(result.data).toBeNull()
    })
  })
})
