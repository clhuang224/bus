// @vitest-environment jsdom

import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routeRealtimeMessages } from '~/modules/consts/routeRealtimeMessages'
import { CityNameType } from '~/modules/enums/CityNameType'
import { DirectionType } from '~/modules/enums/DirectionType'
import { StopStatusType } from '~/modules/enums/StopStatusType'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'
import { renderRoute } from '~/test/render'
import Route from './Route'

const {
  mockToggleFavoriteRouteStop,
  mockUseGetEstimatedArrivalByRouteQuery,
  mockUseGetRealtimeNearStopsByRouteQuery,
  mockUseGetRouteShapesByRouteQuery,
  mockUseGetRoutesByCityQuery,
  mockUseGetStopOfRoutesByCityQuery,
  mockUseGetStopsByCityQuery
} = vi.hoisted(() => ({
  mockToggleFavoriteRouteStop: vi.fn(),
  mockUseGetEstimatedArrivalByRouteQuery: vi.fn(),
  mockUseGetRealtimeNearStopsByRouteQuery: vi.fn(),
  mockUseGetRouteShapesByRouteQuery: vi.fn(),
  mockUseGetRoutesByCityQuery: vi.fn(),
  mockUseGetStopOfRoutesByCityQuery: vi.fn(),
  mockUseGetStopsByCityQuery: vi.fn()
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
      <div data-testid="route-sidebar-state">{isSidebarOpened ? 'opened' : 'closed'}</div>
      <div>{panel}</div>
      <div>{children}</div>
    </div>
  )
}))

vi.mock('~/modules/apis/bus', () => ({
  busApi: {
    useGetEstimatedArrivalByRouteQuery: mockUseGetEstimatedArrivalByRouteQuery,
    useGetRealtimeNearStopsByRouteQuery: mockUseGetRealtimeNearStopsByRouteQuery,
    useGetRouteShapesByRouteQuery: mockUseGetRouteShapesByRouteQuery,
    useGetRoutesByCityQuery: mockUseGetRoutesByCityQuery,
    useGetStopOfRoutesByCityQuery: mockUseGetStopOfRoutesByCityQuery,
    useGetStopsByCityQuery: mockUseGetStopsByCityQuery
  }
}))

