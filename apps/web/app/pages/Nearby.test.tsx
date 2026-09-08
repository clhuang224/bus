// @vitest-environment jsdom

import { act, fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Nearby from './Nearby'
import i18n from '~/modules/i18n'
import {
  getGeoErrorMessages,
  getGeoPermissionMessages,
} from '~/modules/consts/geoMessages'
import { getNearbyMessages } from '~/modules/consts/pageMessages'
import {
  AreaType,
  BearingType,
  CityNameType,
  DirectionType,
  type ApiStation,
} from '@bus/shared'
import { GeoErrorType } from '~/modules/enums/geo/GeoErrorType'
import { GeoPermissionType } from '~/modules/enums/geo/GeoPermissionType'
import { createTestStore } from '~/test/createTestStore'
import { mockMatchMedia } from '~/test/mockMatchMedia'
import { renderWithProvidersAndRouter } from '~/test/render'

const {
  mockUseGetRoutesByAreaQuery,
  mockUseGetStopsByNearbyAreaQuery,
  mockUseGetStopOfRoutesByAreaQuery,
  mockUseGetNearbyStationsQuery,
  mockIsDatabaseApiEnabled,
  mockNearbyStationMap,
} = vi.hoisted(() => ({
  mockUseGetRoutesByAreaQuery: vi.fn(),
  mockUseGetStopsByNearbyAreaQuery: vi.fn(),
  mockUseGetStopOfRoutesByAreaQuery: vi.fn(),
  mockUseGetNearbyStationsQuery: vi.fn(),
  mockIsDatabaseApiEnabled: vi.fn(),
  mockNearbyStationMap: vi.fn(),
}))

vi.mock('~/modules/apis/bus', () => ({
  busApi: {
    useGetRoutesByAreaQuery: mockUseGetRoutesByAreaQuery,
    useGetStopsByNearbyAreaQuery: mockUseGetStopsByNearbyAreaQuery,
    useGetStopOfRoutesByAreaQuery: mockUseGetStopOfRoutesByAreaQuery,
  },
}))

vi.mock('~/modules/apis/database', () => ({
  databaseApi: {
    useGetNearbyStationsQuery: mockUseGetNearbyStationsQuery,
  },
  isDatabaseApiEnabled: mockIsDatabaseApiEnabled,
}))

vi.mock('~/modules/utils/geo/getCityByCoords', () => ({
  getCityByCoords: () => CityNameType.TAIPEI,
}))

vi.mock('~/components/nearby/NearbyStationMap', () => ({
  NearbyStationMap: (props: {
    extraControls?: React.ReactNode
    selectedStation: string | null
    onSelectStation: (id: string | null) => void
    markers: Array<{ id: string; label: string }>
    isSm?: boolean
  }) => {
    mockNearbyStationMap(props)
    return (
      <div>
        <div>{props.extraControls}</div>
        <div data-testid="nearby-stop-map" />
      </div>
    )
  },
}))

vi.mock('~/components/common/MapSidebarLayout', () => ({
  MapSidebarLayout: ({
    isSidebarOpened,
    panel,
    children,
  }: {
    isSidebarOpened: boolean
    panel: React.ReactNode
    children: React.ReactNode
  }) => (
    <div>
      <div data-testid="nearby-sidebar-state">
        {isSidebarOpened ? 'opened' : 'closed'}
      </div>
      <div>{panel}</div>
      <div>{children}</div>
    </div>
  ),
}))

const nearbyStopsData = [
  {
    StopUID: 'stop-1',
    AuthorityID: '005',
    StationID: 'station-1',
    StationGroupID: 'group-1',
    StopID: 'stop-id-1',
    StopName: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
    GeoHash: 'wsqqefdz0',
    City: CityNameType.TAIPEI,
    StopAddress: 'Address 1',
    Bearing: BearingType.NORTH,
    StopDescription: null,
    UpdateTime: '2026-03-15T21:52:45+08:00',
    VersionID: 1,
    position: [121.5654, 25.033],
  },
  {
    StopUID: 'stop-2',
    AuthorityID: '005',
    StationID: 'station-1',
    StationGroupID: 'group-1',
    StopID: 'stop-id-2',
    StopName: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
    GeoHash: 'wsqqefcw6',
    City: CityNameType.TAIPEI,
    StopAddress: 'Address 2',
    Bearing: BearingType.SOUTH,
    StopDescription: null,
    UpdateTime: '2026-03-15T21:52:45+08:00',
    VersionID: 1,
    position: [121.567, 25.034],
  },
  {
    StopUID: 'stop-3',
    AuthorityID: '005',
    StationID: 'station-2',
    StationGroupID: 'group-2',
    StopID: 'stop-id-3',
    StopName: {
      'zh-TW': '台北車站',
      en: 'Taipei Main Station',
      ja: '',
      ko: '',
    },
    GeoHash: 'wsqqeepb5',
    City: CityNameType.TAIPEI,
    StopAddress: 'Address 3',
    Bearing: BearingType.EAST,
    StopDescription: null,
    UpdateTime: '2026-03-15T21:52:45+08:00',
    VersionID: 1,
    position: [121.568, 25.035],
  },
]

const stopOfRoutesData = [
  {
    RouteUID: 'route-1',
    RouteID: '1',
    RouteName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
    SubRouteUID: 'subroute-1',
    SubRouteID: '1',
    City: CityNameType.TAIPEI,
    SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
    Direction: 0,
    Stops: [
      {
        StopUID: 'stop-1',
        StopID: 'stop-id-1',
        StationID: 'station-1',
        StopSequence: 1,
        StopName: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
      },
    ],
  },
  {
    RouteUID: 'route-2',
    RouteID: '2',
    RouteName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
    SubRouteUID: 'subroute-2',
    SubRouteID: '2',
    City: CityNameType.NEW_TAIPEI,
    SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
    Direction: 1,
    Stops: [
      {
        StopUID: 'stop-2',
        StopID: 'stop-id-2',
        StationID: 'station-1',
        StopSequence: 2,
        StopName: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
      },
    ],
  },
]

const routesData = [
  {
    RouteUID: 'route-1',
    RouteID: '1',
    HasSubRoutes: true,
    Operators: [],
    AuthorityID: '005',
    ProviderID: 'provider-1',
    RouteName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
    DepartureStopName: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
    DestinationStopName: {
      'zh-TW': '捷運昆陽站',
      en: 'MRT Kunyang Station',
      ja: '',
      ko: '',
    },
    TicketPriceDescription: { 'zh-TW': '', en: '', ja: '', ko: '' },
    FareBufferZoneDescription: { 'zh-TW': '', en: '', ja: '', ko: '' },
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
        SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
        Direction: 0,
        FirstBusTime: '',
        LastBusTime: '',
        HolidayFirstBusTime: '',
        HolidayLastBusTime: '',
        DepartureStopName: {
          'zh-TW': '市政府',
          en: 'City Hall',
          ja: '',
          ko: '',
        },
        DestinationStopName: {
          'zh-TW': '捷運昆陽站',
          en: 'MRT Kunyang Station',
          ja: '',
          ko: '',
        },
      },
    ],
  },
  {
    RouteUID: 'route-2',
    RouteID: '2',
    HasSubRoutes: true,
    Operators: [],
    AuthorityID: '005',
    ProviderID: 'provider-2',
    RouteName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
    DepartureStopName: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
    DestinationStopName: {
      'zh-TW': '板橋公車站',
      en: 'Banqiao Bus Station',
      ja: '',
      ko: '',
    },
    TicketPriceDescription: { 'zh-TW': '', en: '', ja: '', ko: '' },
    FareBufferZoneDescription: { 'zh-TW': '', en: '', ja: '', ko: '' },
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
        SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
        Direction: 1,
        FirstBusTime: '',
        LastBusTime: '',
        HolidayFirstBusTime: '',
        HolidayLastBusTime: '',
        DepartureStopName: {
          'zh-TW': '市政府',
          en: 'City Hall',
          ja: '',
          ko: '',
        },
        DestinationStopName: {
          'zh-TW': '板橋公車站',
          en: 'Banqiao Bus Station',
          ja: '',
          ko: '',
        },
      },
    ],
  },
]

