// @vitest-environment jsdom

import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import i18n from '~/modules/i18n'
import { AppLocaleType, BearingType, CityNameType } from '@bus/shared'
import type { NearbyStation } from '~/modules/interfaces/Nearby'
import { createTestStore } from '~/test/createTestStore'
import { renderWithStore } from '~/test/render'
import { NearbyStationTitle } from './NearbyStationTitle'

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

describe('NearbyStationTitle', () => {
  it('renders only the stop name', () => {
    renderWithStore(<NearbyStationTitle station={station} />, {
      store: createTestStore(),
    })

    expect(screen.getByText(stopNameZhTW)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders the stop name with its bearing label when available', () => {
    renderWithStore(
      <NearbyStationTitle
        station={{
          ...station,
          bearings: [BearingType.NORTH, BearingType.SOUTH],
        }}
      />,
      { store: createTestStore() },
    )

    expect(screen.getByText(stopNameZhTW)).toBeInTheDocument()
    const northBearingLabel = t('common.bearing.north')
    const southBearingLabel = t('common.bearing.south')
    expect(
      screen.getByText(
        (content) =>
          content === `${southBearingLabel} / ${northBearingLabel}` ||
          content === `${northBearingLabel} / ${southBearingLabel}`,
      ),
    ).toBeInTheDocument()
  })
})
