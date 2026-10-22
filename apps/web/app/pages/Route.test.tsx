// @vitest-environment jsdom

import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '~/modules/i18n'
import { getRouteRealtimeMessages } from '~/modules/consts/routeRealtimeMessages'
import {
  AppLocaleType,
  CityNameType,
  DirectionType,
  RealtimeArrivalStatus,
  RealtimeVehicleState,
  RouteRealtimeStatus,
  type ApiRouteRealtime,
  type ApiRouteRealtimeSubRoute,
  type ApiRouteRealtimeVehicle,
} from '@bus/shared'
import type { BusRoute } from '~/modules/interfaces/BusRoute'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'
import type { Stop } from '~/modules/interfaces/Stop'
import type { StopOfRoute } from '~/modules/interfaces/StopOfRoute'
import geoSlice from '~/modules/slices/geoSlice'
import { toRouteDetailFromTdx } from '~/modules/utils/route/toRouteDetail'
import { ROUTE_SEARCH_RECENT_STORAGE_KEY } from '~/modules/utils/routes/routeSearchRecentStorage'
import { createTestStore } from '~/test/createTestStore'
import { mockMatchMedia } from '~/test/mockMatchMedia'
import { renderRoute } from '~/test/render'
import Route from './Route'

const t = i18n.getFixedT(AppLocaleType.ZH_TW)
const fourMinutesAwayLabel = t('routePage.realtime.minutesAway', { count: 4 })
const navigateToCityHallLabel = t(
  'components.routeStopList.navigateAriaLabel',
  { stopName: '市政府' },
)
const routeRealtimeMessages = getRouteRealtimeMessages(t)

const {
  mockToggleFavoriteRouteStop,
  mockUseGetRouteDetailQuery,
  mockUseGetRouteRealtimeQuery,
  mockRouteMap,
} = vi.hoisted(() => ({
  mockToggleFavoriteRouteStop: vi.fn(),
  mockUseGetRouteDetailQuery: vi.fn(),
  mockUseGetRouteRealtimeQuery: vi.fn(),
  mockRouteMap: vi.fn(
    ({ extraControls }: { extraControls?: React.ReactNode }) => {
      return (
        <div>
          <div>{extraControls}</div>
          <div>route-map</div>
        </div>
      )
    },
  ),
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
      <div data-testid="route-sidebar-state">
        {isSidebarOpened ? 'opened' : 'closed'}
      </div>
      <div>{panel}</div>
      <div>{children}</div>
    </div>
  ),
}))

vi.mock('~/modules/apis/transit', () => ({
  transitApi: {
    useGetRouteDetailQuery: mockUseGetRouteDetailQuery,
    useGetRouteRealtimeQuery: mockUseGetRouteRealtimeQuery,
  },
}))

vi.mock('~/components/route/RouteMap', () => ({
  RouteMap: mockRouteMap,
}))

vi.mock('~/components/common/AppBadge', () => ({
  AppBadge: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}))

vi.mock('~/modules/hooks/favorite/useFavoriteRouteStops', () => ({
  useFavoriteRouteStops: () => ({
    isFavoriteRouteStop: () => false,
    toggleFavoriteRouteStop: mockToggleFavoriteRouteStop,
  }),
}))

const routeData: BusRoute<string>[] = [
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
        SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
        Direction: DirectionType.GO,
        FirstBusTime: '06:00',
        LastBusTime: '22:00',
        HolidayFirstBusTime: '06:00',
        HolidayLastBusTime: '22:00',
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
      {
        SubRouteUID: 'subroute-1',
        SubRouteID: 'subroute-1',
        OperatorIDs: [],
        SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
        Direction: DirectionType.RETURN,
        FirstBusTime: '06:00',
        LastBusTime: '22:00',
        HolidayFirstBusTime: '06:00',
        HolidayLastBusTime: '22:00',
        DepartureStopName: {
          'zh-TW': '捷運昆陽站',
          en: 'MRT Kunyang Station',
          ja: '',
          ko: '',
        },
        DestinationStopName: {
          'zh-TW': '市政府',
          en: 'City Hall',
          ja: '',
          ko: '',
        },
      },
    ],
    BusRouteType: 0,
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
    UpdateTime: '2026-03-19T10:00:00+08:00',
    VersionID: 1,
  },
]

