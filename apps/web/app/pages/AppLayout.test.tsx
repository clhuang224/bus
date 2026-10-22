// @vitest-environment jsdom

import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '~/modules/i18n'
import { renderRoute } from '~/test/render'
import AppLayout from './AppLayout'

const {
  mockDispatch,
  mockUseSelector,
  mockFetchCityGeoJSON,
  mockUseGoogleAnalytics,
  mockUseWatchGeo,
  mockUseMediaQuery,
} = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockUseSelector: vi.fn(),
  mockFetchCityGeoJSON: vi.fn(),
  mockUseGoogleAnalytics: vi.fn(),
  mockUseWatchGeo: vi.fn(),
  mockUseMediaQuery: vi.fn(),
}))

vi.mock('react-redux', async () => {
  const actual =
    await vi.importActual<typeof import('react-redux')>('react-redux')
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: mockUseSelector,
  }
})

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    Outlet: () => <div>outlet</div>,
  }
})

vi.mock('@mantine/hooks', async () => {
  const actual =
    await vi.importActual<typeof import('@mantine/hooks')>('@mantine/hooks')
  return {
    ...actual,
    useMediaQuery: mockUseMediaQuery,
  }
})

vi.mock('~/components/AppNavLink', () => ({
  AppNavLink: ({
    label,
    ariaLabel,
  }: {
    label?: string
    ariaLabel?: string
  }) => <div aria-label={ariaLabel ?? label}>{label}</div>,
}))

vi.mock('~/modules/hooks/app/useWatchGeo', () => ({
  useWatchGeo: mockUseWatchGeo,
}))

vi.mock('~/modules/hooks/app/useGoogleAnalytics', () => ({
  useGoogleAnalytics: mockUseGoogleAnalytics,
}))

vi.mock('~/modules/slices/cityGeoSlice', () => ({
  fetchCityGeoJSON: mockFetchCityGeoJSON,
}))

function renderAppLayout(initialEntries = ['/']) {
  return renderRoute(<AppLayout />, {
    path: '*',
    initialEntries,
  })
}

describe('AppLayout', () => {
  beforeEach(() => {
    mockDispatch.mockReset()
    mockUseSelector.mockReset()
    mockFetchCityGeoJSON.mockReset()
    mockUseGoogleAnalytics.mockReset()
    mockUseWatchGeo.mockReset()
    mockUseMediaQuery.mockReset()
    mockFetchCityGeoJSON.mockReturnValue({ type: 'cityGeo/fetchCityGeoJSON' })
    mockUseMediaQuery.mockReturnValue(false)
  })

  it('dispatches city geo fetch when geojson is missing', () => {
    mockUseSelector.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({
          geolocation: {
            coords: null,
          },
          cityGeo: {
            geojson: null,
          },
        }),
    )

    renderAppLayout()

    expect(mockFetchCityGeoJSON).toHaveBeenCalledOnce()
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'cityGeo/fetchCityGeoJSON',
    })
  })

  it('does not dispatch city geo fetch when geojson already exists', () => {
    mockUseSelector.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({
          geolocation: {
            coords: null,
          },
          cityGeo: {
            geojson: {
              type: 'FeatureCollection',
              features: [],
            },
          },
        }),
    )

    renderAppLayout()

    expect(mockFetchCityGeoJSON).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('renders an accessible settings navigation entry in the desktop header', () => {
    mockUseSelector.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({
          geolocation: {
            coords: null,
          },
          cityGeo: {
            geojson: null,
          },
        }),
    )

    renderAppLayout()

    expect(mockFetchCityGeoJSON).toHaveBeenCalledOnce()
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'cityGeo/fetchCityGeoJSON',
    })
    expect(
      screen.getByLabelText(i18n.t('layout.nav.settings')),
    ).toBeInTheDocument()
  })

  it.each([
    ['desktop', false],
    ['mobile', true],
  ])(
    'shows the site heading and settings entry in the %s header',
    (_viewport, isSm) => {
      mockUseSelector.mockImplementation(
        (selector: (state: unknown) => unknown) =>
          selector({
            geolocation: {
              coords: null,
            },
            cityGeo: {
              geojson: null,
            },
          }),
      )
      mockUseMediaQuery.mockReturnValue(isSm)

      renderAppLayout(['/routes'])

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(
        screen.getByRole('heading', { level: 1, name: i18n.t('app.name') }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('link', { name: i18n.t('app.name') }),
      ).toHaveAttribute('href', '/')
      expect(
        screen.getByLabelText(i18n.t('layout.nav.settings')),
      ).toBeInTheDocument()
    },
  )
})
