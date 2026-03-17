// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { MantineProvider } from '@mantine/core'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AreaType } from '~/modules/enums/AreaType'
import { CityNameType } from '~/modules/enums/CityNameType'
import Search from './Search'

const { mockUseGetRoutesByAreaQuery, mockUseOutletContext } = vi.hoisted(() => ({
  mockUseGetRoutesByAreaQuery: vi.fn(),
  mockUseOutletContext: vi.fn()
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

vi.mock('~/modules/apis/bus', () => ({
  busApi: {
    useGetRoutesByAreaQuery: mockUseGetRoutesByAreaQuery
  }
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useOutletContext: mockUseOutletContext
  }
})

const routesData = [
  {
    RouteUID: 'route-1',
    RouteID: '1',
    HasSubRoutes: true,
    Operators: [],
    AuthorityID: '005',
    ProviderID: 'provider-1',
    SubRoutes: [],
    BusRouteType: 0,
    RouteName: { zh_TW: '藍1', en: 'Blue 1' },
    DepartureStopName: { zh_TW: '市政府', en: 'City Hall' },
    DestinationStopName: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' },
    TicketPriceDescription: { zh_TW: '', en: '' },
    FareBufferZoneDescription: { zh_TW: '', en: '' },
    RouteMapImageUrl: '',
    City: CityNameType.TAIPEI,
    CityCode: 'TPE',
    UpdateTime: '2026-03-17T10:00:00+08:00',
    VersionID: 1
  },
  {
    RouteUID: 'route-2',
    RouteID: '2',
    HasSubRoutes: true,
    Operators: [],
    AuthorityID: '005',
    ProviderID: 'provider-2',
    SubRoutes: [],
    BusRouteType: 0,
    RouteName: { zh_TW: '紅25', en: 'Red 25' },
    DepartureStopName: { zh_TW: '台北車站', en: 'Taipei Main Station' },
    DestinationStopName: { zh_TW: '北門', en: 'Beimen' },
    TicketPriceDescription: { zh_TW: '', en: '' },
    FareBufferZoneDescription: { zh_TW: '', en: '' },
    RouteMapImageUrl: '',
    City: CityNameType.TAIPEI,
    CityCode: 'TPE',
    UpdateTime: '2026-03-17T10:00:00+08:00',
    VersionID: 1
  }
]

const renderSearch = (initialEntries = ['/search']) => render(
  <MantineProvider>
    <MemoryRouter initialEntries={initialEntries}>
      <Search />
    </MemoryRouter>
  </MantineProvider>
)

describe('Search', () => {
  beforeEach(() => {
    mockUseGetRoutesByAreaQuery.mockReset()
    mockUseOutletContext.mockReset()

    mockUseOutletContext.mockReturnValue({
      area: AreaType.TAIPEI
    })
    mockUseGetRoutesByAreaQuery.mockReturnValue({
      data: routesData,
      isLoading: false,
      error: null
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('shows the current area from layout context', () => {
    renderSearch()

    expect(screen.getByText('目前搜尋範圍：雙北')).toBeInTheDocument()
  })

  it('filters routes by the entered keyword', async () => {
    renderSearch()

    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: '紅25' }
    })

    await waitFor(() => {
      expect(screen.getAllByText('紅25').length).toBeGreaterThan(0)
      expect(screen.queryByText('藍1')).not.toBeInTheDocument()
    })
  })

  it('reads the keyword from the search params', async () => {
    renderSearch(['/search?keyword=紅25'])

    await waitFor(() => {
      expect(screen.getAllByRole('textbox')[0]).toHaveValue('紅25')
      expect(screen.getAllByText('紅25').length).toBeGreaterThan(0)
      expect(screen.queryByText('藍1')).not.toBeInTheDocument()
    })
  })
})
