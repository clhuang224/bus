// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { MantineProvider } from '@mantine/core'
import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppLayout from './AppLayout'

const {
  mockDispatch,
  mockUseSelector,
  mockFetchCityGeoJSON,
  mockUseWatchGeo,
  mockUseLocation
} = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockUseSelector: vi.fn(),
  mockFetchCityGeoJSON: vi.fn(),
  mockUseWatchGeo: vi.fn(),
  mockUseLocation: vi.fn()
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

vi.mock('react-redux', async () => {
  const actual = await vi.importActual<typeof import('react-redux')>('react-redux')
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: mockUseSelector
  }
})

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    Outlet: () => <div>outlet</div>,
    useLocation: mockUseLocation
  }
})

vi.mock('~/components/AreaSelect', () => ({
  AreaSelect: () => <div>area-select</div>
}))

vi.mock('~/components/AppNavLink', () => ({
  AppNavLink: ({ label }: { label: string }) => <div>{label}</div>
}))

vi.mock('~/modules/hooks/useWatchGeo', () => ({
  useWatchGeo: mockUseWatchGeo
}))

vi.mock('~/modules/slices/cityGeoSlice', () => ({
  fetchCityGeoJSON: mockFetchCityGeoJSON
}))

function renderAppLayout() {
  return render(
    <MantineProvider>
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    </MantineProvider>
  )
}

describe('AppLayout', () => {
  beforeEach(() => {
    mockDispatch.mockReset()
    mockUseSelector.mockReset()
    mockFetchCityGeoJSON.mockReset()
    mockUseWatchGeo.mockReset()
    mockUseLocation.mockReset()

    mockUseLocation.mockReturnValue({ pathname: '/' })
    mockFetchCityGeoJSON.mockReturnValue({ type: 'cityGeo/fetchCityGeoJSON' })
  })

  afterEach(() => {
    cleanup()
  })

  it('dispatches city geo fetch when geojson is missing', () => {
    mockUseSelector.mockImplementation((selector: (state: unknown) => unknown) => selector({
      geolocation: {
        coords: null
      },
      cityGeo: {
        geojson: null
      }
    }))

    renderAppLayout()

    expect(mockFetchCityGeoJSON).toHaveBeenCalledOnce()
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'cityGeo/fetchCityGeoJSON' })
  })

  it('does not dispatch city geo fetch when geojson already exists', () => {
    mockUseSelector.mockImplementation((selector: (state: unknown) => unknown) => selector({
      geolocation: {
        coords: null
      },
      cityGeo: {
        geojson: {
          type: 'FeatureCollection',
          features: []
        }
      }
    }))

    renderAppLayout()

    expect(mockFetchCityGeoJSON).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
