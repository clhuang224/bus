// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { MantineProvider } from '@mantine/core'
import { configureStore } from '@reduxjs/toolkit'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Nearby from './Nearby'
import { CityNameType } from '~/modules/enums/CityNameType'
import { GeoPermissionType } from '~/modules/enums/GeoPermissionType'

const { mockUseGetStopsByCityQuery, mockNearbyStopMap } = vi.hoisted(() => ({
  mockUseGetStopsByCityQuery: vi.fn(),
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
    useGetStopsByCityQuery: mockUseGetStopsByCityQuery
  }
}))

vi.mock('~/modules/utils/getCityByCoords', () => ({
  getCityByCoords: () => CityNameType.TAIPEI
}))

vi.mock('~/components/NearbyStopMap', () => ({
  NearbyStopMap: (props: {
    selectedStop: string | null
    onSelectStop: (id: string | null) => void
    markers: Array<{ stopUID: string, label: string }>
  }) => {
    mockNearbyStopMap(props)
    return <div data-testid="nearby-stop-map" />
  }
}))

const nearbyStopsData = [
  {
    StopUID: 'stop-1',
    StopName: { zh_TW: '市政府', en: 'City Hall' },
    City: 'Taipei',
    StopAddress: 'Address 1',
    position: [121.5654, 25.033]
  },
  {
    StopUID: 'stop-2',
    StopName: { zh_TW: '台北車站', en: 'Taipei Main Station' },
    City: 'Taipei',
    StopAddress: 'Address 2',
    position: [121.567, 25.034]
  }
]

function renderNearby({
  coords = null,
  permission = GeoPermissionType.PROMPT,
  queryState
}: {
  coords?: [number, number] | null
  permission?: GeoPermissionType
  queryState?: {
    data?: unknown[]
    isLoading?: boolean
    error?: unknown
    isSuccess?: boolean
  }
} = {}) {
  const store = configureStore({
    reducer: {
      geolocation: () => ({
        coords,
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

  mockUseGetStopsByCityQuery.mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
    isSuccess: false,
    ...queryState
  })

  return render(
    <MantineProvider>
      <Provider store={store}>
        <Nearby />
      </Provider>
    </MantineProvider>
  )
}

describe('Nearby', () => {
  beforeEach(() => {
    mockUseGetStopsByCityQuery.mockReset()
    mockNearbyStopMap.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows a denied-location message when geolocation permission is denied', () => {
    renderNearby({
      permission: GeoPermissionType.DENIED
    })

    expect(screen.getByText('無法取得位置')).toBeInTheDocument()
    expect(screen.getByText('請在瀏覽器設定中允許此網站存取您的位置資訊')).toBeInTheDocument()
  })

  it('shows a locating message while waiting for coordinates', () => {
    renderNearby()

    expect(screen.getByText('定位中')).toBeInTheDocument()
    expect(screen.getByText('正在取得您的目前位置，請稍候...')).toBeInTheDocument()
  })

  it('shows a loading message after coordinates are available and nearby stops are loading', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        isLoading: true
      }
    })

    expect(screen.getByText('載入中')).toBeInTheDocument()
    expect(screen.getByText('正在取得附近的站牌資料，請稍候...')).toBeInTheDocument()
  })

  it('shows an error message when nearby stop data fails to load', () => {
    renderNearby({
      coords: [25.033, 121.5654],
      permission: GeoPermissionType.GRANTED,
      queryState: {
        error: new Error('network error')
      }
    })

    expect(screen.getByText('載入站牌資料失敗')).toBeInTheDocument()
    expect(screen.getByText('請稍後再試，或確認您的網路連線')).toBeInTheDocument()
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

    expect(screen.getByText('附近沒有站牌')).toBeInTheDocument()
    expect(screen.getByText('目前在您附近沒有找到任何站牌')).toBeInTheDocument()
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
      firstRenderProps?.onSelectStop('stop-1')
    })

    const updatedProps = mockNearbyStopMap.mock.calls.at(-1)?.[0]
    expect(updatedProps?.selectedStop).toBe('stop-1')
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
    expect(updatedProps?.selectedStop).toBe('stop-1')
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
      firstRenderProps?.onSelectStop('stop-1')
    })

    expect(screen.getByRole('button', { name: '市政府' })).toHaveAttribute('aria-expanded', 'true')
  })
})
