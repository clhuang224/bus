// @vitest-environment jsdom

import type { Reducer, UnknownAction } from '@reduxjs/toolkit'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '~/modules/i18n'
import { AreaType } from '~/modules/enums/AreaType'
import { AppLocaleType } from '~/modules/enums/AppLocaleType'
import { CityNameType } from '~/modules/enums/CityNameType'
import routeSearchSlice from '~/modules/slices/routeSearchSlice'
import { ROUTE_SEARCH_FREQUENCY_STORAGE_KEY } from '~/modules/utils/routeSearch/routeSearchFrequencyStorage'
import { createTestStore } from '~/test/createTestStore'
import { renderWithProvidersAndRouter } from '~/test/render'
import Routes from './Routes'

const t = i18n.getFixedT(AppLocaleType.ZH_TW)
const routeInfoOriginLabel = `${t('components.routeInfoCard.departureLabel')}: 市政府`

const { mockUseGetRoutesByAreaQuery } = vi.hoisted(() => ({
  mockUseGetRoutesByAreaQuery: vi.fn()
}))

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
    RouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
    DepartureStopName: { 'zh-TW': '市政府', en: 'City Hall' },
    DestinationStopName: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' },
    TicketPriceDescription: { 'zh-TW': '', en: '' },
    FareBufferZoneDescription: { 'zh-TW': '', en: '' },
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
    RouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
    DepartureStopName: { 'zh-TW': '市政府', en: 'City Hall' },
    DestinationStopName: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' },
    TicketPriceDescription: { 'zh-TW': '', en: '' },
    FareBufferZoneDescription: { 'zh-TW': '', en: '' },
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
    RouteName: { 'zh-TW': '紅25', en: 'Red 25' },
    DepartureStopName: { 'zh-TW': '台北車站', en: 'Taipei Main Station' },
    DestinationStopName: { 'zh-TW': '北門', en: 'Beimen' },
    TicketPriceDescription: { 'zh-TW': '', en: '' },
    FareBufferZoneDescription: { 'zh-TW': '', en: '' },
    RouteMapImageUrl: '',
    City: CityNameType.TAIPEI,
    CityCode: 'TPE',
    UpdateTime: '2026-03-17T10:00:00+08:00',
    VersionID: 1
  },
  {
    RouteUID: 'route-3',
    RouteID: '3',
    HasSubRoutes: true,
    Operators: [],
    AuthorityID: '005',
    ProviderID: 'provider-3',
    SubRoutes: [],
    BusRouteType: 0,
    RouteName: { 'zh-TW': '市民小巴1', en: 'Citizen Shuttle 1' },
    DepartureStopName: { 'zh-TW': '圓山', en: 'Yuanshan' },
    DestinationStopName: { 'zh-TW': '劍潭', en: 'Jiantan' },
    TicketPriceDescription: { 'zh-TW': '', en: '' },
    FareBufferZoneDescription: { 'zh-TW': '', en: '' },
    RouteMapImageUrl: '',
    City: CityNameType.TAIPEI,
    CityCode: 'TPE',
    UpdateTime: '2026-03-17T10:00:00+08:00',
    VersionID: 1
  },
  {
    RouteUID: 'route-4',
    RouteID: '4',
    HasSubRoutes: true,
    Operators: [],
    AuthorityID: '005',
    ProviderID: 'provider-4',
    SubRoutes: [],
    BusRouteType: 0,
    RouteName: { 'zh-TW': '藍10', en: 'Blue 10' },
    DepartureStopName: { 'zh-TW': '動物園', en: 'Zoo' },
    DestinationStopName: { 'zh-TW': '象山', en: 'Xiangshan' },
    TicketPriceDescription: { 'zh-TW': '', en: '' },
    FareBufferZoneDescription: { 'zh-TW': '', en: '' },
    RouteMapImageUrl: '',
    City: CityNameType.TAIPEI,
    CityCode: 'TPE',
    UpdateTime: '2026-03-17T10:00:00+08:00',
    VersionID: 1
  }
]

type RoutesTestState = {
  geolocation: {
    coords: [number, number]
  }
  cityGeo: {
    geojson: null
  }
  routeSearch: {
    keyword: string
    selectedArea: AreaType | null
  }
}

