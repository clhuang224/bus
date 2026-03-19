// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { configureStore } from '@reduxjs/toolkit'
import { MantineProvider } from '@mantine/core'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AreaType } from '~/modules/enums/AreaType'
import { CityNameType } from '~/modules/enums/CityNameType'
import routeSearchSlice from '~/modules/slices/routeSearchSlice'
import Routes from './Routes'

const { mockUseGetRoutesByAreaQuery } = vi.hoisted(() => ({
  mockUseGetRoutesByAreaQuery: vi.fn()
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

vi.mock('~/components/AreaSelect', () => ({
  AreaSelect: ({
    value,
    onChange
  }: {
    value: string
    onChange: (value: AreaType) => void
  }) => (
    <select
      aria-label="area-select"
      value={value}
      onChange={(event) => onChange(event.target.value as AreaType)}
    >
      {Object.values(AreaType).map((area) => (
        <option key={area} value={area}>
          {area}
        </option>
      ))}
    </select>
  )
}))

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
    RouteUID: 'route-1',
    RouteID: '1-duplicate',
    HasSubRoutes: true,
    Operators: [],
    AuthorityID: '005',
    ProviderID: 'provider-1-duplicate',
    SubRoutes: [],
    BusRouteType: 0,
    RouteName: { zh_TW: '藍1', en: 'Blue 1' },
    DepartureStopName: { zh_TW: '市政府', en: 'City Hall' },
    DestinationStopName: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' },
    TicketPriceDescription: { zh_TW: '', en: '' },
    FareBufferZoneDescription: { zh_TW: '', en: '' },
    RouteMapImageUrl: '',
    City: CityNameType.NEW_TAIPEI,
    CityCode: 'NWT',
    UpdateTime: '2026-03-17T10:05:00+08:00',
    VersionID: 2
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

function createStore(preloadedRouteSearchState?: {
  keyword?: string
  selectedArea?: AreaType | null
}) {
  return configureStore({
    reducer: {
      geolocation: () => ({
        coords: [25.033, 121.5654] as [number, number]
      }),
      cityGeo: () => ({
        geojson: null
      }),
      routeSearch: routeSearchSlice.reducer
    },
    preloadedState: {
      routeSearch: {
        keyword: preloadedRouteSearchState?.keyword ?? '',
        selectedArea: preloadedRouteSearchState?.selectedArea ?? null
      }
    }
  })
}

const renderRoutes = (preloadedRouteSearchState?: {
  keyword?: string
  selectedArea?: AreaType | null
}) => {
  const store = createStore(preloadedRouteSearchState)

  return {
    store,
    ...render(
      <Provider store={store}>
        <MantineProvider>
          <MemoryRouter initialEntries={['/routes']}>
            <Routes />
          </MemoryRouter>
        </MantineProvider>
      </Provider>
    )
  }
}

describe('Routes', () => {
  beforeEach(() => {
    mockUseGetRoutesByAreaQuery.mockReset()
    mockUseGetRoutesByAreaQuery.mockReturnValue({
      data: routesData,
      isLoading: false,
      error: null
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('shows the manually selected area from store state', () => {
    const { store } = renderRoutes({
      selectedArea: AreaType.TAICHUNG
    })

    expect(store.getState().routeSearch.selectedArea).toBe(AreaType.TAICHUNG)
    expect(screen.getByLabelText('area-select')).toHaveValue(AreaType.TAICHUNG)
  })

  it('falls back to the located area when the user has not picked one', () => {
    renderRoutes()

    expect(screen.getByLabelText('area-select')).toHaveValue(AreaType.TAIPEI)
  })

  it('updates the selected area from the picker', async () => {
    const { store } = renderRoutes()

    fireEvent.change(screen.getByLabelText('area-select'), {
      target: { value: AreaType.TAICHUNG }
    })

    await waitFor(() => {
      expect(store.getState().routeSearch.selectedArea).toBe(AreaType.TAICHUNG)
      expect(screen.getByLabelText('area-select')).toHaveValue(AreaType.TAICHUNG)
    })
  })

  it('deduplicates routes that share the same RouteUID', () => {
    renderRoutes()

    expect(screen.getAllByText('藍1')).toHaveLength(1)
  })

  it('filters routes by the entered keyword', async () => {
    const { store } = renderRoutes()

    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: '紅25' }
    })

    await waitFor(() => {
      expect(store.getState().routeSearch.keyword).toBe('紅25')
      expect(screen.getAllByText('紅25').length).toBeGreaterThan(0)
      expect(screen.queryByText('藍1')).not.toBeInTheDocument()
    })
  })

  it('shows the saved keyword from store state', async () => {
    renderRoutes({
      keyword: '紅25'
    })

    await waitFor(() => {
      expect(screen.getAllByRole('textbox')[0]).toHaveValue('紅25')
      expect(screen.getAllByText('紅25').length).toBeGreaterThan(0)
      expect(screen.queryByText('藍1')).not.toBeInTheDocument()
    })
  })
})
