// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { MantineProvider } from '@mantine/core'
import { configureStore } from '@reduxjs/toolkit'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Nearby from './Nearby'
import {
  geoErrorMessages,
  geoPermissionMessages
} from '~/modules/consts/geoMessages'
import { BearingType } from '~/modules/enums/BearingType'
import { CityNameType } from '~/modules/enums/CityNameType'
import { GeoErrorType } from '~/modules/enums/geo/GeoErrorType'
import { GeoPermissionType } from '~/modules/enums/geo/GeoPermissionType'

const {
  mockUseGetRoutesByAreaQuery,
  mockUseGetStopsByAreaQuery,
  mockUseGetStopOfRoutesByAreaQuery,
  mockNearbyStopMap
} = vi.hoisted(() => ({
  mockUseGetRoutesByAreaQuery: vi.fn(),
  mockUseGetStopsByAreaQuery: vi.fn(),
  mockUseGetStopOfRoutesByAreaQuery: vi.fn(),
  mockNearbyStopMap: vi.fn()
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)
HTMLElement.prototype.scrollIntoView = vi.fn()

vi.mock('~/modules/apis/bus', () => ({
  busApi: {
    useGetRoutesByAreaQuery: mockUseGetRoutesByAreaQuery,
    useGetStopsByAreaQuery: mockUseGetStopsByAreaQuery,
    useGetStopOfRoutesByAreaQuery: mockUseGetStopOfRoutesByAreaQuery
  }
}))

vi.mock('~/modules/utils/getCityByCoords', () => ({
  getCityByCoords: () => CityNameType.TAIPEI
}))

vi.mock('~/components/nearby/NearbyStopMap', () => ({
  NearbyStopMap: (props: {
    selectedStop: string | null
    onSelectStop: (id: string | null) => void
    markers: Array<{ id: string, label: string }>
  }) => {
    mockNearbyStopMap(props)
    return <div data-testid="nearby-stop-map" />
  }
}))

const nearbyStopsData = [
  {
    StopUID: 'stop-1',
    AuthorityID: '005',
    StationID: 'station-1',
    StationGroupID: 'group-1',
    StopID: 'stop-id-1',
    StopName: { zh_TW: '市政府', en: 'City Hall' },
    GeoHash: 'wsqqefdz0',
    City: CityNameType.TAIPEI,
    StopAddress: 'Address 1',
    Bearing: BearingType.NORTH,
    StopDescription: null,
    UpdateTime: '2026-03-15T21:52:45+08:00',
    VersionID: 1,
    position: [121.5654, 25.033]
  },
  {
    StopUID: 'stop-2',
    AuthorityID: '005',
    StationID: 'station-1',
    StationGroupID: 'group-1',
    StopID: 'stop-id-2',
    StopName: { zh_TW: '市政府', en: 'City Hall' },
    GeoHash: 'wsqqefcw6',
    City: CityNameType.TAIPEI,
    StopAddress: 'Address 2',
    Bearing: BearingType.SOUTH,
    StopDescription: null,
    UpdateTime: '2026-03-15T21:52:45+08:00',
    VersionID: 1,
    position: [121.567, 25.034]
  },
  {
    StopUID: 'stop-3',
    AuthorityID: '005',
    StationID: 'station-2',
    StationGroupID: 'group-2',
    StopID: 'stop-id-3',
    StopName: { zh_TW: '台北車站', en: 'Taipei Main Station' },
    GeoHash: 'wsqqeepb5',
    City: CityNameType.TAIPEI,
    StopAddress: 'Address 3',
    Bearing: BearingType.EAST,
    StopDescription: null,
    UpdateTime: '2026-03-15T21:52:45+08:00',
    VersionID: 1,
    position: [121.568, 25.035]
  }
]

const stopOfRoutesData = [
  {
    RouteUID: 'route-1',
    RouteID: '1',
    RouteName: { zh_TW: '藍1', en: 'Blue 1' },
    SubRouteUID: 'subroute-1',
    SubRouteID: '1',
    City: CityNameType.TAIPEI,
    SubRouteName: { zh_TW: '藍1', en: 'Blue 1' },
    Direction: 0,
    Stops: [
      {
        StopUID: 'stop-1',
        StopID: 'stop-id-1',
        StationID: 'station-1',
        StopSequence: 1,
        StopName: { zh_TW: '市政府', en: 'City Hall' }
      }
    ]
  },
  {
    RouteUID: 'route-2',
    RouteID: '2',
    RouteName: { zh_TW: '藍1', en: 'Blue 1' },
    SubRouteUID: 'subroute-2',
    SubRouteID: '2',
    City: CityNameType.NEW_TAIPEI,
    SubRouteName: { zh_TW: '藍1', en: 'Blue 1' },
    Direction: 1,
    Stops: [
      {
        StopUID: 'stop-2',
        StopID: 'stop-id-2',
        StationID: 'station-1',
        StopSequence: 2,
        StopName: { zh_TW: '市政府', en: 'City Hall' }
      }
    ]
  }
]

const routesData = [
  {
    RouteUID: 'route-1',
    RouteID: '1',
    HasSubRoutes: true,
    Operators: [],
    AuthorityID: '005',
    ProviderID: 'provider-1',
    RouteName: { zh_TW: '藍1', en: 'Blue 1' },
    DepartureStopName: { zh_TW: '市政府', en: 'City Hall' },
    DestinationStopName: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' },
    TicketPriceDescription: { zh_TW: '', en: '' },
    FareBufferZoneDescription: { zh_TW: '', en: '' },
    RouteMapImageUrl: '',
    City: CityNameType.TAIPEI,
    CityCode: 'TPE',
    UpdateTime: '2026-03-15T21:52:45+08:00',
    VersionID: 1,
    BusRouteType: 0,
    SubRoutes: [
      {
        SubRouteUID: 'subroute-1',
        SubRouteID: '1',
        OperatorIDs: [],
        SubRouteName: { zh_TW: '藍1', en: 'Blue 1' },
        Direction: 0,
        FirstBusTime: '',
        LastBusTime: '',
        HolidayFirstBusTime: '',
        HolidayLastBusTime: '',
        DepartureStopName: { zh_TW: '市政府', en: 'City Hall' },
        DestinationStopName: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' }
      }
    ]
  },
  {
    RouteUID: 'route-2',
    RouteID: '2',
    HasSubRoutes: true,
    Operators: [],
    AuthorityID: '005',
    ProviderID: 'provider-2',
    RouteName: { zh_TW: '藍1', en: 'Blue 1' },
    DepartureStopName: { zh_TW: '市政府', en: 'City Hall' },
    DestinationStopName: { zh_TW: '板橋公車站', en: 'Banqiao Bus Station' },
    TicketPriceDescription: { zh_TW: '', en: '' },
    FareBufferZoneDescription: { zh_TW: '', en: '' },
    RouteMapImageUrl: '',
    City: CityNameType.NEW_TAIPEI,
    CityCode: 'NWT',
    UpdateTime: '2026-03-15T21:52:45+08:00',
    VersionID: 1,
    BusRouteType: 0,
    SubRoutes: [
      {
        SubRouteUID: 'subroute-2',
        SubRouteID: '2',
        OperatorIDs: [],
        SubRouteName: { zh_TW: '藍1', en: 'Blue 1' },
        Direction: 1,
        FirstBusTime: '',
        LastBusTime: '',
        HolidayFirstBusTime: '',
        HolidayLastBusTime: '',
        DepartureStopName: { zh_TW: '市政府', en: 'City Hall' },
        DestinationStopName: { zh_TW: '板橋公車站', en: 'Banqiao Bus Station' }
      }
    ]
  }
]

function renderNearby({
  coords = null,
  geolocationError = null,
  permission = GeoPermissionType.PROMPT,
  queryState
}: {
  coords?: [number, number] | null
  geolocationError?: GeoErrorType | null
  permission?: GeoPermissionType
  queryState?: {
    data?: unknown[]
    isLoading?: boolean
    error?: unknown
    isSuccess?: boolean
  }
} = {}) {
  const store = configureStore({
    reducer: {
      geolocation: () => ({
        coords,
        error: geolocationError,
        permission,
        watching: false
      }),
      cityGeo: () => ({
        geojson: null,
        loading: false,
        error: null
      })
    }
  })

  mockUseGetStopsByAreaQuery.mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
    isSuccess: false,
    ...queryState
  })
  mockUseGetRoutesByAreaQuery.mockReturnValue({
    data: routesData
  })
  mockUseGetStopOfRoutesByAreaQuery.mockReturnValue({
    data: stopOfRoutesData
  })

  return render(
    <MantineProvider>
      <Provider store={store}>
        <Nearby />
      </Provider>
    </MantineProvider>
  )
}