const stopOfRoutesData: StopOfRoute[] = [
  {
    RouteUID: 'route-1',
    RouteID: 'route-1',
    RouteName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
    SubRouteUID: 'subroute-0',
    SubRouteID: 'subroute-0',
    SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
    Direction: DirectionType.GO,
    City: CityNameType.TAIPEI,
    Stops: [
      {
        StopUID: 'stop-a',
        StopID: 'stop-a',
        StopName: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
        StopSequence: 1,
        StationID: 'station-a',
      },
    ],
  },
  {
    RouteUID: 'route-1',
    RouteID: 'route-1',
    RouteName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
    SubRouteUID: 'subroute-1',
    SubRouteID: 'subroute-1',
    SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
    Direction: DirectionType.RETURN,
    City: CityNameType.TAIPEI,
    Stops: [
      {
        StopUID: 'stop-b',
        StopID: 'stop-b',
        StopName: {
          'zh-TW': '捷運昆陽站',
          en: 'MRT Kunyang Station',
          ja: '',
          ko: '',
        },
        StopSequence: 1,
        StationID: 'station-b',
      },
      {
        StopUID: 'stop-c',
        StopID: 'stop-c',
        StopName: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
        StopSequence: 2,
        StationID: 'station-c',
      },
    ],
  },
]

const stopsByCityData: Pick<
  Stop,
  'StopUID' | 'StopID' | 'StopName' | 'position'
>[] = [
  {
    StopUID: 'stop-a',
    StopID: 'stop-a',
    StopName: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
    position: [121.55, 25.03] as [number, number],
  },
  {
    StopUID: 'stop-b',
    StopID: 'stop-b',
    StopName: {
      'zh-TW': '捷運昆陽站',
      en: 'MRT Kunyang Station',
      ja: '',
      ko: '',
    },
    position: [121.6, 25.05] as [number, number],
  },
  {
    StopUID: 'stop-c',
    StopID: 'stop-c',
    StopName: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
    position: [121.56, 25.04] as [number, number],
  },
]

const cityHallVehicle: ApiRouteRealtimeVehicle = {
  plate_number: 'ABC-123',
  near_stop: {
    uuid: 'stop-c',
    sequence: 2,
    name: { 'zh-TW': '市政府', en: 'City Hall' },
  },
  state: RealtimeVehicleState.DEPARTED,
  arrival: { status: RealtimeArrivalStatus.MINUTES, minutes: 4 },
  position: { latitude: 25.045, longitude: 121.58 },
}

function routeRealtimeOf({
  go = {},
  back = {},
}: {
  go?: Partial<ApiRouteRealtimeSubRoute>
  back?: Partial<ApiRouteRealtimeSubRoute>
} = {}): ApiRouteRealtime {
  return {
    uuid: 'route-1',
    sub_routes: [
      {
        uuid: 'subroute-0-0',
        status: RouteRealtimeStatus.NO_REALTIME_DATA,
        stops: [{ uuid: 'stop-a', arrival: null }],
        vehicles: [],
        ...go,
      },
      {
        uuid: 'subroute-1-1',
        status: RouteRealtimeStatus.NORMAL,
        stops: [
          { uuid: 'stop-b', arrival: null },
          {
            uuid: 'stop-c',
            arrival: { status: RealtimeArrivalStatus.MINUTES, minutes: 4 },
          },
        ],
        vehicles: [cityHallVehicle],
        ...back,
      },
    ],
    updated_at: '2026-03-19T02:00:00.000Z',
  }
}

function mockRouteRealtime(data: ApiRouteRealtime) {
  mockUseGetRouteRealtimeQuery.mockReturnValue({
    data,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  })
}

const targetFavoriteRouteStop: FavoriteRouteStop = {
  favoriteId: 'route-1-subroute-1-1-station-c',
  city: CityNameType.TAIPEI,
  routeUID: 'route-1',
  routeName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
  subRouteUID: 'subroute-1',
  subRouteName: { 'zh-TW': '藍1', en: 'Blue 1', ja: '', ko: '' },
  direction: DirectionType.RETURN,
  stopUID: 'stop-c',
  stopID: 'stop-c',
  stationID: 'station-c',
  stationKey: 'station-c',
  stopName: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
  stopSequence: 2,
  departure: {
    'zh-TW': '捷運昆陽站',
    en: 'MRT Kunyang Station',
    ja: '',
    ko: '',
  },
  destination: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
}

function resetRouteMocks() {
  mockToggleFavoriteRouteStop.mockReset()
  mockUseGetRouteDetailQuery.mockReset()
  mockUseGetRouteRealtimeQuery.mockReset()
  mockRouteMap.mockClear()
}

function mockRouteDetail(route: BusRoute<string>) {
  mockUseGetRouteDetailQuery.mockReturnValue({
    currentData: toRouteDetailFromTdx({
      route,
      stopOfRoutes: stopOfRoutesData,
      stops: stopsByCityData,
      shapes: [],
    }),
    isFetching: false,
    error: undefined,
  })
}

function mockDefaultRouteQueries() {
  mockRouteDetail(routeData[0]!)
  mockRouteRealtime(routeRealtimeOf())
}

