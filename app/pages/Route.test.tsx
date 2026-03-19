// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route as RouterRoute, Routes as RouterRoutes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CityNameType } from '~/modules/enums/CityNameType'
import { DirectionType } from '~/modules/enums/DirectionType'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'
import Route from './Route'

const {
  mockToggleFavoriteRouteStop,
  mockUseGetRouteShapesByRouteQuery,
  mockUseGetRoutesByCityQuery,
  mockUseGetStopOfRoutesByCityQuery,
  mockUseGetStopsByCityQuery
} = vi.hoisted(() => ({
  mockToggleFavoriteRouteStop: vi.fn(),
  mockUseGetRouteShapesByRouteQuery: vi.fn(),
  mockUseGetRoutesByCityQuery: vi.fn(),
  mockUseGetStopOfRoutesByCityQuery: vi.fn(),
  mockUseGetStopsByCityQuery: vi.fn()
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

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  writable: true,
  value: vi.fn()
})

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

describe('Route', () => {
  beforeEach(() => {
    mockToggleFavoriteRouteStop.mockReset()
    mockUseGetRouteShapesByRouteQuery.mockReset()
    mockUseGetRoutesByCityQuery.mockReset()
    mockUseGetStopOfRoutesByCityQuery.mockReset()
    mockUseGetStopsByCityQuery.mockReset()

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

    mockUseGetRouteShapesByRouteQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    })
  })

  it('highlights the saved favorite stop after opening the route page from favorites', async () => {
    render(
      <MantineProvider>
        <MemoryRouter
          initialEntries={[{
            pathname: '/routes/Taipei/route-1',
            state: { favoriteRouteStop: targetFavoriteRouteStop }
          }]}
        >
          <RouterRoutes>
            <RouterRoute path="/routes/:city/:id" element={<Route />} />
          </RouterRoutes>
        </MemoryRouter>
      </MantineProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('2. 市政府').closest('[data-highlighted="true"]')).toBeInTheDocument()
      expect(screen.queryByText('1. 市政府')).not.toBeInTheDocument()
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

    render(
      <MantineProvider>
        <MemoryRouter initialEntries={['/routes/Taipei/route-1']}>
          <RouterRoutes>
            <RouterRoute path="/routes/:city/:id" element={<Route />} />
          </RouterRoutes>
        </MemoryRouter>
      </MantineProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('route-sidebar-state')).toHaveTextContent('opened')
    })
  })
})
