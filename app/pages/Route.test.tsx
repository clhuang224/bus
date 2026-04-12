// @vitest-environment jsdom

import { fireEvent, screen, waitFor } from '@testing-library/react'
import type { Reducer, UnknownAction } from '@reduxjs/toolkit'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '~/modules/i18n'
import { getRouteRealtimeMessages } from '~/modules/consts/routeRealtimeMessages'
import { AppLocaleType } from '~/modules/enums/AppLocaleType'
import { CityNameType } from '~/modules/enums/CityNameType'
import { DirectionType } from '~/modules/enums/DirectionType'
import { StopStatusType } from '~/modules/enums/StopStatusType'
import { VehicleStateType } from '~/modules/enums/VehicleStateType'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'
import geoSlice from '~/modules/slices/geoSlice'
import { ROUTE_SEARCH_RECENT_STORAGE_KEY } from '~/modules/utils/routes/routeSearchRecentStorage'
import { createTestStore } from '~/test/createTestStore'
import { mockMatchMedia } from '~/test/mockMatchMedia'
import { renderRoute } from '~/test/render'
import Route from './Route'

const t = i18n.getFixedT(AppLocaleType.ZH_TW)
const fourMinutesAwayLabel = t('routePage.realtime.minutesAway', { count: 4 })
const noEstimateLabel = t('routePage.realtime.noEstimate')
const routeRealtimeMessages = getRouteRealtimeMessages(t)

const {
  mockToggleFavoriteRouteStop,
  mockUseGetEstimatedArrivalByRouteQuery,
  mockUseGetRealtimeByFrequencyByRouteQuery,
  mockUseGetRealtimeNearStopsByRouteQuery,
  mockUseGetRouteShapesByRouteQuery,
  mockUseGetRoutesByCityQuery,
  mockUseGetStopOfRoutesByCityQuery,
  mockUseGetStopsByCityQuery,
  mockRouteMap,
  mockRouteMapFlyTo
} = vi.hoisted(() => ({
  mockToggleFavoriteRouteStop: vi.fn(),
  mockUseGetEstimatedArrivalByRouteQuery: vi.fn(),
  mockUseGetRealtimeByFrequencyByRouteQuery: vi.fn(),
  mockUseGetRealtimeNearStopsByRouteQuery: vi.fn(),
  mockUseGetRouteShapesByRouteQuery: vi.fn(),
  mockUseGetRoutesByCityQuery: vi.fn(),
  mockUseGetStopOfRoutesByCityQuery: vi.fn(),
  mockUseGetStopsByCityQuery: vi.fn(),
  mockRouteMapFlyTo: vi.fn(),
  mockRouteMap: vi.fn(({ onMapLoad }: { onMapLoad?: (map: { flyTo: typeof mockRouteMapFlyTo }) => void }) => {
    useEffect(() => {
      onMapLoad?.({
        flyTo: mockRouteMapFlyTo
      })
    }, [onMapLoad])

    return <div>route-map</div>
  })
}))

vi.mock('~/components/common/MapSidebarLayout', () => ({
  MapSidebarLayout: ({
    isSidebarOpened,
    mapControls,
    panel,
    children
  }: {
    isSidebarOpened: boolean
    mapControls?: React.ReactNode
    panel: React.ReactNode
    children: React.ReactNode
  }) => (
    <div>
      <div data-testid="route-sidebar-state">{isSidebarOpened ? 'opened' : 'closed'}</div>
      <div>{mapControls}</div>
      <div>{panel}</div>
      <div>{children}</div>
    </div>
  )
}))

vi.mock('~/modules/apis/bus', () => ({
  busApi: {
    useGetEstimatedArrivalByRouteQuery: mockUseGetEstimatedArrivalByRouteQuery,
    useGetRealtimeByFrequencyByRouteQuery: mockUseGetRealtimeByFrequencyByRouteQuery,
    useGetRealtimeNearStopsByRouteQuery: mockUseGetRealtimeNearStopsByRouteQuery,
    useGetRouteShapesByRouteQuery: mockUseGetRouteShapesByRouteQuery,
    useGetRoutesByCityQuery: mockUseGetRoutesByCityQuery,
    useGetStopOfRoutesByCityQuery: mockUseGetStopOfRoutesByCityQuery,
    useGetStopsByCityQuery: mockUseGetStopsByCityQuery
  }
}))