function renderRoutePage(
  initialEntries: Array<string | { pathname: string; state?: unknown }> = [
    '/routes/Taipei/route-1',
  ],
  coords: [number, number] | null = null,
) {
  const store = createTestStore({
    reducer: {
      geolocation: geoSlice.reducer,
    },
    preloadedState: {
      geolocation: {
        ...geoSlice.getInitialState(),
        coords,
      },
    },
  })

  return renderRoute(<Route />, {
    path: '/routes/:city/:id',
    initialEntries,
    store,
  })
}

describe('Route', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    mockMatchMedia()
    vi.spyOn(window, 'open').mockImplementation(() => null)

    resetRouteMocks()
    mockDefaultRouteQueries()
  })

  it('moves the opened route to the front of recently viewed routes', async () => {
    localStorage.setItem(
      ROUTE_SEARCH_RECENT_STORAGE_KEY,
      JSON.stringify(['route-2', 'route-1']),
    )

    renderRoutePage()

    await waitFor(() => {
      expect(
        JSON.parse(
          localStorage.getItem(ROUTE_SEARCH_RECENT_STORAGE_KEY) ?? '[]',
        ),
      ).toEqual(['route-1', 'route-2'])
    })
  })

  it('opens Google Maps navigation with only the destination when user coordinates are unavailable', () => {
    renderRoutePage()

    fireEvent.click(
      screen.getByRole('button', { name: navigateToCityHallLabel }),
    )

    expect(window.open).toHaveBeenCalledWith(
      'https://www.google.com/maps/dir/?api=1&destination=25.03%2C121.55',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('opens Google Maps navigation with the destination', () => {
    renderRoutePage(['/routes/Taipei/route-1'], [25.033, 121.5654])

    fireEvent.click(
      screen.getByRole('button', { name: navigateToCityHallLabel }),
    )

    expect(window.open).toHaveBeenCalledWith(
      'https://www.google.com/maps/dir/?api=1&destination=25.03%2C121.55',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('highlights the saved favorite stop after opening the route page from favorites', async () => {
    renderRoutePage([
      {
        pathname: '/routes/Taipei/route-1',
        state: { favoriteRouteStop: targetFavoriteRouteStop },
      },
    ])

    await waitFor(() => {
      expect(
        screen.getByText('市政府').closest('[data-highlighted="true"]'),
      ).toBeInTheDocument()
      expect(screen.getByText(fourMinutesAwayLabel)).toBeInTheDocument()
    })
  })

  it('keeps the back button visible while base route data is loading', () => {
    mockUseGetRouteDetailQuery.mockReturnValue({
      currentData: undefined,
      isFetching: true,
      error: undefined,
    })

    renderRoutePage()

    expect(
      screen.getByLabelText(i18n.t('routePage.backToRoutes')),
    ).toBeInTheDocument()
    expect(screen.queryByText('藍1')).not.toBeInTheDocument()
    expect(screen.queryByText('載入中')).not.toBeInTheDocument()
  })

  it('renders available terminal text when only one terminal name is present', () => {
    mockRouteDetail({
      ...routeData[0]!,
      DepartureStopName: {
        'zh-TW': '市政府',
        en: 'City Hall',
        ja: '',
        ko: '',
      },
      DestinationStopName: { 'zh-TW': '', en: '', ja: '', ko: '' },
    })

    renderRoutePage()

    expect(
      screen.getByText(
        (content, element) =>
          content === '市政府' && element?.getAttribute('data-size') === 'sm',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('市政府 -')).not.toBeInTheDocument()
  })

  it('shows an inline warning when realtime queries are rate limited', async () => {
    mockRouteRealtime(
      routeRealtimeOf({ go: { status: RouteRealtimeStatus.RATE_LIMITED } }),
    )

    renderRoutePage()

    await waitFor(() => {
      expect(
        screen.getByText(routeRealtimeMessages.rateLimited.description),
      ).toBeInTheDocument()
    })
  })

  it('shows an error notice when realtime feeds are unavailable', async () => {
    mockRouteRealtime(
      routeRealtimeOf({ go: { status: RouteRealtimeStatus.UNAVAILABLE } }),
    )

    renderRoutePage()

    await waitFor(() => {
      expect(
        screen.getByText(routeRealtimeMessages.error.description),
      ).toBeInTheDocument()
    })
  })

  it('shows a no-realtime-data notice for a sub-route without buses', async () => {
    renderRoutePage()

    await waitFor(() => {
      expect(
        screen.getByText(routeRealtimeMessages.noRealtimeData.description),
      ).toBeInTheDocument()
      expect(
        screen.queryByText(routeRealtimeMessages.error.description),
      ).not.toBeInTheDocument()
    })
  })

  it('keeps stop ETA rendering available even when bus positions are unavailable', async () => {
    mockRouteRealtime(
      routeRealtimeOf({
        back: { vehicles: [{ ...cityHallVehicle, position: null }] },
      }),
    )

    renderRoutePage()

    fireEvent.click(screen.getByRole('tab', { name: '返程' }))

    await waitFor(() => {
      expect(screen.getByText(fourMinutesAwayLabel)).toBeInTheDocument()
      expect(
        screen.queryByText(routeRealtimeMessages.noRealtimeData.description),
      ).not.toBeInTheDocument()
    })

    const latestCall = mockRouteMap.mock.calls[
      mockRouteMap.mock.calls.length - 1
    ] as unknown as [{ vehicles: unknown[] }] | undefined

    expect(latestCall?.[0].vehicles).toEqual([])
  })

  it('passes vehicles with a GPS position to the route map', async () => {
    renderRoutePage()

    fireEvent.click(screen.getByRole('tab', { name: '返程' }))

    await waitFor(() => {
      const latestCall = mockRouteMap.mock.calls[
        mockRouteMap.mock.calls.length - 1
      ] as unknown as [{ vehicles: unknown[] }] | undefined
      const latestRouteMapProps = latestCall?.[0]

      expect(latestRouteMapProps?.vehicles).toEqual([
        expect.objectContaining({
          plateNumb: 'ABC-123',
          position: [121.58, 25.045],
          stopName: '市政府',
        }),
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
      const latestCall = mockRouteMap.mock.calls[
        mockRouteMap.mock.calls.length - 1
      ] as unknown as
        | [{ selectedStop: string | null; selectedVehicleId: string | null }]
        | undefined
      const latestRouteMapProps = latestCall?.[0]

      expect(latestRouteMapProps?.selectedStop).toBe('stop-c')
      expect(latestRouteMapProps?.selectedVehicleId).toBeNull()
    })
  })

  it('selects only the vehicle when clicking a realtime plate badge in the list', async () => {
    mockRouteRealtime(
      routeRealtimeOf({
        back: {
          vehicles: [
            {
              ...cityHallVehicle,
              near_stop: {
                uuid: 'stop-b',
                sequence: 1,
                name: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' },
              },
            },
          ],
        },
      }),
    )

    renderRoutePage()

    fireEvent.click(screen.getByRole('tab', { name: '返程' }))

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'ABC-123' }),
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'ABC-123' }))

    await waitFor(() => {
      const latestCall = mockRouteMap.mock.calls[
        mockRouteMap.mock.calls.length - 1
      ] as unknown as
        | [{ selectedStop: string | null; selectedVehicleId: string | null }]
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

    const latestCall = mockRouteMap.mock.calls[
      mockRouteMap.mock.calls.length - 1
    ] as unknown as
      | [
          {
            onSelectVehicle: (vehicleId: string) => void
            selectedStop: string | null
            selectedVehicleId: string | null
          },
        ]
      | undefined

    latestCall?.[0].onSelectVehicle('ABC-123')

    await waitFor(() => {
      const updatedCall = mockRouteMap.mock.calls[
        mockRouteMap.mock.calls.length - 1
      ] as unknown as
        | [{ selectedStop: string | null; selectedVehicleId: string | null }]
        | undefined
      const latestRouteMapProps = updatedCall?.[0]

      expect(latestRouteMapProps?.selectedStop).toBeNull()
      expect(latestRouteMapProps?.selectedVehicleId).toBe('ABC-123')
    })
  })

  it('shows a non-operating notice when there are no active buses but the route is outside service hours', async () => {
    mockRouteRealtime(
      routeRealtimeOf({
        go: {
          status: RouteRealtimeStatus.NO_SERVICE,
          stops: [
            {
              uuid: 'stop-a',
              arrival: {
                status: RealtimeArrivalStatus.LAST_BUS_PASSED,
                minutes: null,
              },
            },
          ],
        },
      }),
    )

    renderRoutePage()

    await waitFor(() => {
      expect(
        screen.getByText(routeRealtimeMessages.noService.description),
      ).toBeInTheDocument()
      expect(
        screen.getByText(t('routePage.realtime.stopStatus.lastBusPassed')),
      ).toBeInTheDocument()
      expect(
        screen.queryByText(routeRealtimeMessages.error.description),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText(routeRealtimeMessages.noRealtimeData.description),
      ).not.toBeInTheDocument()
    })
  })

  it('opens the drawer by default on small screens', async () => {
    mockMatchMedia({
      matches: (query) => query.includes(themeBreakpointsSmMaxWidth()),
    })

    renderRoutePage()

    await waitFor(() => {
      expect(
        screen
          .getAllByTestId('route-sidebar-state')
          .some((element) => element.textContent === 'opened'),
      ).toBe(true)
    })
  })
})

function themeBreakpointsSmMaxWidth() {
  return '48em'
}