function createStore(preloadedRouteSearchState?: {
  keyword?: string
  selectedArea?: AreaType | null
}) {
  return createTestStore<RoutesTestState>({
    reducer: {
      geolocation: (() => ({
        coords: [25.033, 121.5654] as [number, number]
      })) as unknown as Reducer<unknown, UnknownAction>,
      cityGeo: (() => ({
        geojson: null
      })) as unknown as Reducer<unknown, UnknownAction>,
      routeSearch: routeSearchSlice.reducer as unknown as Reducer<unknown, UnknownAction>
    },
    preloadedState: {
      locale: {
        value: AppLocaleType.ZH_TW
      },
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
    ...renderWithProvidersAndRouter(<Routes />, {
      store,
      initialEntries: ['/routes']
    })
  }
}

describe('Routes', () => {
  beforeEach(() => {
    localStorage.clear()
    mockUseGetRoutesByAreaQuery.mockReset()
    mockUseGetRoutesByAreaQuery.mockReturnValue({
      data: routesData,
      isLoading: false,
      error: null
    })
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

  it('shows route skeleton cards while routes are loading', () => {
    mockUseGetRoutesByAreaQuery.mockReturnValue({
      data: [],
      isLoading: true,
      error: null
    })

    renderRoutes()

    expect(screen.getAllByTestId('routes-skeleton-card')).toHaveLength(6)
    expect(screen.queryByText('載入中')).not.toBeInTheDocument()
  })

  it('deduplicates routes that share the same RouteUID', () => {
    renderRoutes({
      keyword: '藍1'
    })

    expect(screen.getAllByText('藍1')).toHaveLength(1)
  })

  it('renders available terminal text when only one terminal value is present', () => {
    mockUseGetRoutesByAreaQuery.mockReturnValue({
      data: [{
        ...routesData[0],
        DepartureStopName: { 'zh-TW': '市政府', en: 'City Hall' },
        DestinationStopName: { 'zh-TW': '', en: '' }
      }],
      isLoading: false,
      error: null
    })

    renderRoutes({
      keyword: '市政府'
    })

    expect(screen.getByText(routeInfoOriginLabel)).toBeInTheDocument()
    expect(screen.queryByText(`${i18n.t('components.routeInfoCard.terminalLabel')}: 市政府`)).not.toBeInTheDocument()
  })

  it('filters routes by the entered keyword', async () => {
    const { store } = renderRoutes()

    fireEvent.change(screen.getByLabelText(i18n.t('components.searchInput.ariaLabel')), {
      target: { value: '紅25' }
    })

    await waitFor(() => {
      expect(store.getState().routeSearch.keyword).toBe('紅25')
      expect(screen.getAllByText('紅25').length).toBeGreaterThan(0)
      expect(screen.queryByText('藍1')).not.toBeInTheDocument()
    })
  })

  it('shows frequently opened routes when the keyword is empty', () => {
    localStorage.setItem(ROUTE_SEARCH_FREQUENCY_STORAGE_KEY, JSON.stringify({
      'route-2': 5,
      'route-1': 1
    }))

    renderRoutes({
      keyword: ''
    })

    expect(screen.getByText(i18n.t('pages.routes.frequentRoutesTitle'))).toBeInTheDocument()
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      expect.stringContaining('紅25'),
      expect.stringContaining('藍1')
    ])
  })

  it('shows the search prompt message when the keyword is empty and there is no frequency history', () => {
    renderRoutes()

    expect(screen.getByText('開始搜尋公車')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('keeps the default name sort when the keyword is non-empty', () => {
    localStorage.setItem(ROUTE_SEARCH_FREQUENCY_STORAGE_KEY, JSON.stringify({
      'route-2': 5,
      'route-1': 1
    }))

    renderRoutes({
      keyword: '站'
    })

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      expect.stringContaining('紅25'),
      expect.stringContaining('藍1')
    ])
  })

  it('prioritizes route-name matches over departure or destination matches', () => {
    renderRoutes({
      keyword: '市'
    })

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      expect.stringContaining('市民小巴1'),
      expect.stringContaining('藍1')
    ])
  })

  it('prioritizes exact route-name matches before route-name prefix matches', () => {
    renderRoutes({
      keyword: '藍1'
    })

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      expect.stringContaining('藍1'),
      expect.stringContaining('藍10')
    ])
  })

  it('uses frequency as a fallback when routes share the same match priority', () => {
    localStorage.setItem(ROUTE_SEARCH_FREQUENCY_STORAGE_KEY, JSON.stringify({
      'route-4': 5,
      'route-1': 1
    }))

    renderRoutes({
      keyword: '藍'
    })

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      expect.stringContaining('藍10'),
      expect.stringContaining('藍1')
    ])
  })

  it('shows the saved keyword from store state', async () => {
    renderRoutes({
      keyword: '紅25'
    })

    await waitFor(() => {
      expect(screen.getByLabelText(i18n.t('components.searchInput.ariaLabel'))).toHaveValue('紅25')
      expect(screen.getAllByText('紅25').length).toBeGreaterThan(0)
      expect(screen.queryByText('藍1')).not.toBeInTheDocument()
    })
  })
})