vi.mock('~/components/routes/RouteMap', () => ({
  RouteMap: mockRouteMap
}))

vi.mock('~/components/common/AppBadge', () => ({
  AppBadge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>
}))

vi.mock('~/modules/hooks/useFavoriteRouteStops', () => ({
  useFavoriteRouteStops: () => ({
    isFavoriteRouteStop: () => false,
    toggleFavoriteRouteStop: mockToggleFavoriteRouteStop
  })
}))

const routeData = [
  {
    RouteUID: 'route-1',
    RouteID: 'route-1',
    HasSubRoutes: true,
    Operators: [],
    AuthorityID: '005',
    ProviderID: 'provider-1',
    SubRoutes: [
      {
        SubRouteUID: 'subroute-0',
        SubRouteID: 'subroute-0',
        OperatorIDs: [],
        SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
        Direction: DirectionType.GO,
        FirstBusTime: '06:00',
        LastBusTime: '22:00',
        HolidayFirstBusTime: '06:00',
        HolidayLastBusTime: '22:00',
        DepartureStopName: { 'zh-TW': '市政府', en: 'City Hall' },
        DestinationStopName: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' }
      },
      {
        SubRouteUID: 'subroute-1',
        SubRouteID: 'subroute-1',
        OperatorIDs: [],
        SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
        Direction: DirectionType.RETURN,
        FirstBusTime: '06:00',
        LastBusTime: '22:00',
        HolidayFirstBusTime: '06:00',
        HolidayLastBusTime: '22:00',
        DepartureStopName: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' },
        DestinationStopName: { 'zh-TW': '市政府', en: 'City Hall' }
      }
    ],
    BusRouteType: 0,
    RouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
    DepartureStopName: { 'zh-TW': '市政府', en: 'City Hall' },
    DestinationStopName: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' },
    TicketPriceDescription: { 'zh-TW': '', en: '' },
    FareBufferZoneDescription: { 'zh-TW': '', en: '' },
    RouteMapImageUrl: '',
    City: CityNameType.TAIPEI,
    CityCode: 'TPE',
    UpdateTime: '2026-03-19T10:00:00+08:00',
    VersionID: 1
  }
]

const stopOfRoutesData = [
  {
    RouteUID: 'route-1',
    RouteID: 'route-1',
    RouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
    SubRouteUID: 'subroute-0',
    SubRouteID: 'subroute-0',
    SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
    Direction: DirectionType.GO,
    City: CityNameType.TAIPEI,
    Stops: [
      {
        StopUID: 'stop-a',
        StopID: 'stop-a',
        StopName: { 'zh-TW': '市政府', en: 'City Hall' },
        StopSequence: 1,
        StationID: 'station-a'
      }
    ]
  },
  {
    RouteUID: 'route-1',
    RouteID: 'route-1',
    RouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
    SubRouteUID: 'subroute-1',
    SubRouteID: 'subroute-1',
    SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
    Direction: DirectionType.RETURN,
    City: CityNameType.TAIPEI,
    Stops: [
      {
        StopUID: 'stop-b',
        StopID: 'stop-b',
        StopName: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' },
        StopSequence: 1,
        StationID: 'station-b'
      },
      {
        StopUID: 'stop-c',
        StopID: 'stop-c',
        StopName: { 'zh-TW': '市政府', en: 'City Hall' },
        StopSequence: 2,
        StationID: 'station-c'
      }
    ]
  }
]

const stopsByCityData = [
  {
    StopUID: 'stop-b',
    StopID: 'stop-b',
    StopName: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' },
    position: [121.6, 25.05] as [number, number]
  },
  {
    StopUID: 'stop-c',
    StopID: 'stop-c',
    StopName: { 'zh-TW': '市政府', en: 'City Hall' },
    position: [121.56, 25.04] as [number, number]
  }
]

const estimatedArrivalsData = [
  {
    PlateNumb: 'ABC-123',
    StopUID: 'stop-c',
    StopID: 'stop-c',
    StopName: { 'zh-TW': '市政府', en: 'City Hall' },
    RouteUID: 'route-1',
    RouteID: 'route-1',
    RouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
    SubRouteUID: 'subroute-1',
    SubRouteID: 'subroute-1',
    SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
    Direction: DirectionType.RETURN,
    StopSequence: 2,
    EstimateTime: 181,
    StopStatus: StopStatusType.NORMAL,
    MessageType: 0,
    UpdateTime: '2026-03-19T10:00:00+08:00',
    City: CityNameType.TAIPEI
  }
]

