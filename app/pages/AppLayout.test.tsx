// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute } from '~/test/render'
import AppLayout from './AppLayout'

const {
  mockDispatch,
  mockUseSelector,
  mockFetchCityGeoJSON,
  mockUseWatchGeo
} = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockUseSelector: vi.fn(),
  mockFetchCityGeoJSON: vi.fn(),
  mockUseWatchGeo: vi.fn()
}))

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
    Outlet: () => <div>outlet</div>
  }
})

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
  return renderRoute(<AppLayout />, {
    path: '*'
  })
}

describe('AppLayout', () => {
  beforeEach(() => {
    mockDispatch.mockReset()
    mockUseSelector.mockReset()
    mockFetchCityGeoJSON.mockReset()
    mockUseWatchGeo.mockReset()
    mockFetchCityGeoJSON.mockReturnValue({ type: 'cityGeo/fetchCityGeoJSON' })
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