describe('Nearby', () => {
  beforeEach(() => {
    mockUseGetRoutesByAreaQuery.mockReset()
    mockUseGetStopsByAreaQuery.mockReset()
    mockUseGetStopOfRoutesByAreaQuery.mockReset()
    mockNearbyStopMap.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows a denied-location message when geolocation permission is denied', () => {
    renderNearby({
      permission: GeoPermissionType.DENIED
    })

    expect(
      screen.getByText(geoPermissionMessages[GeoPermissionType.DENIED]!.title)
    ).toBeInTheDocument()
    expect(
      screen.getByText(geoPermissionMessages[GeoPermissionType.DENIED]!.description)
    ).toBeInTheDocument()
  })

  it('shows a locating message while waiting for coordinates', () => {
    renderNearby()

    expect(screen.getByText('定位中')).toBeInTheDocument()
    expect(screen.getByText('正在取得您的目前位置，請稍候...')).toBeInTheDocument()
  })

  it('shows a geolocation error message when the position is unavailable', () => {
    renderNearby({
      geolocationError: GeoErrorType.POSITION_UNAVAILABLE
    })

    expect(
      screen.getByText(geoErrorMessages[GeoErrorType.POSITION_UNAVAILABLE].title)
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        geoErrorMessages[GeoErrorType.POSITION_UNAVAILABLE].description
      )
    ).toBeInTheDocument()
  })

  it('shows a loading message after coordinates are available and nearby stops are loading', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        isLoading: true
      }
    })

    expect(screen.getByText('載入中')).toBeInTheDocument()
    expect(screen.getByText('正在取得附近的站牌資料，請稍候...')).toBeInTheDocument()
  })

  it('shows an error message when nearby stop data fails to load', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        error: new Error('network error')
      }
    })

    expect(screen.getByText('載入站牌資料失敗')).toBeInTheDocument()
    expect(screen.getByText('請稍後再試，或確認您的網路連線')).toBeInTheDocument()
  })

  it('shows an empty-state message when no nearby stops are found', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: [],
        isSuccess: true
      }
    })

    expect(screen.getByText('附近沒有站牌')).toBeInTheDocument()
    expect(screen.getByText('目前在您附近沒有找到任何站牌')).toBeInTheDocument()
  })

  it('syncs selected stop from the map back to the list state', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true
      }
    })

    const firstRenderProps = mockNearbyStopMap.mock.calls.at(-1)?.[0]
    expect(firstRenderProps?.selectedStop).toBeNull()

    act(() => {
      firstRenderProps?.onSelectStop('station-1')
    })

    const updatedProps = mockNearbyStopMap.mock.calls.at(-1)?.[0]
    expect(updatedProps?.selectedStop).toBe('station-1')
  })

  it('syncs selected stop from the list back to the map props', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true
      }
    })

    fireEvent.click(screen.getByRole('button', { name: '市政府' }))

    const updatedProps = mockNearbyStopMap.mock.calls.at(-1)?.[0]
    expect(updatedProps?.selectedStop).toBe('station-1')
  })

  it('expands the matching list item when the map selects a stop', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true
      }
    })

    const firstRenderProps = mockNearbyStopMap.mock.calls.at(-1)?.[0]

    act(() => {
      firstRenderProps?.onSelectStop('station-1')
    })

    expect(screen.getByRole('button', { name: '市政府' })).toHaveAttribute('aria-expanded', 'true')
  })
})
