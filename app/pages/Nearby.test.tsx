// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { MantineProvider } from '@mantine/core'
import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Nearby from './Nearby'
import { CityNameType } from '~/modules/enums/CityNameType'
import { GeoPermissionType } from '~/modules/enums/GeoPermissionType'

const { mockUseGetStopsByCityQuery } = vi.hoisted(() => ({
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

vi.mock('~/modules/apis/bus', () => ({
  busApi: {
    useGetStopsByCityQuery: mockUseGetStopsByCityQuery
  }
}))

vi.mock('~/modules/utils/getCityByCoords', () => ({
  getCityByCoords: () => CityNameType.TAIPEI
}))

vi.mock('~/components/NearbyStopMap', () => ({
  NearbyStopMap: () => <div data-testid="nearby-stop-map" />
}))

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
})
