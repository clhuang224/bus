// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { MantineProvider } from '@mantine/core'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DirectionType } from '~/modules/enums/DirectionType'
import { CityNameType } from '~/modules/enums/CityNameType'
import RoutePage from './Route'

const {
  mockUseGetRoutesByCityQuery,
  mockUseGetStopOfRoutesByCityQuery,
  mockUseGetStopsByCityQuery,
  mockRouteMap,
  mockMatchMedia
} = vi.hoisted(() => ({
  mockUseGetRoutesByCityQuery: vi.fn(),
  mockUseGetStopOfRoutesByCityQuery: vi.fn(),
  mockUseGetStopsByCityQuery: vi.fn(),
  mockRouteMap: vi.fn(),
  mockMatchMedia: vi.fn()
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia
})

class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)

vi.mock('~/modules/apis/bus', () => ({
  busApi: {
    useGetRoutesByCityQuery: mockUseGetRoutesByCityQuery,
    useGetStopOfRoutesByCityQuery: mockUseGetStopOfRoutesByCityQuery,
    useGetStopsByCityQuery: mockUseGetStopsByCityQuery
  }
}))

vi.mock('~/components/routes/RouteMap', () => ({
  RouteMap: (props: { stops: unknown[] }) => {
    mockRouteMap(props)
    return <div data-testid="route-map" />
  }
}))

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
    UpdateTime: '2026-03-17T10:00:00+08:00',
    VersionID: 1,
    BusRouteType: 0,
    SubRoutes: [
      {
        SubRouteUID: 'subroute-1',
        SubRouteID: '1',
        OperatorIDs: [],
        SubRouteName: { zh_TW: '往捷運昆陽站', en: 'To MRT Kunyang Station' },
        Direction: DirectionType.GO,
        FirstBusTime: '',
        LastBusTime: '',
        HolidayFirstBusTime: '',
        HolidayLastBusTime: '',
        DepartureStopName: { zh_TW: '市政府', en: 'City Hall' },
        DestinationStopName: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' }
      },
      {
        SubRouteUID: 'subroute-2',
        SubRouteID: '2',
        OperatorIDs: [],
        SubRouteName: { zh_TW: '往市政府', en: 'To City Hall' },
        Direction: DirectionType.RETURN,
        FirstBusTime: '',
        LastBusTime: '',
        HolidayFirstBusTime: '',
        HolidayLastBusTime: '',
        DepartureStopName: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' },
        DestinationStopName: { zh_TW: '市政府', en: 'City Hall' }
      }
    ]
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
    SubRouteName: { zh_TW: '往捷運昆陽站', en: 'To MRT Kunyang Station' },
    Direction: DirectionType.GO,
    Stops: [
      {
        StopUID: 'stop-1',
        StopID: 'stop-id-1',
        StationID: 'station-1',
        StopSequence: 1,
        StopName: { zh_TW: '市政府', en: 'City Hall' }
      },
      {
        StopUID: 'stop-2',
        StopID: 'stop-id-2',
        StationID: 'station-2',
        StopSequence: 2,
        StopName: { zh_TW: '國父紀念館', en: 'Sun Yat-sen Memorial Hall' }
      }
    ]
  },
  {
    RouteUID: 'route-1',
    RouteID: '1',
    RouteName: { zh_TW: '藍1', en: 'Blue 1' },
    SubRouteUID: 'subroute-2',
    SubRouteID: '2',
    City: CityNameType.TAIPEI,
    SubRouteName: { zh_TW: '往市政府', en: 'To City Hall' },
    Direction: DirectionType.RETURN,
    Stops: [
      {
        StopUID: 'stop-3',
        StopID: 'stop-id-3',
        StationID: 'station-3',
        StopSequence: 1,
        StopName: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' }
      }
    ]
  }
]

const stopsByCityData = [
  {
    StopUID: 'stop-1',
    StopID: 'stop-id-1',
    StopName: { zh_TW: '市政府', en: 'City Hall' },
    GeoHash: 'hash-1',
    City: CityNameType.TAIPEI,
    StopAddress: 'Address 1',
    Bearing: 0,
    StopDescription: null,
    UpdateTime: '2026-03-17T10:00:00+08:00',
    VersionID: 1,
    position: [121.5654, 25.033]
  },
  {
    StopUID: 'stop-2',
    StopID: 'stop-id-2',
    StopName: { zh_TW: '國父紀念館', en: 'Sun Yat-sen Memorial Hall' },
    GeoHash: 'hash-2',
    City: CityNameType.TAIPEI,
    StopAddress: 'Address 2',
    Bearing: 0,
    StopDescription: null,
    UpdateTime: '2026-03-17T10:00:00+08:00',
    VersionID: 1,
    position: [121.5598, 25.041]
  }
]

function renderRoutePage() {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={['/routes/Taipei/route-1']}>
        <Routes>
          <Route path="/routes/:city/:id" element={<RoutePage />} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>
  )
}

describe('Route', () => {
  beforeEach(() => {
    mockUseGetRoutesByCityQuery.mockReset()
    mockUseGetStopOfRoutesByCityQuery.mockReset()
    mockUseGetStopsByCityQuery.mockReset()
    mockRouteMap.mockReset()
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))

    mockUseGetRoutesByCityQuery.mockReturnValue({
      data: routesData,
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
  })

  afterEach(() => {
    cleanup()
  })

  it('shows subroute tabs and the stop timeline for the active subroute', () => {
    renderRoutePage()

    expect(screen.getByText('藍1')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /往捷運昆陽站.*去程/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /往市政府.*返程/ })).toBeInTheDocument()
    expect(screen.getByText('1 市政府')).toBeInTheDocument()
    expect(screen.getByText('2 國父紀念館')).toBeInTheDocument()
  })

  it('passes mapped stop positions to the route map', () => {
    renderRoutePage()

    const mapProps = mockRouteMap.mock.calls.at(-1)?.[0]
    expect(mapProps?.stops).toEqual([
      expect.objectContaining({
        id: 'stop-1',
        sequence: 1,
        position: [121.5654, 25.033]
      }),
      expect.objectContaining({
        id: 'stop-2',
        sequence: 2,
        position: [121.5598, 25.041]
      })
    ])
  })

  it('shows the empty state when the route cannot be found', () => {
    mockUseGetRoutesByCityQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    })

    renderRoutePage()

    expect(screen.getByText('查無路線')).toBeInTheDocument()
  })

  it('opens the bottom drawer on small screens', async () => {
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))

    renderRoutePage()

    fireEvent.click(screen.getByRole('button', { name: '開啟路線列表' }))

    await waitFor(() => {
      expect(screen.getByText('藍1')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /往捷運昆陽站.*去程/ })).toBeInTheDocument()
    })
  })
})