const nearbyApiStationsData: ApiStation[] = [
  {
    uuid: 'TPE-station-1',
    city: CityNameType.TAIPEI,
    name: { 'zh-TW': '市政府', en: 'City Hall' },
    address: { 'zh-TW': '市府路 1 號', en: '1 City Hall Road' },
    bearing: BearingType.NORTH,
    position: { latitude: 25.033, longitude: 121.5654 },
    distance_meters: 12,
    route_directions: [
      {
        direction: DirectionType.GO,
        routes: [
          {
            uuid: 'TPE-route-1',
            city: CityNameType.TAIPEI,
            name: { 'zh-TW': '藍 1', en: 'Blue 1' },
            departure: { 'zh-TW': '市政府', en: 'City Hall' },
            destination: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' },
          },
        ],
      },
    ],
  },
]

function resetNearbyMocks() {
  mockUseGetRoutesByAreaQuery.mockReset()
  mockUseGetStopsByNearbyAreaQuery.mockReset()
  mockUseGetStopOfRoutesByAreaQuery.mockReset()
  mockUseGetNearbyStationsQuery.mockReset()
  mockIsDatabaseApiEnabled.mockReset()
  mockNearbyStationMap.mockReset()
}

function renderNearby({
  initialEntry = '/nearby',
  coords = null,
  geolocationError = null,
  permission = GeoPermissionType.PROMPT,
  queryState,
  routesQueryState,
  stopOfRoutesQueryState,
  apiStationsQueryState,
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
    error?: unknown
    isError?: boolean
    isLoading?: boolean
  }
  stopOfRoutesQueryState?: {
    data?: unknown[]
    error?: unknown
    isError?: boolean
    isLoading?: boolean
  }
  apiStationsQueryState?: {
    data?: ApiStation[]
    error?: unknown
    isLoading?: boolean
    isSuccess?: boolean
  }
} = {}) {
  const store = createTestStore({
    reducer: {
      geolocation: (
        state = {
          coords,
          error: geolocationError,
          permission,
          watching: false,
        },
      ) => state,
      cityGeo: (
        state = {
          geojson: null,
          loading: false,
          error: null,
        },
      ) => state,
    },
  })

  mockUseGetStopsByNearbyAreaQuery.mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
    isSuccess: false,
    ...queryState,
  })
  mockUseGetRoutesByAreaQuery.mockReturnValue({
    data: routesData,
    error: null,
    isError: false,
    isLoading: false,
    ...routesQueryState,
  })
  mockUseGetStopOfRoutesByAreaQuery.mockReturnValue({
    data: stopOfRoutesData,
    error: null,
    isError: false,
    isLoading: false,
    ...stopOfRoutesQueryState,
  })
  mockUseGetNearbyStationsQuery.mockReturnValue({
    data: [],
    error: null,
    isLoading: false,
    isSuccess: false,
    ...apiStationsQueryState,
  })

  return renderWithProvidersAndRouter(<Nearby />, {
    store,
    initialEntries: [initialEntry],
  })
}