const realtimeNearStopsData = [
  {
    PlateNumb: 'ABC-123',
    OperatorID: 'operator-1',
    RouteUID: 'route-1',
    RouteID: 'route-1',
    RouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
    SubRouteUID: 'subroute-1',
    SubRouteID: 'subroute-1',
    SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
    Direction: DirectionType.RETURN,
    StopUID: 'stop-c',
    StopID: 'stop-c',
    StopName: { 'zh-TW': '市政府', en: 'City Hall' },
    StopSequence: 2,
    DutyStatus: 0,
    BusStatus: 0,
    vehicleState: VehicleStateType.DEPARTED,
    GPSTime: '2026-03-19T10:00:00+08:00',
    SrcUpdateTime: '2026-03-19T10:00:00+08:00',
    UpdateTime: '2026-03-19T10:00:00+08:00',
    position: [121.56, 25.04] as [number, number],
    City: CityNameType.TAIPEI
  }
]

const realtimeByFrequencyData = [
  {
    PlateNumb: 'ABC-123',
    OperatorID: 'operator-1',
    OperatorNo: null,
    RouteUID: 'route-1',
    RouteID: 'route-1',
    RouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
    SubRouteUID: 'subroute-1',
    SubRouteID: 'subroute-1',
    SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
    Direction: DirectionType.RETURN,
    Speed: null,
    Azimuth: null,
    DutyStatus: 0,
    BusStatus: 0,
    MessageType: 0,
    GPSTime: '2026-03-19T10:00:00+08:00',
    TransTime: null,
    SrcRecTime: null,
    SrcTransTime: null,
    SrcUpdateTime: '2026-03-19T10:00:00+08:00',
    UpdateTime: '2026-03-19T10:00:00+08:00',
    position: [121.58, 25.045] as [number, number],
    City: CityNameType.TAIPEI
  }
]

const targetFavoriteRouteStop: FavoriteRouteStop = {
  favoriteId: 'route-1-subroute-1-1-station-c',
  city: CityNameType.TAIPEI,
  routeUID: 'route-1',
  routeName: { 'zh-TW': '藍1', en: 'Blue 1' },
  subRouteUID: 'subroute-1',
  subRouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
  direction: DirectionType.RETURN,
  stopUID: 'stop-c',
  stopID: 'stop-c',
  stationID: 'station-c',
  stationKey: 'station-c',
  stopName: { 'zh-TW': '市政府', en: 'City Hall' },
  stopSequence: 2,
  departure: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' },
  destination: { 'zh-TW': '市政府', en: 'City Hall' }
}

function resetRouteMocks() {
  mockToggleFavoriteRouteStop.mockReset()
  mockUseGetEstimatedArrivalByRouteQuery.mockReset()
  mockUseGetRealtimeByFrequencyByRouteQuery.mockReset()
  mockUseGetRealtimeNearStopsByRouteQuery.mockReset()
  mockUseGetRouteShapesByRouteQuery.mockReset()
  mockUseGetRoutesByCityQuery.mockReset()
  mockUseGetStopOfRoutesByCityQuery.mockReset()
  mockUseGetStopsByCityQuery.mockReset()
  mockRouteMap.mockClear()
}

function mockDefaultRouteQueries() {
  mockUseGetRoutesByCityQuery.mockReturnValue({
    data: routeData,
    isLoading: false,
    error: null
  })

  mockUseGetStopOfRoutesByCityQuery.mockReturnValue({
    data: stopOfRoutesData,
    isLoading: false,
    error: null
  })

  mockUseGetStopsByCityQuery.mockReturnValue({
    data: stopsByCityData,
    isLoading: false,
    error: null
  })

  mockUseGetEstimatedArrivalByRouteQuery.mockReturnValue({
    data: estimatedArrivalsData,
    isError: false,
    isLoading: false,
    error: null
  })

  mockUseGetRealtimeNearStopsByRouteQuery.mockReturnValue({
    data: realtimeNearStopsData,
    isError: false,
    isLoading: false,
    error: null
  })

  mockUseGetRealtimeByFrequencyByRouteQuery.mockReturnValue({
    data: realtimeByFrequencyData,
    isError: false,
    isLoading: false,
    error: null
  })

  mockUseGetRouteShapesByRouteQuery.mockReturnValue({
    data: [],
    isLoading: false,
    error: null
  })
}

