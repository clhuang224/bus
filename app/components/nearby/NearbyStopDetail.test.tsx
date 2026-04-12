// @vitest-environment jsdom

import type { Reducer, UnknownAction } from '@reduxjs/toolkit'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CityNameType } from '~/modules/enums/CityNameType'
import { GeoPermissionType } from '~/modules/enums/geo/GeoPermissionType'
import geoSlice from '~/modules/slices/geoSlice'
import { createTestStore } from '~/test/createTestStore'
import { renderWithStore } from '~/test/render'
import { NearbyStopDetail } from './NearbyStopDetail'

const stopGroup = {
  StationID: 'station-1',
  StopName: { 'zh-TW': '市政府', en: 'City Hall' },
  City: CityNameType.TAIPEI,
  position: [121.5654, 25.033] as [number, number],
  stops: [{
    StopUID: 'stop-1',
    StopID: 'stop-1',
    AuthorityID: '005',
    StationID: 'station-1',
    StationGroupID: 'group-1',
    position: [121.5654, 25.033] as [number, number],
    GeoHash: null,
    StopName: { 'zh-TW': '市政府', en: 'City Hall' },
    StopAddress: 'Address 1',
    Bearing: null,
    StopDescription: null,
    City: CityNameType.TAIPEI,
    UpdateTime: '2026-04-12T10:00:00+08:00',
    VersionID: 1
  }]
}

function renderNearbyStopDetail(displayMode: 'content' | 'full' | 'title' = 'content') {
  const store = createTestStore({
    reducer: {
      geolocation: geoSlice.reducer as unknown as Reducer<unknown, UnknownAction>
    },
    preloadedState: {
      geolocation: {
        coords: [25.0478, 121.5319],
        error: null,
        permission: GeoPermissionType.GRANTED,
        watching: false
      }
    }
  })

  return renderWithStore(
    <NearbyStopDetail
      stopGroup={stopGroup}
      routes={[]}
      onViewRoutes={vi.fn()}
      displayMode={displayMode}
    />,
    { store }
  )
}

describe('NearbyStopDetail', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  it('renders a navigation button in title mode', () => {
    renderNearbyStopDetail('title')

    expect(screen.getByRole('button', { name: /導航至\s*市政府/ })).toBeInTheDocument()
  })

  it('opens Google Maps directions from the navigation button', () => {
    renderNearbyStopDetail()

    fireEvent.click(screen.getByRole('button', { name: /導航至\s*市政府/ }))

    expect(window.open).toHaveBeenCalledWith(
      'https://www.google.com/maps/dir/?api=1&destination=25.033%2C121.5654&origin=25.0478%2C121.5319',
      '_blank',
      'noopener,noreferrer'
    )
  })
})