describe('Nearby', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(window, 'open').mockImplementation(() => null)
    mockMatchMedia()

    resetNearbyMocks()
    mockIsDatabaseApiEnabled.mockReturnValue(false)
  })

  it('shows a denied-location message when geolocation permission is denied', () => {
    renderNearby({
      permission: GeoPermissionType.DENIED,
    })

    expect(
      screen.getByText(
        getGeoPermissionMessages(i18n.t)[GeoPermissionType.DENIED]!.title,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        getGeoPermissionMessages(i18n.t)[GeoPermissionType.DENIED]!.description,
      ),
    ).toBeInTheDocument()
  })

  it('opens the drawer by default on small screens', () => {
    mockMatchMedia({
      matches: (query) => query.includes(themeBreakpointsSmMaxWidth()),
    })

    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isLoading: false,
        error: null,
        isSuccess: true,
      },
    })

    expect(screen.getByTestId('nearby-sidebar-state')).toHaveTextContent(
      'opened',
    )
  })

  it('shows stop skeletons while waiting for coordinates', () => {
    renderNearby()

    expect(screen.getByTestId('nearby-stops-skeleton')).toBeInTheDocument()
  })

  it('shows a geolocation error message when the position is unavailable', () => {
    renderNearby({
      geolocationError: GeoErrorType.POSITION_UNAVAILABLE,
    })

    expect(
      screen.getByText(
        getGeoErrorMessages(i18n.t)[GeoErrorType.POSITION_UNAVAILABLE].title,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        getGeoErrorMessages(i18n.t)[GeoErrorType.POSITION_UNAVAILABLE]
          .description,
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId('nearby-stops-skeleton'),
    ).not.toBeInTheDocument()
  })

  it('shows stop skeletons after coordinates are available and nearby stops are loading', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        isLoading: true,
      },
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
        error: new Error('network error'),
      },
    })

    expect(
      screen.getByText(getNearbyMessages(i18n.t).loadStopsError.title),
    ).toBeInTheDocument()
    expect(
      screen.getByText(getNearbyMessages(i18n.t).loadStopsError.description),
    ).toBeInTheDocument()
  })

  it('shows an empty-state message when no nearby stops are found', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: [],
        isSuccess: true,
      },
    })

    expect(
      screen.getByText(getNearbyMessages(i18n.t).emptyStops.title),
    ).toBeInTheDocument()
    expect(
      screen.getByText(getNearbyMessages(i18n.t).emptyStops.description),
    ).toBeInTheDocument()
  })

  it('loads nearby stops with bounded area query params once coords are available', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true,
      },
    })

    expect(mockUseGetStopsByNearbyAreaQuery).toHaveBeenLastCalledWith(
      {
        area: AreaType.TAIPEI,
        coords: [25.033, 121.5654],
      },
      {
        skip: false,
      },
    )
  })

  it('uses the local stations API when local API mode is enabled', () => {
    mockIsDatabaseApiEnabled.mockReturnValue(true)

    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      apiStationsQueryState: {
        data: nearbyApiStationsData,
        isSuccess: true,
      },
    })

    expect(mockUseGetNearbyStationsQuery).toHaveBeenLastCalledWith(
      {
        latitude: 25.033,
        longitude: 121.5654,
        radius_meters: 500,
      },
      { skip: false },
    )
    expect(mockUseGetStopsByNearbyAreaQuery).toHaveBeenLastCalledWith(
      expect.anything(),
      { skip: true },
    )
    expect(screen.getByRole('button', { name: /^市政府/ })).toBeInTheDocument()
  })

  it('loads stop-of-route data when a stop is selected, but delays route detail data until viewing routes', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true,
      },
    })

    expect(mockUseGetRoutesByAreaQuery).toHaveBeenLastCalledWith(
      expect.anything(),
      {
        skip: true,
      },
    )
    expect(mockUseGetStopOfRoutesByAreaQuery).toHaveBeenLastCalledWith(
      {
        area: AreaType.TAIPEI,
        stopUIDs: ['stop-1', 'stop-2', 'stop-3'],
      },
      {
        skip: true,
      },
    )

    fireEvent.click(screen.getByRole('button', { name: /^市政府/ }))

    expect(mockUseGetRoutesByAreaQuery).toHaveBeenLastCalledWith(
      expect.anything(),
      {
        skip: true,
      },
    )
    expect(mockUseGetStopOfRoutesByAreaQuery).toHaveBeenLastCalledWith(
      {
        area: AreaType.TAIPEI,
        stopUIDs: ['stop-1', 'stop-2', 'stop-3'],
      },
      {
        skip: false,
      },
    )

    renderNearby({
      initialEntry: '/nearby?stop=station-1&routeStop=station-1',
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true,
      },
    })

    expect(mockUseGetRoutesByAreaQuery).toHaveBeenLastCalledWith(
      expect.anything(),
      {
        skip: false,
      },
    )
  })

  it('shows route skeletons while nearby station routes are loading', () => {
    renderNearby({
      initialEntry: '/nearby?stop=station-1&routeStop=station-1',
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true,
      },
      routesQueryState: {
        data: [],
        isLoading: true,
      },
      stopOfRoutesQueryState: {
        data: [],
        isLoading: true,
      },
    })

    expect(
      screen.getByTestId('nearby-stop-routes-skeleton'),
    ).toBeInTheDocument()
  })

  it('shows a nearby route rate-limit message instead of the empty state for 429 responses', () => {
    renderNearby({
      initialEntry: '/nearby?stop=station-1&routeStop=station-1',
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true,
      },
      stopOfRoutesQueryState: {
        data: [],
        error: { status: 429 },
        isError: true,
      },
      routesQueryState: {
        data: [],
        error: { status: 429 },
        isError: true,
      },
    })

    expect(
      screen.getByText('目前查詢路線的人太多，請稍後再試'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('目前沒有可顯示的路線資訊'),
    ).not.toBeInTheDocument()
  })

  it('sets the first available nearby route tab as active once route data is ready', () => {
    renderNearby({
      initialEntry: '/nearby?stop=station-1&routeStop=station-1',
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true,
      },
    })

    expect(screen.getByRole('tab', { name: '去程' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: '返程' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('renders a navigation button in the selected nearby stop route detail and opens Google Maps directions', () => {
    renderNearby({
      initialEntry: '/nearby?stop=station-1&routeStop=station-1',
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true,
      },
    })

    fireEvent.click(screen.getByRole('button', { name: /導航至\s*市政府/ }))

    expect(window.open).toHaveBeenCalledWith(
      'https://www.google.com/maps/dir/?api=1&destination=25.033%2C121.5654',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('syncs selected stop from the map back to the list state', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true,
      },
    })

    const firstRenderProps = mockNearbyStationMap.mock.calls.at(-1)?.[0]
    expect(firstRenderProps?.selectedStation).toBeNull()

    act(() => {
      firstRenderProps?.onSelectStation('station-1')
    })

    const updatedProps = mockNearbyStationMap.mock.calls.at(-1)?.[0]
    expect(updatedProps?.selectedStation).toBe('station-1')
  })

  it('syncs selected stop from the list back to the map props', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true,
      },
    })

    fireEvent.click(screen.getByRole('button', { name: /^市政府/ }))

    const updatedProps = mockNearbyStationMap.mock.calls.at(-1)?.[0]
    expect(updatedProps?.selectedStation).toBe('station-1')
  })

  it('expands the matching list item when the map selects a stop', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        data: nearbyStopsData,
        isSuccess: true,
      },
    })

    const firstRenderProps = mockNearbyStationMap.mock.calls.at(-1)?.[0]

    act(() => {
      firstRenderProps?.onSelectStation('station-1')
    })

    expect(screen.getByRole('button', { name: /^市政府/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })
})

function themeBreakpointsSmMaxWidth() {
  return '48em'
}