function renderRoutePage(
  initialEntries: Array<string | { pathname: string, state?: unknown }> = ['/routes/Taipei/route-1'],
  coords: [number, number] | null = null
) {
  const store = createTestStore({
    reducer: {
      geolocation: geoSlice.reducer as unknown as Reducer<unknown, UnknownAction>
    },
    preloadedState: {
      geolocation: {
        coords
      }
    }
  })

  return renderRoute(<Route />, {
    path: '/routes/:city/:id',
    initialEntries,
    store
  })
}

describe('Route', () => {
  beforeEach(() => {
    localStorage.clear()
    mockMatchMedia()
    mockRouteMapFlyTo.mockReset()

    resetRouteMocks()
    mockDefaultRouteQueries()
  })

  it('moves the opened route to the front of recently viewed routes', async () => {
    localStorage.setItem(ROUTE_SEARCH_RECENT_STORAGE_KEY, JSON.stringify(['route-2', 'route-1']))

    renderRoutePage()

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(ROUTE_SEARCH_RECENT_STORAGE_KEY) ?? '[]')).toEqual(['route-1', 'route-2'])
    })
  })

  it('disables the focus-my-location control when user coordinates are unavailable', () => {
    renderRoutePage()

    expect(screen.getByRole('button', { name: '我的位置' })).toBeDisabled()
  })

  it('focuses the map on the user location when the control is clicked', () => {
    renderRoutePage(['/routes/Taipei/route-1'], [25.033, 121.5654])

    fireEvent.click(screen.getByRole('button', { name: '我的位置' }))

    expect(mockRouteMapFlyTo).toHaveBeenCalledWith({
      center: [121.5654, 25.033],
      zoom: 16,
      duration: 800
    })
  })

  it('highlights the saved favorite stop after opening the route page from favorites', async () => {
    renderRoutePage([{
      pathname: '/routes/Taipei/route-1',
      state: { favoriteRouteStop: targetFavoriteRouteStop }
    }])

    await waitFor(() => {
      expect(screen.getByText('市政府').closest('[data-highlighted="true"]')).toBeInTheDocument()
      expect(screen.getByText(fourMinutesAwayLabel)).toBeInTheDocument()
    })
  })

  it('keeps the back button visible while base route data is loading', () => {
    mockUseGetRoutesByCityQuery.mockReturnValue({
      data: [],
      isLoading: true,
      error: null
    })
    mockUseGetStopOfRoutesByCityQuery.mockReturnValue({
      data: [],
      isLoading: true,
      error: null
    })
    mockUseGetStopsByCityQuery.mockReturnValue({
      data: [],
      isLoading: true,
      error: null
    })

    renderRoutePage()

    expect(screen.getByLabelText(i18n.t('routePage.backToRoutes'))).toBeInTheDocument()
    expect(screen.queryByText('藍1')).not.toBeInTheDocument()
    expect(screen.queryByText('載入中')).not.toBeInTheDocument()
  })

  it('renders available terminal text when only one terminal name is present', () => {
    mockUseGetRoutesByCityQuery.mockReturnValue({
      data: [{
        ...routeData[0],
        DepartureStopName: { 'zh-TW': '市政府', en: 'City Hall' },
        DestinationStopName: { 'zh-TW': '', en: '' }
      }],
      isLoading: false,
      error: null
    })

    renderRoutePage()

    expect(
      screen.getByText((content, element) => content === '市政府' && element?.getAttribute('data-size') === 'sm')
    ).toBeInTheDocument()
    expect(screen.queryByText('市政府 -')).not.toBeInTheDocument()
  })

  it('shows an inline warning when realtime queries are rate limited', async () => {
    mockUseGetEstimatedArrivalByRouteQuery.mockReturnValue({
      data: [],
      isError: true,
      isLoading: false,
      error: {
        status: 429,
        data: {}
      }
    })

    mockUseGetRealtimeNearStopsByRouteQuery.mockReturnValue({
      data: [],
      isError: true,
      isLoading: false,
      error: {
        status: 429,
        data: {}
      }
    })

    renderRoutePage()

    await waitFor(() => {
      expect(screen.getByText(routeRealtimeMessages.rateLimited.description)).toBeInTheDocument()
    })
  })

  it('shows an ambiguous realtime notice when ETA data succeeds but realtime vehicle data is unavailable', async () => {
    mockUseGetEstimatedArrivalByRouteQuery.mockReturnValue({
      data: estimatedArrivalsData,
      isError: false,
      isLoading: false,
      error: null
    })

    mockUseGetRealtimeNearStopsByRouteQuery.mockReturnValue({
      data: [],
      isError: true,
      isLoading: false,
      error: {
        status: 500,
        data: {}
      }
    })

    renderRoutePage()

    await waitFor(() => {
      expect(screen.queryByText(routeRealtimeMessages.error.description)).not.toBeInTheDocument()
      expect(screen.getByText(routeRealtimeMessages.noRealtimeData.description)).toBeInTheDocument()
    })
  })

  it('keeps stop ETA rendering available even when bus positions are unavailable', async () => {
    mockUseGetEstimatedArrivalByRouteQuery.mockReturnValue({
      data: estimatedArrivalsData,
      isError: false,
      isLoading: false,
      error: null
    })

    mockUseGetRealtimeNearStopsByRouteQuery.mockReturnValue({
      data: [{
        ...realtimeNearStopsData[0],
        position: null
      }],
      isError: false,
      isLoading: false,
      error: null
    })

    renderRoutePage()

    fireEvent.click(screen.getByRole('tab', { name: '返程' }))

    await waitFor(() => {
      expect(screen.getByText(fourMinutesAwayLabel)).toBeInTheDocument()
      expect(screen.queryByText(routeRealtimeMessages.noRealtimeData.description)).not.toBeInTheDocument()
    })
  })

  it('uses realtime by frequency positions for route map vehicles instead of near-stop positions', async () => {
    mockUseGetRealtimeNearStopsByRouteQuery.mockReturnValue({
      data: [{
        ...realtimeNearStopsData[0],
        position: null
      }],
      isError: false,
      isLoading: false,
      error: null
    })

    mockUseGetRealtimeByFrequencyByRouteQuery.mockReturnValue({
      data: realtimeByFrequencyData,
      isError: false,
      isLoading: false,
      error: null
    })

    renderRoutePage()

    fireEvent.click(screen.getByRole('tab', { name: '返程' }))

    await waitFor(() => {
      const latestCall = mockRouteMap.mock.calls[mockRouteMap.mock.calls.length - 1] as unknown as
        | [{ vehicles: unknown[] }]
        | undefined
      const latestRouteMapProps = latestCall?.[0]

      expect(latestRouteMapProps?.vehicles).toEqual([
        expect.objectContaining({
          plateNumb: 'ABC-123',
          position: [121.58, 25.045]
        })
      ])
    })
  })

  it('selects only the stop when choosing a stop title from the list', async () => {
    renderRoutePage()

    fireEvent.click(screen.getByRole('tab', { name: '返程' }))

    await waitFor(() => {
      expect(screen.getByText(fourMinutesAwayLabel)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('市政府'))

    await waitFor(() => {
      const latestCall = mockRouteMap.mock.calls[mockRouteMap.mock.calls.length - 1] as unknown as
        | [{ selectedStop: string | null, selectedVehicleId: string | null }]
        | undefined
      const latestRouteMapProps = latestCall?.[0]

      expect(latestRouteMapProps?.selectedStop).toBe('stop-c')
      expect(latestRouteMapProps?.selectedVehicleId).toBeNull()
    })
  })

  it('selects only the vehicle when clicking a realtime plate badge in the list', async () => {
    mockUseGetRealtimeNearStopsByRouteQuery.mockReturnValue({
      data: [{
        ...realtimeNearStopsData[0],
        StopUID: 'stop-b',
        StopID: 'stop-b',
        StopName: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' },
        StopSequence: 1
      }],
      isError: false,
      isLoading: false,
      error: null
    })

    renderRoutePage()

    fireEvent.click(screen.getByRole('tab', { name: '返程' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'ABC-123' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'ABC-123' }))

    await waitFor(() => {
      const latestCall = mockRouteMap.mock.calls[mockRouteMap.mock.calls.length - 1] as unknown as
        | [{ selectedStop: string | null, selectedVehicleId: string | null }]
        | undefined
      const latestRouteMapProps = latestCall?.[0]

      expect(latestRouteMapProps?.selectedStop).toBeNull()
      expect(latestRouteMapProps?.selectedVehicleId).toBe('ABC-123')
    })
  })

  it('selects only the vehicle in the list when clicking a vehicle marker on the map', async () => {
    renderRoutePage()

    fireEvent.click(screen.getByRole('tab', { name: '返程' }))

    await waitFor(() => {
      expect(mockRouteMap).toHaveBeenCalled()
    })

    const latestCall = mockRouteMap.mock.calls[mockRouteMap.mock.calls.length - 1] as unknown as
      | [{
        onSelectVehicle: (vehicleId: string) => void
        selectedStop: string | null
        selectedVehicleId: string | null
      }]
      | undefined

    latestCall?.[0].onSelectVehicle('ABC-123')

    await waitFor(() => {
      const updatedCall = mockRouteMap.mock.calls[mockRouteMap.mock.calls.length - 1] as unknown as
        | [{ selectedStop: string | null, selectedVehicleId: string | null }]
        | undefined
      const latestRouteMapProps = updatedCall?.[0]

      expect(latestRouteMapProps?.selectedStop).toBeNull()
      expect(latestRouteMapProps?.selectedVehicleId).toBe('ABC-123')
    })
  })

  it('uses route-level ETA data when subroute fields are omitted by upstream', async () => {
    mockUseGetEstimatedArrivalByRouteQuery.mockReturnValue({
      data: [{
        ...estimatedArrivalsData[0],
        RouteUID: 'route-1',
        SubRouteUID: 'route-1',
        SubRouteID: 'route-1',
        SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1' }
      }],
      isError: false,
      isLoading: false,
      error: null
    })

    mockUseGetRealtimeNearStopsByRouteQuery.mockReturnValue({
      data: realtimeNearStopsData,
      isError: false,
      isLoading: false,
      error: null
    })

    renderRoutePage()

    fireEvent.click(screen.getByRole('tab', { name: '返程' }))

    await waitFor(() => {
      expect(screen.getByText(fourMinutesAwayLabel)).toBeInTheDocument()
      expect(screen.queryByText(noEstimateLabel)).not.toBeInTheDocument()
    })
  })

  it('shows a non-operating notice when there are no active buses but the route is outside service hours', async () => {
    mockUseGetEstimatedArrivalByRouteQuery.mockReturnValue({
      data: [{
        ...estimatedArrivalsData[0],
        SubRouteUID: 'subroute-0',
        SubRouteID: 'subroute-0',
        Direction: DirectionType.GO,
        StopUID: 'stop-a',
        StopID: 'stop-a',
        StopName: { 'zh-TW': '市政府', en: 'City Hall' },
        StopSequence: 1,
        PlateNumb: undefined,
        EstimateTime: null,
        StopStatus: StopStatusType.LAST_BUS_PASSED
      }],
      isError: false,
      isLoading: false,
      error: null
    })

    mockUseGetRealtimeNearStopsByRouteQuery.mockReturnValue({
      data: [],
      isError: false,
      isLoading: false,
      error: null
    })

    renderRoutePage()

    await waitFor(() => {
      expect(screen.getByText(routeRealtimeMessages.noService.description)).toBeInTheDocument()
      expect(screen.queryByText(routeRealtimeMessages.error.description)).not.toBeInTheDocument()
      expect(screen.queryByText(routeRealtimeMessages.noRealtimeData.description)).not.toBeInTheDocument()
    })
  })

  it('opens the drawer by default on small screens', async () => {
    mockMatchMedia({
      matches: (query) => query.includes(themeBreakpointsSmMaxWidth())
    })

    renderRoutePage()

    await waitFor(() => {
      expect(
        screen.getAllByTestId('route-sidebar-state').some((element) => element.textContent === 'opened')
      ).toBe(true)
    })
  })
})

function themeBreakpointsSmMaxWidth() {
  return '48em'
}
