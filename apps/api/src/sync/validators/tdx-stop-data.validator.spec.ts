import { isTdxStop } from './tdx-stop-data.validator.js'

describe('isTdxStop', () => {
  it('accepts stops without a station group id', () => {
    expect(
      isTdxStop({
        StopUID: 'TPE-stop-1',
        StopID: 'stop-1',
        AuthorityID: '004',
        StationID: 'station-1',
        StopName: {
          Zh_tw: '測試站',
          En: 'Test Stop',
        },
        StopPosition: {
          PositionLon: 121,
          PositionLat: 25,
        },
        UpdateTime: '2026-06-25T00:00:00+08:00',
        VersionID: 1,
      }),
    ).toBe(true)
  })
})
