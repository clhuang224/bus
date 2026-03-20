// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { MantineProvider } from '@mantine/core'
import { configureStore } from '@reduxjs/toolkit'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Nearby from './Nearby'
import {
  geoErrorMessages,
  geoPermissionMessages
} from '~/modules/consts/geoMessages'
import { nearbyMessages } from '~/modules/consts/pageMessages'
import { AreaType } from '~/modules/enums/AreaType'
import { BearingType } from '~/modules/enums/BearingType'
import { CityNameType } from '~/modules/enums/CityNameType'
import { GeoErrorType } from '~/modules/enums/geo/GeoErrorType'
import { GeoPermissionType } from '~/modules/enums/geo/GeoPermissionType'

const {
  mockUseGetRoutesByAreaQuery,
  mockUseGetStopsByNearbyAreaQuery,
  mockUseGetStopOfRoutesByAreaQuery,
  mockNearbyStopMap
} = vi.hoisted(() => ({
  mockUseGetRoutesByAreaQuery: vi.fn(),
  mockUseGetStopsByNearbyAreaQuery: vi.fn(),
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
    useGetStopsByNearbyAreaQuery: mockUseGetStopsByNearbyAreaQuery,
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
    isSm?: boolean
  }) => {
    mockNearbyStopMap(props)
    return <div data-testid="nearby-stop-map" />
  }
}))

vi.mock('~/components/common/MapSidebarLayout', () => ({
  MapSidebarLayout: ({
    isSidebarOpened,
    panel,
    children
  }: {
    isSidebarOpened: boolean
    panel: React.ReactNode
    children: React.ReactNode
  }) => (
    <div>
      <div data-testid="nearby-sidebar-state">{isSidebarOpened ? 'opened' : 'closed'}</div>
      <div>{panel}</div>
      <div>{children}</div>
    </div>
  )
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
  initialEntry = '/nearby',
  coords = null,
  geolocationError = null,
  permission = GeoPermissionType.PROMPT,
  queryState,
  routesQueryState,
  stopOfRoutesQueryState
}: {
  initialEntry?: string
  coords?: [number, number] | null
  geolocationError?: GeoErrorType | null
  permission?: GeoPermissionType
  queryState?: {
    data?: unknown[]
    isLoading?: boolean
    error?: unknown
    isSuccess?: boolean
  }
  routesQueryState?: {
    data?: unknown[]
    isLoading?: boolean
  }
  stopOfRoutesQueryState?: {
    data?: unknown[]
    isLoading?: boolean
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

  mockUseGetStopsByNearbyAreaQuery.mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
    isSuccess: false,
    ...queryState
  })
  mockUseGetRoutesByAreaQuery.mockReturnValue({
    data: routesData,
    isLoading: false,
    ...routesQueryState
  })
  mockUseGetStopOfRoutesByAreaQuery.mockReturnValue({
    data: stopOfRoutesData,
    isLoading: false,
    ...stopOfRoutesQueryState
  })

  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Provider store={store}>
          <Nearby />
        </Provider>
      </MemoryRouter>
    </MantineProvider>
  )
}

describe('Nearby', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))

    mockUseGetRoutesByAreaQuery.mockReset()
    mockUseGetStopsByNearbyAreaQuery.mockReset()
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

  it('opens the drawer by default on small screens', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes(themeBreakpointsSmMaxWidth()),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))

    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isLoading: false,
        error: null,
        isSuccess: true
      }
    })

    expect(screen.getByTestId('nearby-sidebar-state')).toHaveTextContent('opened')
  })

  it('shows stop skeletons while waiting for coordinates', () => {
    renderNearby()

    expect(screen.getByTestId('nearby-stops-skeleton')).toBeInTheDocument()
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

  it('shows stop skeletons after coordinates are available and nearby stops are loading', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        isLoading: true
      }
    })

    expect(screen.getByTestId('nearby-stops-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('定位中')).not.toBeInTheDocument()
    expect(screen.queryByText('載入中')).not.toBeInTheDocument()
  })

  it('shows an error message when nearby stop data fails to load', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        error: new Error('network error')
      }
    })

    expect(screen.getByText(nearbyMessages.loadStopsError.title)).toBeInTheDocument()
    expect(screen.getByText(nearbyMessages.loadStopsError.description)).toBeInTheDocument()
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

    expect(screen.getByText(nearbyMessages.emptyStops.title)).toBeInTheDocument()
    expect(screen.getByText(nearbyMessages.emptyStops.description)).toBeInTheDocument()
  })

  it('loads nearby stops with bounded area query params once coords are available', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true
      }
    })

    expect(mockUseGetStopsByNearbyAreaQuery).toHaveBeenLastCalledWith({
      area: AreaType.TAIPEI,
      coords: [25.033, 121.5654]
    }, {
      skip: false
    })
  })

  it('loads stop-of-route data when a stop is selected, but delays route detail data until viewing routes', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true
      }
    })

    expect(mockUseGetRoutesByAreaQuery).toHaveBeenLastCalledWith(expect.anything(), {
      skip: true
    })
    expect(mockUseGetStopOfRoutesByAreaQuery).toHaveBeenLastCalledWith({
      area: AreaType.TAIPEI,
      stopUIDs: ['stop-1', 'stop-2', 'stop-3']
    }, {
      skip: true
    })

    fireEvent.click(screen.getByRole('button', { name: '市政府' }))

    expect(mockUseGetRoutesByAreaQuery).toHaveBeenLastCalledWith(expect.anything(), {
      skip: true
    })
    expect(mockUseGetStopOfRoutesByAreaQuery).toHaveBeenLastCalledWith({
      area: AreaType.TAIPEI,
      stopUIDs: ['stop-1', 'stop-2', 'stop-3']
    }, {
      skip: false
    })

    renderNearby({
      initialEntry: '/nearby?stop=station-1&routeStop=station-1',
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true
      }
    })

    expect(mockUseGetRoutesByAreaQuery).toHaveBeenLastCalledWith(expect.anything(), {
      skip: false
    })
  })

  it('shows route skeletons while nearby station routes are loading', () => {
    renderNearby({
      initialEntry: '/nearby?stop=station-1&routeStop=station-1',
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true
      },
      routesQueryState: {
        data: [],
        isLoading: true
      },
      stopOfRoutesQueryState: {
        data: [],
        isLoading: true
      }
    })

    expect(screen.getByTestId('nearby-stop-routes-skeleton')).toBeInTheDocument()
  })

  it('sets the first available nearby route tab as active once route data is ready', () => {
    renderNearby({
      initialEntry: '/nearby?stop=station-1&routeStop=station-1',
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true
      }
    })

    expect(screen.getByRole('tab', { name: '去程' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: '返程' })).toHaveAttribute('aria-selected', 'false')
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

function themeBreakpointsSmMaxWidth() {
  return '48em'
}