vi.mock('~/components/routes/RouteMap', () => ({
  RouteMap: () => <div>route-map</div>
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
        SubRouteName: { zh_TW: '藍1', en: 'Blue 1' },
        Direction: DirectionType.GO,
        FirstBusTime: '06:00',
        LastBusTime: '22:00',
        HolidayFirstBusTime: '06:00',
        HolidayLastBusTime: '22:00',
        DepartureStopName: { zh_TW: '市政府', en: 'City Hall' },
        DestinationStopName: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' }
      },
      {
        SubRouteUID: 'subroute-1',
        SubRouteID: 'subroute-1',
        OperatorIDs: [],
        SubRouteName: { zh_TW: '藍1', en: 'Blue 1' },
        Direction: DirectionType.RETURN,
        FirstBusTime: '06:00',
        LastBusTime: '22:00',
        HolidayFirstBusTime: '06:00',
        HolidayLastBusTime: '22:00',
        DepartureStopName: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' },
        DestinationStopName: { zh_TW: '市政府', en: 'City Hall' }
      }
    ],
    BusRouteType: 0,
    RouteName: { zh_TW: '藍1', en: 'Blue 1' },
    DepartureStopName: { zh_TW: '市政府', en: 'City Hall' },
    DestinationStopName: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' },
    TicketPriceDescription: { zh_TW: '', en: '' },
    FareBufferZoneDescription: { zh_TW: '', en: '' },
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
    RouteName: { zh_TW: '藍1', en: 'Blue 1' },
    SubRouteUID: 'subroute-0',
    SubRouteID: 'subroute-0',
    SubRouteName: { zh_TW: '藍1', en: 'Blue 1' },
    Direction: DirectionType.GO,
    City: CityNameType.TAIPEI,
    Stops: [
      {
        StopUID: 'stop-a',
        StopID: 'stop-a',
        StopName: { zh_TW: '市政府', en: 'City Hall' },
        StopSequence: 1,
        StationID: 'station-a'
      }
    ]
  },
  {
    RouteUID: 'route-1',
    RouteID: 'route-1',
    RouteName: { zh_TW: '藍1', en: 'Blue 1' },
    SubRouteUID: 'subroute-1',
    SubRouteID: 'subroute-1',
    SubRouteName: { zh_TW: '藍1', en: 'Blue 1' },
    Direction: DirectionType.RETURN,
    City: CityNameType.TAIPEI,
    Stops: [
      {
        StopUID: 'stop-b',
        StopID: 'stop-b',
        StopName: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' },
        StopSequence: 1,
        StationID: 'station-b'
      },
      {
        StopUID: 'stop-c',
        StopID: 'stop-c',
        StopName: { zh_TW: '市政府', en: 'City Hall' },
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
    StopName: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' },
    position: [121.6, 25.05] as [number, number]
  },
  {
    StopUID: 'stop-c',
    StopID: 'stop-c',
    StopName: { zh_TW: '市政府', en: 'City Hall' },
    position: [121.56, 25.04] as [number, number]
  }
]

const estimatedArrivalsData = [
  {
    PlateNumb: 'ABC-123',
    StopUID: 'stop-c',
    StopID: 'stop-c',
    StopName: { zh_TW: '市政府', en: 'City Hall' },
    RouteUID: 'route-1',
    RouteID: 'route-1',
    RouteName: { zh_TW: '藍1', en: 'Blue 1' },
    SubRouteUID: 'subroute-1',
    SubRouteID: 'subroute-1',
    SubRouteName: { zh_TW: '藍1', en: 'Blue 1' },
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
    RouteName: { zh_TW: '藍1', en: 'Blue 1' },
    SubRouteUID: 'subroute-1',
    SubRouteID: 'subroute-1',
    SubRouteName: { zh_TW: '藍1', en: 'Blue 1' },
    Direction: DirectionType.RETURN,
    StopUID: 'stop-c',
    StopID: 'stop-c',
    StopName: { zh_TW: '市政府', en: 'City Hall' },
    StopSequence: 2,
    DutyStatus: 0,
    BusStatus: 0,
    A2EventType: 0,
    GPSTime: '2026-03-19T10:00:00+08:00',
    SrcUpdateTime: '2026-03-19T10:00:00+08:00',
    UpdateTime: '2026-03-19T10:00:00+08:00',
    position: [121.56, 25.04] as [number, number],
    City: CityNameType.TAIPEI
  }
]

const targetFavoriteRouteStop: FavoriteRouteStop = {
  favoriteId: 'route-1-subroute-1-1-station-c',
  city: CityNameType.TAIPEI,
  routeUID: 'route-1',
  routeName: '藍1',
  subRouteUID: 'subroute-1',
  subRouteName: '藍1',
  direction: DirectionType.RETURN,
  stopUID: 'stop-c',
  stopID: 'stop-c',
  stationID: 'station-c',
  stationKey: 'station-c',
  stopName: '市政府',
  stopSequence: 2,
  departure: '捷運昆陽站',
  destination: '市政府'
}

function resetRouteMocks() {
  mockToggleFavoriteRouteStop.mockReset()
  mockUseGetEstimatedArrivalByRouteQuery.mockReset()
  mockUseGetRealtimeNearStopsByRouteQuery.mockReset()
  mockUseGetRouteShapesByRouteQuery.mockReset()
  mockUseGetRoutesByCityQuery.mockReset()
  mockUseGetStopOfRoutesByCityQuery.mockReset()
  mockUseGetStopsByCityQuery.mockReset()
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

  mockUseGetRouteShapesByRouteQuery.mockReturnValue({
    data: [],
    isLoading: false,
    error: null
  })
}

function renderRoutePage(
  initialEntries: Array<string | { pathname: string, state?: unknown }> = ['/routes/Taipei/route-1']
) {
  return renderRoute(<Route />, {
    path: '/routes/:city/:id',
    initialEntries
  })
}

describe('Route', () => {
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

    resetRouteMocks()
    mockDefaultRouteQueries()
  })

  it('highlights the saved favorite stop after opening the route page from favorites', async () => {
    renderRoutePage([{
      pathname: '/routes/Taipei/route-1',
      state: { favoriteRouteStop: targetFavoriteRouteStop }
    }])

    await waitFor(() => {
      expect(screen.getByText('市政府').closest('[data-highlighted="true"]')).toBeInTheDocument()
      expect(screen.getByText('ABC-123')).toBeInTheDocument()
      expect(screen.getByText('4 分後到站')).toBeInTheDocument()
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

    expect(screen.getByLabelText('返回路線列表')).toBeInTheDocument()
    expect(screen.queryByText('藍1')).not.toBeInTheDocument()
    expect(screen.queryByText('載入中')).not.toBeInTheDocument()
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

  it('shows realtime vehicle info in the list even when bus positions are unavailable', async () => {
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
      expect(screen.getByText('ABC-123')).toBeInTheDocument()
      expect(screen.getByText('4 分後到站')).toBeInTheDocument()
      expect(screen.queryByText(routeRealtimeMessages.noRealtimeData.description)).not.toBeInTheDocument()
    })
  })

  it('uses route-level ETA data when subroute fields are omitted by upstream', async () => {
    mockUseGetEstimatedArrivalByRouteQuery.mockReturnValue({
      data: [{
        ...estimatedArrivalsData[0],
        RouteUID: 'subroute-1',
        SubRouteUID: undefined,
        SubRouteID: undefined,
        SubRouteName: undefined
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
      expect(screen.getByText('ABC-123')).toBeInTheDocument()
      expect(screen.getByText('4 分後到站')).toBeInTheDocument()
      expect(screen.queryByText('暫無預估')).not.toBeInTheDocument()
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
        StopName: { zh_TW: '市政府', en: 'City Hall' },
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
