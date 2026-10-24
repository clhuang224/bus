// @vitest-environment jsdom

import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '~/modules/i18n'
import { AppLocaleType, CityNameType } from '@bus/shared'
import { GeoPermissionType } from '~/modules/enums/geo/GeoPermissionType'
import type { NearbyStation } from '~/modules/interfaces/Nearby'
import geoSlice from '~/modules/slices/geoSlice'
import { createTestStore } from '~/test/createTestStore'
import { renderWithStore } from '~/test/render'
import { NearbyStationDetail } from './NearbyStationDetail'

const t = i18n.getFixedT(AppLocaleType.ZH_TW)

const station: NearbyStation = {
  stationId: 'station-1',
  name: { 'zh-TW': '市政府', en: 'City Hall', ja: '', ko: '' },
  city: CityNameType.TAIPEI,
  address: { 'zh-TW': 'Address 1', en: '', ja: '', ko: '' },
  bearings: [],
  position: [121.5654, 25.033] as [number, number],
}
const stopNameZhTW = station.name['zh-TW']
const navigateToStopLabel = t('components.routeStopList.navigateAriaLabel', {
  stopName: stopNameZhTW,
})

function renderNearbyStationDetail() {
  const store = createTestStore({
    reducer: {
      geolocation: geoSlice.reducer,
    },
    preloadedState: {
      geolocation: {
        coords: [25.0478, 121.5319],
        error: null,
        permission: GeoPermissionType.GRANTED,
        watching: false,
      },
    },
  })

  return renderWithStore(
    <NearbyStationDetail
      station={station}
      routes={[]}
      onViewStationRoutes={vi.fn()}
    />,
    { store },
  )
}

describe('NearbyStationDetail', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  it('renders stop distance when user coordinates are available', () => {
    renderNearbyStationDetail()

    const distanceSection = screen.getByText('距離').closest('div')

    expect(distanceSection).not.toBeNull()
    expect(within(distanceSection!).getByText('3.8 公里')).toBeInTheDocument()
  })

  it('opens Google Maps directions from the navigation button', () => {
    renderNearbyStationDetail()

    fireEvent.click(screen.getByRole('button', { name: navigateToStopLabel }))

    expect(window.open).toHaveBeenCalledWith(
      'https://www.google.com/maps/dir/?api=1&destination=25.033%2C121.5654',
      '_blank',
      'noopener,noreferrer',
    )
  })
})
